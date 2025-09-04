# Domain Controller configuration

The installation and configuration of the DC involves several steps:

1. Configure the IP addresses and domain name
2. Rename the server
3. Adjust the clock
4. Install the Active Directory
5. Configure DNS
6. Configure users
7. Install and configure IIS
8. Install and configure DHCP
9. Disable SMB signing

##	Configure the IP addresses and domain name
Before configuring the IP addresses, you must learn what is the subnet where the NAT cloud is operating. One way of learning is to start the attacker and check the IP address, subnet mask, and gateway it gets from the NAT DHCP server (e.g., using ```ip add``` and ```ip route```). In our case, the subnet is ```198.168.122.0/24```, and the gateway is ```198.168.122.1```. Then, the following actions must be performed:

1. Under ```Server Manager → Local Server → Properties``` click on the ```Ethernet``` link, then on the ```Ethernet``` adapter, and finally click ```Properties → IPv4```.
2. At this window enter ```IP address``` as 192.168.122.10, ```subnet mask``` as 255.255.255.0, ```default gateway``` as 192.168.122.1, and ```DNS servers``` as 192.168.122.10 and 8.8.8.8.
3. Click ```Advanced```, select the ```DNS``` tab, and in the box ```DNS suffix for this connection``` write polaris.local.
4. Apply all the changes and return to the ```Server Manager``` window.

##	Rename the server

1.	Change the name of the server to DC1. This can be done in the ```Control Panel``` under ```System```. Restart the computer to apply the changes.

##	Adjust the clock

1.	Make sure that the time zone, the date, and the time are correctly set. The time zone must be set to UTC. The date and time must be close to the attacker’s one. The easiest way is to make the adjustments in the Control Panel.

##	Install the Active Directory

1.	In the ```Server Manager```, click ```Manage → Add Roles and features```, then click ```Next``` until reaching the ```Server Roles``` tab.
2.	Check the ```Active Directory Domain Services``` box, click ```Add features``` and click ```Next``` until the ```Confirmation``` tab appears. At this tab click ```Install```.
3.	After the installation, click ```Promote this server to a domain controller```.
4.	Select ```Add a new forest``` and write polaris.local in the ```Root Domain name``` box. Then click ```Next```.
5.	Enter the password for the DSRM administrator account. Then click ```Next``` until the ```Prerequisites``` tab appears and click on ```Install```.

##	Configure DNS

1.	Go back to the IP address configuration window and reconfigure the ```DNS servers``` as 192.168.122.10 and 8.8.8.8. Apply the changes and return to the ```Server Manager``` window.
2.	Click ```Tools → DNS → DC1```.
3.	Right-click on ```Reverse Lookup Zones```, then click ```New Zone → Next → Primary zone → Next``` and select ```To all DNS servers running... in this forest: polaris.local```.
4.	Click ```Next → IPv4 Reverse Lookup Zone → Next```. In ```NetworkID``` box enter 192.168.122. Then click ```Next → Next → Finish```. A new entry should have appeared in the ```Reverse Lookup Zones``` tab.

##	Configure users
To configure one user, in the ```Server Manager``` click ```Tools → Active Directory Users and Computers → Action → New → User```. Then, enter the user credentials. Uncheck the option ```User must change password at next logon```. You must create four users with different characteristics, as indicated in the next table.

| User logon name       | Password          | Domain            | Description                           |
| ----------------------| ------------------|-------------------|---------------------------------------|
| darlene.alderson      | M00npie           | polaris.local     | Account with an associated SPN        |
| leslie.romero         | RGFyayBBcm15      | polaris.local     | Password in description               |
| leon                  | Password123       | polaris.local     | Weak password                         |
| angela.moss           | Jogging1988       | polaris.local     | Kerberos pre-authentication disabled  |
| admin                 | Passw0rd          | polaris.local     | Administrator account                 |


1. User angela.moss must be configured with the pre-authentication disabled. To do that access the user ```Properties``` (e.g., double-click over the username in the ```Active Directory Users and Computers``` window) and in the ```Account tab → Account options``` box check ```Do not require Kerberos preauthentication```.
2. User leslie.romero must be configured with a password in the description. In the ```General tab → Description``` box write ```DELETE THIS LATER! Password: RGFyayBBcm15```.
3. The account of darlene.alderson must have an associated SPN. To perform this configuration, click ```Tools → ADSI Edit → Action → Connect```. Then in ```DC=polaris,DC=local → CN=Users``` search for ```CN=darlene alderson```. Right-click on this CN, select ```Properties``` and in the ```Attribute Editor``` tab search for ```servicePrincipalName```. Select the attribute, click ```Edit``` and insert ```http/polaris.local:80``` in the ```Value to add``` box.

##	Install and configure IIS

1. In the ```Server Manager```, click ```Manage → Add Roles and features```, then click ```Next``` until reaching the ```Server Roles``` tab.
2.	Check the ```Web Server(IIS)``` box, click ```Add features``` and click ```Next``` until reaching the ```Role Services``` tab.
3.	Check the ```Windows Authentication``` box which is one of the ```Security``` options. Then click ```Next``` until the ```Confirmation``` tab appears. At this tab click ```Install```.
4.	Click ```Tools → Internet Information Services (IIS) Manager```, on the left window open ```DC1 (Polaris\Administrator)``` and then ```Sites```, click above ```Default Web Site```, on the center window double-click over Authentication. Here disable Anonymous Authentication and enable Windows Authentication.
5.	On the right window open ```Providers``` and make sure that ```Negotiate``` is above ```NTLM```. This ensures that Kerberos is selected first as the authentication method, and NTLM is used if Kerberos fails.
6.	On the left window select ```Application Pools```, on the center window click over ```DefaultAppPool```, and on the right window open ```Advanced Settings```. Confirm that the ```Identity``` attribute is set to ```ApplicationPoolIdentity```.
7.	On the left window select ```Default Web Site```, and on the center window double-click over ```Configuration Editor```. Then, in the dropdown menu select ```system.webServer → security → authentication → windowsAuthentication```. Here, set ```useAppPoolCredentials``` to ```False``` and ```useKernelMode``` to ```True```.

##	Install and configure DHCP

1.	In the ```Server Manager```, click ```Manage → Add Roles and features```, then click ```Next``` until reaching the ```Server Roles``` tab.
2.	Check the ```DHCP Server``` box, click ```Add features``` and click ```Next``` until the ```Confirmation``` tab appears. At this tab click ```Install```. This completes the installation of the DHCP server.
3.	To configure the DHCP server click ```Tools → DHCP```, on the left window open ```dc1.polaris.local```, right-click ```IPv4```, and select ```New Scope```. In the ```Scope Name``` window give a name to the scope, in the ```IP Address Range``` window configure the ```start IP address```, the ```end IP address```, and the subnet mask of the DHCP range (we suggest ```192.168.122.1```, ```192.168.122.254```, and ```255.255.255.0```), in the ```Add Exclusion and Delay``` window exclude an IP address range to be used by attackers (we suggest ```192.168.122.15 to 192.168.122.20```), in the ```Configure DHCP Options``` window select ```Yes, I want to configure these options now```, in the ```Router (Default Gateway)``` window configure the IP address of the default gateway (```192.168.122.1```), in the ```Domain Name and DNS Servers``` window configure the parent domain as ```polaris.local```, and the IP addresses of the DNS servers as ```192.168.122.10``` and ```8.8.8.8```. Finally, in the ```Activate Scope``` window select ```Yes, I want to activate this scope now```, click ```Next → Finish```. At this point the corresponding Scope folder is added to the IPv4 section.

##	Disable SMB signing

(Only required for the SMB relay attack)

To disable the SMB signing you will have to change the Registry. In the ```Server Manager```, click on ```Tools → Registry Editor``` and set to ```0``` the following attributes:

*	```RequireSecuritySignature of HKEY_LOCAL_MACHINE\System\CurrentControlSet\Services\LanManWorkstation\Parameters```
*	```EnableSecuritySignature of HKEY_LOCAL_MACHINE\System\CurrentControlSet\Services\LanManWorkstation\Parameters```
*	```RequireSecuritySignature of HKEY_LOCAL_MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters```
*	```EnableSecuritySignature of HKEY_LOCAL_MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters```

