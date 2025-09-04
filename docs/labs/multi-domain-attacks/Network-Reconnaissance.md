#Network Reconnaissance

An attacker that's able to access a Windows Active Directory network (192.168.122.0 in our case) must first retrieve some information through the network itself.

This information is crucial for determining the next steps for the attacker. The attacker will start by assessing which Windows machines are present in the network. Then, it is important to determine which of these machines are Domain Controller's. Other than this information, an attacker may also assess which services are provided by Windows machines, which can provide an attacker with potentially vulnerable entry points.

To look for Windows machines in the network, the CrackMapExec tool may be used. Through the tool's SMB module, the attacker can scan the network for Windows machines and retrieve information about them:

```
crackmapexec smb 192.168.122.0/24

```

The tool will output different Windows machines that are present in the network. You can identify the different Windows machines' hostnames, IP addresses, and domains, and whether they're using SMBv1 or not, as well as if they have SMB signing enabled.

Once different machines are identified, the attacker can get to finding out which machines are Domain Controller's, the prime target in AD environments. To do so, the attacker can make use of 2 protocols: DNS and DHCP. DNS is imperative in any AD domain, and can be used to find services hosted exclusevely by DCs. DHCP, on the other hand, isn't required in AD domains but there are DHCP servers running more often than not. Besides providing an IP address, the DHCP server usually indicates the DNS server to clients, so these are able to resolve hostnames. In order to find the DNS server, we'll use nmap and DHCP:

```
sudo nmap --script broadcast-dhcp-discover
```
Through the output we can see that the DNS server is hosted at 192.168.122.10. This indicates that the 192.168.122.10 machine can be the DC, but it's not certain since DNS servers can be hosted on machines other than DCs. However, there are services that only DCs provide like Kerberos and LDAP. Thus, in order to confirm the DC's IP address, the attacker can lookup Kerberos/LDAP service records in order to assess which machine provides such services:

```
nslookup -type=srv _ldap._tcp.dc._msdcs.north.altair.local 192.168.122.10
nslookup -type=srv _kerberos._tcp.dc._msdcs.north.altair.local 192.168.122.10
```

It seems that both LDAP and Kerberos are provided by CAPTAIN (192.168.122.10), confirming that the CAPTAIN machine is our north.altair.local DC.

The attacker can then scan the network for services provided by the different machines. This services can be misconfigured or present some vulnerability, which the attacker can take advantage of.

```
nmap -Pn -p- -sC -sV -oA full_scan 192.168.122.10,20,30,5
```

This command may take a while. The output shows us different services running on these machines.

!!! question
    How many Windows machines are in the network? What about domains?
??? success "Answer"
    There are 4 Windows machines: MEMBER, CAPTAIN, CHIEF and KING. There are 3 domains: sirius.local, altair.local and north.altair.local

!!! question
    Why is that the attacker should query certain service records instead of assuming the DNS server's IP address is the DC's IP address?
??? success "Answer"
    Because the DNS service may be hosted elsewhere, while the Kerberos and LDAP services are hosted by DCs exclusively

!!! question
    Is the Microsoft SQL service present on any machine? Which ones? What about the IIS service? Can you find any HTTP endpoint that's reachable on any machine?
??? success "Answer"
    Yes, the MSSQL service is provided by both CHIEF and KING. There's an HTTP enpoint at CAPTAIN named "Simple Uploader".