#Constrained Delegation Abuse

Misconfigured constrained delegation rights may lead to domain compromise. This abuse doesn't necessarily take advantage of a vulnerability or a bug, but rather from misconfigurations. The attacker simply takes advantage of them.

Upon acquiring valid user credentials, an attacker may look for delegation rights configured in a domain. This way, an attacker can target valuable accounts, such as accounts that are configured for constrained delegations for sensitive services, such as the SMB/CIFS service running on a domain controller.

The attacker can look for configured delegation rights by using Impacket's 'findDelegation.py' script:
```
findDelegation.py POLARIS.LOCAL/skyler.white:Password123 -target-domain polaris.local
```
The output of this script shows us that Walter is configured for constrained delegation, being able to delegate tickets to the SMB service running on the domain controller! This means that if the attacker can compromise Walter's account, they can impersonate the administrator account and access this service as the administrator! This is possible thanks to the S4U2Self and S4U2Proxy protocol extensions used in Kerberos' constrained delegation.

In the Kerberoasting section of the lab we've targeted Walter's account, and cracked his password using Hashcat (hopefully). If you haven't been able to crack Walter's password, I'll let you in on it: 'Metho1o590oA$elry'.

Since we've compromised Walter's account, we can now take advantage of this misconfiguration where a low-privileged account has delegation rights to a sensitive service:
```
#retrieve a ticket for the CIFS service in the domain controller as the admin through S4U2Self and S4U2Proxy
getST.py -spn 'CIFS/captain.polaris.local' -impersonate Administrator -dc-ip '192.168.122.10' 'polaris.local/walter.white:Metho1o590oA$elry'
#set the krb5ccname environment var to the new ccache file
export KRB5CCNAME=/home/ubuntu/Administrator.ccache
#use the ticket to access the domain controller through a shell as the administrator through the SMB protocol
psexec.py  -k -no-pass POLARIS.LOCAL/Administrator@captain.polaris.local
```

And just like that we can issue commands in the DC as SYSTEM by leveraging a TGS issued on the Administrator behalf! By abusing a misconfigured delegation right, a low-privileged user escalated directly to Domain Admin, without needing to exploit any vulnerability.

!!! question
    What's S4U2Self and S4U2Proxy role in this attack?
??? success "Answer"
    The attacker, using Walter's account, can use the S4U2Self extension in order to request a service ticket to its own service, on behalf of the Administrator. By having a ticket from the Administrator to its own service, Walter can then use the S4U2Proxy extension, which retrieves a service ticket in name of the Administrator (in this case) for the CIFS service in CAPTAIN, and use this ticket, impersonating the Administrator while accessing the CIFS service in CAPTAIN. All of this is possible since Walter is allowed to perform constrained delegation to the CIFS service in CAPTAIN.

!!! question
    How can this attack be mitigated?
??? success "Answer"
    This attack can be mitigated by not configuring constrained delegation permissions from low-privileged accounts to sensitive services. This way, simply by compromising user accounts, an attacker shouldn't be able to access a service as the administrator. Delegation to sensitive services needs to be carefully planned and accounts that can delegate tickets to such services should be very well protected, to prevent these scenarios.
