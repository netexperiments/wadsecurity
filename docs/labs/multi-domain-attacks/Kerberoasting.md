#Kerberoasting

This attack is similar to AS-REP roasting. In AS-REP roasting, the attacker retrieves a user's TGT through an AS-REP message since this user does not require Kerberos pre-authentication. In this case, the attacker will retrieve a TGS for a determined service and crack the service's account password offline, since TGSs are encrypted using the service's account password, like how AS-REP encrypted sections are encrypted using user account passwords.

The target of a Kerberoasting attacks are user accounts with an associated SPN. Regular service accounts, such as accounts used by IIS or MSSQL services have long, random passwords that change regularly. User accounts with an associated SPN, however, may have common passwords that are relatively easy to crack, thus being the preferable targets for this attack.

First, the attacker will then look for user accounts that have an associated SPN using Impacket, for example:

```
GetUserSPNs.py -dc-ip 192.168.122.10 north.altair.local/skyler.white:Password123 -outputfile kerberoasting.hashes
```

It seems that we were able to retrieve 3 TGS from 3 different user accounts with an associated SPN: walter.white, saul.goodman, and jesse.pinkman. At this point, we've already uncovered Jesse (AS-REP Roasting) and Saul's (Password in description) passwords. Let's focus on Walter's. With a TGS for Walter's service, we can use hashcat along with [passwords.txt](../multi-domain-attacks/passwords.txt) once again, to crack its password:

```
#remember hashcat and GNS3 VMs aren't friends, i suggest you install hashcat on your machine.
hashcat -m 13100 kerberoasting.hashes ./passwords.txt --force --quiet
```

!!! question
    Can this attack be perpetrated against any account in AD?
??? success "Answer"
    No, this attack can only be perpetrated against service accounts. Preferebly, user accounts with an associated SPN.
!!! question
    Does the attacker need user credentials to perpetrate this attack?
??? success "Answer"
    Yes, the attacker needs to be able to request a TGS to access the target service account. This can only be done by first authenticating as some other account, requiring credential access.