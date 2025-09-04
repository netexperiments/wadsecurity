#MSSQL Misconfiguration Abuse

Microsoft SQL can often be employed in AD environments. MSSQL servers integrate with AD, allowing AD credentials to be used to authenticate to MSSQL databases. There are possible MSSQL misconfigurations that can lead to an Remote Command Execution position for an attacker. 

In the Network Reconnaissance section, we determined that CAPTAIN provided MSSQL services. We can check again with nmap:
```
#MSSQL runs in port 1433
nmap -Pn -p 1433 -sV -sC 192.168.122.10 192.168.122.5
```

We've previously uncovered skyler.white's user account credentials. Let's use it to try and access CAPTAIN's MSSQL instance:
```
#in the mssql scripts dir
python3 ./mssqlclient.py -windows-auth polaris.local/skyler.white:Password123@captain.polaris.local
```
This script displays a shell that the attacker can use to interact with the MSSQL server. Executing the command “help” will display possible commands.

In our session, we can first enumerate logins. By executing the “enum_logins” command we can see which logins are possible in the CAPTAIN MSSQL service:
```
enum_logins
```
We see that there’s the sa user, or sysadmin, the login with highest privileges in the MSSQL server, the BUILTIN\Users Windows group, and two POLARIS domain members, skyler.white and walter.white.

MSSQL allows users to impersonate others while using the service. This configuration is done manually by administrators and if too permissive, an attacker can abuse them. The mssqlclient script can enumerate impersonation configurations with the “enum_impersonate” command. 
```
enum_impersonate
```

We can see that impersonation is allowed in this server. User walter.white allows skyler.white to impersonate him. This way, a user authenticating as Skyler can execute commands with Walter’s privileges. We also can see that walter.white can impersonate the sa login, thus being able to execute commands with sa privileges. This impersonation chain allows an attacker to escalate from an unprivileged user to the sa account within the MSSQL server.

```
exec_as_login POLARIS\walter.white
exec_as_login sa
```

The sa account has enough privileges to enable the 'xp_cmdshell' stored procedure within the MSSQL server. This stored procedure essentially executes arbitrary Windows shell commands through SQL queries. Enabling this procedure will then allow the attacker to execute commands as the MSSQL service account.
```
enable_xp_cmdshell
xp_cmdshell whoami
```

This way, abusing impersonation misconfigurations, an attacker can execute commands remotely under the MSSQL service account security context.


!!! question
    What can administrators do to prevent this type of abuse?
??? success "Answer"
    Administrators should carefully monitor impersonation permissions within MSSQL servers, not allowing a low-privilege user to impersonate high-privilege accounts directly (Skyler -> sa), nor through other impersonation capabilities (Skyler -> Walter -> sa). Impersonation paths should be carefully configured. 
!!! question
    What has the attacker compromised in this attack?
??? success "Answer"
    The attacker has gained remote command execution on the MSSQL server by abusing impersonation and enabling xp_cmdshell, allowing them to execute commands under the MSSQL service account context. At this stage, the domain is not compromised.
