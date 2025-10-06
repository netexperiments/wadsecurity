#DCSync

A DCSync attack is used for extracting domain secrets. An attacker can execute such an attack when it reaches domain admin privileges for example. Once this attack is executed, an attacker will hold every domain account credential, having fully compromised the domain.

To execute this attack, you can use the Administrator password, supposedly retrieved in the LLMNR poisoning attack, and the 'secretsdump.py' Impacket script:
```
secretsdump.py -just-dc Administrator:Passw0rd@captain.north.altair.local
```

And just like that, you've compromised the north.altair.local domain.

!!! question
    Is the Administrator password required to DCSync?
??? success "Answer"
    No. Any principal with the Replicating Directory Changes/Replicating Directory Changes All extended rights can DCSync.
!!! question 
    What kinds of credentials are retrieved through a DCSync attack?
??? success "Answer"
    NTLM password hashes, Kerberos long-term keys, and entries for users and machine accounts (such as  CAPTAIN$ and krbtgt). No cleartext passwords are retrieved.
!!! question
    What does the krbtgt account represent and what can an attacker do with its credentials?
??? success "Answer"
    The krbtgt account is the built-in account the domain’s KDC uses to sign and encrypt TGTs.
    If an attacker gets its credentials, they can forge Golden Tickets to impersonate any user and request any service tickets at will.