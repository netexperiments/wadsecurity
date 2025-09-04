#Authenticated AD Reconnaissance
Once the attacker gains a foothold on a domain, by having acquired some user credentials, there's a wide-range of information an attacker can access.

For example, the attacker can now retrieve every other user account in the domain:
```
#north.altair.local
GetADUsers.py -all north.altair.local/skyler.white:Password123 -dc-host CAPTAIN
#sirius.local
GetADUsers.py -all sirius.local/pam.beesly:IDontKnow? -dc-host KING
#altair.local
GetADUsers.py -all altair.local/lily.aldrin:ThisIsMyPassword123 -dc-host CHIEF
```

Other than users, the attacker can assess trust relationships established between the different domains:
```
ldeep ldap -u skyler.white -p 'Password123' -d north.altair.local -s ldap://192.168.122.10 trusts
ldeep ldap -u skyler.white -p 'Password123' -d north.altair.local -s ldap://192.168.122.20 trusts
ldeep ldap -u skyler.white -p 'Password123' -d north.altair.local -s ldap://192.168.122.30 trusts
```

Through tools like ldapsearch, it's possible to issue direct LDAP queries against the directory without relying on higher-level scripts or wrappers.
```
#obtain information on all users
ldapsearch -H ldap://192.168.122.10 -D 'skyler.white@north.altair.local' -w Password123 -b 'DC=north,DC=altair,DC=local' '(&(objectCategory=person)(objectClass=user))'
#List all AS-REP roastable users
ldapsearch -H ldap://192.168.122.10 -D 'skyler.white@north.altair.local' -w Password123 -b 'DC=north,DC=altair,DC=local' '(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))'
#List all Kerberoastable users
ldapsearch -H ldap://192.168.122.10 -D 'skyler.white@north.altair.local' -w Password123 -b 'DC=north,DC=altair,DC=local' '(&(objectClass=user)(servicePrincipalName=*)(!(cn=krbtgt))(!(userAccountControl:1.2.840.113556.1.4.803:=2)))'
#Retrieve GPO information
ldapsearch -H ldap://192.168.122.10 -D 'skyler.white@north.altair.local' -w Password123 -b 'CN=Policies,CN=System,DC=north,DC=altair,DC=local' '(objectClass=groupPolicyContainer)'
```


Many other types of information can be retrieved via LDAP using only low-privileged, valid credentials. LDAP serves as a core data source for auditing and reconnaissance in AD environments. Tools designed for AD security assessments rely on LDAP to collect details about users, group memberships, ACLs, computer objects, GPOs, trust relationships, and more. This makes LDAP a powerful resource for mapping out and auditing the entire domain structure.

An attacker with authenticated access to AD can also check file shares. With new credentials, the attacker might have access to different shares, which may contain information on the AD environment.

```
crackmapexec smb 192.168.122.10 -u 'skyler.white' -p 'Password123' --shares
```
With skyler's credentials, we have access to new shares! Let's take a peak.

```
smbclient //192.168.122.10/ImportantNotes -U 'skyler.white'
#Enter 'Password123' when the password is requested
ls 
get note.txt
exit
cat note.txt
```
Seems like there's an Holly Flax person from Human Resources. She's from SIRIUS domain, so this account might have access to sensitive employee information, as well as cross-domain presence. A valuable target for an attacker...


!!!question
    How useful are LDAP queries to attackers and what do they require? 
??? success "Answer"
    LDAP queries are very useful for attackers. They allow an attacker to enumerate users and groups, identify attack targets (AS-REP roastable and Kerberoastable accounts), dicover trust relationships, and more. To access LDAP and issue queries, an attacker needs valid account credentials. Even low-privileged credentials are enough as by default most directory information in Active Directory can be read by any authenticated user.


!!!question
    Could you retrieve new usernames? What attacks can now be used in order to uncover their passwords?
??? success "Answer"
    Yes, new users were uncovered. With the usernames, the attacker can now try Password Spraying, AS-REP roasting, or Kerberoasting attacks to potentially retrieve new passwords.

!!!question 
    Which trusts are established in this environment?
??? success "Answer"
    There's a parent-child trust relationship between north and altair, and a forest trust relationship between altair and sirius. Since the mentioned trusts are transitive, the north domain transitively trusts sirius and vice-versa.

