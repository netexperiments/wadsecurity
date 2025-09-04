#Anonymous AD Reconnaissance

Once different machines and services are identified, the attacker may then begin reconnaissance of AD information. Information such as different users and accessible shares. Sometimes, this information is available to unauthenticated users, and thus without any valid credentials, an attacker may potentially access it.

First, let's try to anonymously enumerate AD users from the polaris.local domain:
```
crackmapexec smb 192.168.122.10 --users
```
It seems that the CAPTAIN DC allows its users to be anonymously enumerated. This gives the attacker a great advantage. It also seems that one of the user's has his password in the description. Just like this, the attacker has gained an initial foothold on the domain.

Domain Controller's by default do not allow Anonymous SAMR enumeration. In that case, attackers must resort to attacks such as User Enumeration to uncover valid user accounts in AD domains.


Another thing that the attacker can do without credentials is listing shares. In AD there's a 'Guest' account, often without password and with very limited privileges. One of those privileges normally is the possibility to enumerate shares. Who knows, maybe the Guest account can even access one or two.

```
crackmapexec smb 192.168.122.10 -u 'a' -p '' --shares
```
Using the Guest account, we can see the different shares available in CAPTAIN. We even have access to one of them! Let's take a look:

```
smbclient //192.168.122.10/SharingIsCaring -U guest
#Press 'ENTER' when the password is requested
ls 
get skyler.txt
exit
cat skyler.txt
```
Seems like Skyler's not very good with passwords. Maybe we can guess it down the road?

!!! question
    How many File Shares are available in CAPTAIN?
??? success "Answer"
    There are seven file shares in CAPTAIN. The guest account can read and write one of them: SharingIsCaring.

!!! question
    How many users are there in the polaris.local domain? Which one has left their password on the description?
??? success "Answer"
    Through anonymous enumeration, the attacker found 7 user accounts. The saul.goodman user account's password can be seen in its description.