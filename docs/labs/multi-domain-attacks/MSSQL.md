#MSSQL Misconfiguration Abuse

Microsoft SQL can often be employed in AD environments. MSSQL servers integrate with AD, allowing AD credentials to be used to authenticate to MSSQL databases. There are possible MSSQL misconfigurations that can lead to an Remote Command Execution position for an attacker. 

In the Network Reconnaissance section, we determined that both KING and CHIEF provide MSSQL services. We can check again with nmap:
```
#MSSQL runs in port 1433
nmap -Pn -p 1433 -sV -sC 192.168.122.10 192.168.122.5 192.168.122.20 192.168.122.30
```

We've previously uncovered lily.aldrin user account credentials, from the altair domain. Let's use it to try and access CHIEF's MSSQL instance:
```
#in the mssql scripts dir
python3 ./mssqlclient.py -windows-auth altair.local/lily.aldrin:ThisIsMyPassword123@chief.altair.local
```
This script displays a shell that the attacker can use to interact with the MSSQL server. Executing the command “help” will display possible commands.

In our session, we can first enumerate logins. By executing the “enum_logins” command we can see which logins are possible in the CHIEF MSSQL service:
```
enum_logins
```
 We see that there’s the sa user, or sysadmin, the login with highest privileges in the MSSQL server, the BUILTIN\Users windows group, and two ALTAIR domain members, lily.aldrin and ted.mosby.

 MSSQL allows users to impersonate others while using the service. This configuration is done manually by administrators and if too permissive, an attacker can abuse them. The mssqlclient script can enumerate impersonation configurations with the “enum_impersonate” command. 
 ```
 enum_impersonate
 ```

 We can see that impersonation is allowed in this server. User ted.mosby allows lily.aldrin to impersonate him. This way, a user authenticating as Lily can execute commands with Ted’s privileges. We also can see that ted.mosby can impersonate the sa login, thus being able to execute commands with sa privileges. This impersonation misconfiguration allows an attacker to escalate from an unprivileged user to the sa account within the MSSQL server.

 ```
 exec_as_login ALTAIR\ted.mosby
 exec_as_login sa
 ```

 The sa account has enough privileges to enable the 'xp_cmdshell' stored procedure within the MSSQL server. This stored procedure essentially executes arbitrary Windows shell commands through SQL queries. Enabling this procedure will then allow the attacker to execute commands as the MSSQL service account.
 ```
 enable_xp_cmdshell
 xp_cmdshell whoami

 ```

 This way, abusing impersonation misconfigurations, an attacker can execute commands remotely under the MSSQL service account security context.

 Another feature prone to misconfigurations are linked servers. These are relationships established between MSSQL servers that allow MSSQL logins in one server to impersonate other logins in a different server, if a server link is established. We can enumerate links by running:
 ```
 enum_links
 ```
 We can see that there is a link between CHIEF and KING, and that the ted.mosby login in CHIEF, maps to the sa login in KING. So, by running:

```
exec_as_login ALTAIR\ted.mosby
use_link KING
```
 
The attacker has reached sa privileges in the KING server as well, allowing him to enable the xp_cmdshell stored procedure and reach Remote Command Execution in KING.

!!! question
    What can administrators do to prevent this type of abuse?
??? success "Answer"
    Administrators should carefully monitor impersonation permissions within MSSQL servers, not allowing a low-privilege user to impersonate high-privilege accounts, not directly (Lily -> sa), nor through other impersonation capabilities (Lily -> Ted -> sa). Impersonation paths should be carefully configured. Server link configuration should also be carefully configured, not allowing low-privilege users in one instance to impersonate an high-privilege account in another instance, across server links.
!!! question
    What has the attacker compromised in this attack?
??? success "Answer"
    The attacker has gained remote command execution on the MSSQL server by abusing impersonation/linked servers and enabling xp_cmdshell, allowing them to execute commands as the MSSQL service account. At this stage, the domain is not compromised.
