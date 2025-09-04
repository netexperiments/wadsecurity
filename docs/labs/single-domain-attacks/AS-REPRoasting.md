#AS_REP Roasting

This attack targets user accounts that are configured to not use pre-authentication in Kerberos authentication. The first step in Kerberos is to retrieve a TGT on the user's behalf. To do so, normally, user's must pre-authenticate themselves. This pre-authentication step proves the user has knowledge of its own password, and allows the user to retrieve a TGT.

When pre-authentication isn't required for some user, they do not need to provide their password to retrieve a TGT. Thus, an attacker without password knowledge can retrieve TGTs for users with no pre-authentication required. 

The TGT is only usable if the user has password knowledge. The AS-REP message sent to the user contains both a TGT and an encrypted section. The latter section is encrypted using the user's password. Thus, the attacker's objective isn't simply retrieving the TGT (the attacker doesn't know the password so they can't use it), but instead, discover the user's password through offline cracking of the AS-REP encrypted section.

Once the attacker retrieves the AS-REP message, it can use a list of common passwords to attempt and decrypt the password-encrypted section. If some password is able to decrypt this section, it means that the password belongs to the user to whom the AS-REP was issued.

To execute this attack, use the [polaris_users2.txt](../single-domain-attacks/polaris_users2.txt) file, and run the Impacket script:

```
GetNPUsers.py polaris.local/ -no-pass -usersfile polaris_users2.txt -outputfile asrep.hash
```

It seems that we were able to retrieve an AS-REP for Jesse, as Jesse does not require Kerberos' pre-authentication. Now we can attempt to crack its password-encrypted section offline using hashcat.
Hashcat and GNS3 VMs don't get along very well. My suggestion is to install Hashcat on your own machine, retrieve the cipher text from asrep.hash file, as well as the [passwords.txt](../single-domain-attacks/passwords.txt) file, and execute the following command:

```
hashcat -m 18200 asrep.hash passwords.txt -o cracked1.txt --force --quiet
```

You should be able to retrieve Jesse's password this way.

!!! question
    What message does an attacker receive when they send an AS-REQ without pre-authentication to a user that does not require pre-authentication? What does an attacker receive in the case the user does require pre-authentication?
??? success "Answer"
    In case the user does not require pre-auth: an AS-REP message containing the user's TGT.
    If otherwise the user requires pre-auth: a Kerberos error message (KRB5KDC_ERR_PREAUTH_REQUIRED).
!!! question 
    Can the attacker use the user's TGT right away? Why?
??? success "Answer"
    No. In order to use the TGT, the attacker must have access to a session key that is sent in the AS-REP message. This session key is in turn encrypted using a user's password derived key, which the attacker has no access to. Therefore the attacker cannot use the TGT.
!!! question
    How does the attacker know if they have successfully cracked the password?
??? success "Answer"
    The attacker knows the password is correct due to the TGT having recognizable fields including the realm name, timestamp, and client principal name. When the correct key (derived from the cracked password) is used to decipher the TGT, these fields are properly parsed, confirming the password is valid. Hashcat's job is to derive the key from a potential password, try decrypting the AS-REP encrypted section, and assess if there are recognizable fields. If there are, the password used to derive the key is the user's password.
!!! question
    Does the attacker need credentials to perpetrate this attack?
??? success "Answer"
    Yes, the attacker needs to know valid usernames in order to perpetrate this attack. However, the attacker does not need to know passwords, which are part of the credentials.

