#LLMNR poisoning

The objective of this attack is to trick a client into authenticating to an attacker machine through means of LLMNR poisoning. LLMNR is a hostname resolution protocol used in AD as a fallback when DNS name resolution fails. It works by sending multicast requests to machines in the same network, asking for the hostname's IP address that DNS failed to provide.

This can occur when, for example, a user mistypes some server name. If a user for example tries to access a server named "CAPTAIN", but insteads tries to access a server named "CAPTSIN" by mistake, the DNS won't be able to resolve this hostname, and thus LLMNR is triggered. Attackers then can take advantage of this mistake, and reply to the client indicating that the "CAPTSIN" hostname resolves to the attacker's own IP address. This way, the client is tricked into authenticating to the attacker's machine.

In order to listen for LLMNR requests and poison them, the 'Responder' tool can be used. In the Responder directory, run:
```
sudo -E python3 Responder.py -I ens3
```

Now, wait for some client to look for a server that doesn't exist. We've heard that Hank and the Administrator like to write super fast, maybe they'll both press the wrong key when accessing some server. The LLMNR poisoning attack can be used to retrieve NTLM responses from victims. These responses can be used in offline password cracking.
Once you've captured the hashes, save them to a file named "responder.hashes" and using the [NTLMHashCracking.txt](../single-domain-attacks/NTLMHashCracking.txt) file, conduct a password cracking attempt with Hashcat:

```
#Remember, GNS3 VMs and hashcat don't get along. I suggest installing hashcat on your machine
hashcat -m 5600 --force -a 0 responder.hashes NTLMHashCracking.txt --quiet
```

If you're lucky, you might crack some password.

!!! question
    Can the attacker perform this attack without user credentials? Why?
??? success "Answer"
    Yes, since LLMNR requests are sent to the network. Attackers can listen to these requests and simply send spoofed replies without needing credentials.

!!! question
    How can the attacker crack the password? Keep in mind how the NTLM authentication is conducted and what is exchanged between client and server.
??? success "Answer"
    The attacker might be able to crack the password since the attacker conducts the NTLM authentication process with the victim. This results in the attacker having knowledge of both the challenge and the response used to authenticate the client. Thus, the attacker will know both the plaintext nonce as well as the hashed nonce, being able to conduct an offline dicionary attack to recover the victim's plaintext password. The attacker will use different passwords and use them to hash the plaintext nonce. If the hashed value is equal to the hashed nonce sent by the client, the attacker has successfully cracked the user's password.


