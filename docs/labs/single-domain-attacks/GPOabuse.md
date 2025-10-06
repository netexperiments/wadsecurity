#GPO Abuse
While performing the ACL abuse attack (please do), you might have noticed that the Hank user account has 'GenericAll' access rights over a GPO, through the use of the BloodHound tool. Group Policy Objects (GPOs) are used to enforce specific settings across Organizational Units in AD. These range from critical configurations,  such as such as logon scripts, startup commands, software deployment, registry edits, and even scheduled tasks, all of which are executed with SYSTEM privileges on the targeted machines.

GPOs can also be used for more 'futile' reasons, such as setting wall papers across every computer. It seems that this is the case in our environment, as we can see through the BloodHound GUI by using the Cypher query specified in the ACL section.

Since we've compromised Hank's account in the ACL attack, let's use it to abuse the GPO. As aforementioned, GPOs can create scheduled tasks that run under the SYSTEM security context. As the attacker, we can create a scheduled task leveraging the 'GenericAll' access right that Hank holds on the GPO, and for example, create a new user and add it to the Domain Admins group!

We'll use the pyGPOabuse.py script, which automates this process. We'll use Hank's TGT, which you can retrieve by executing the Shadow Credentials attack, as specified in the ACLs section. You'll also need to retrieve the GPO's ID, which can be done through the BloodHound GUI. Click the GPO's node and look at the GPO's Distinguished Name on the right. That's where you'll get its ID.
```
#replace the GPO ID with the one present in your BloodHound GUI, place the hank.schrader.ccache file in the pyGPOAbuse dir, set the KRB5CCNAME var to the .ccache file, and from there run:
python3 pygpoabuse.py -k -ccache hank.schrader.ccache polaris.local/hank.schrader -gpo-id B2DBE2C2-9880-444B-A950-97072C096554 -dc-ip captain.polaris.local
```

You can execute the command "gpupdate /force" as the Administrator on CAPTAIN or wait for a while in order for the GPO to run the scheduled task. After the task is executed, a user account named “john” with password “H4x00r123..” will exist in the domain and be part of the Domain Admins group. We can confirm if the account is active with crackmapexec, as well as dump domain secrets with this new account.

```
#confirm that the account exists
crackmapexec smb 192.168.122.10 -u john -d polaris.local -p H4x00r123..
#dump domain secrets
secretsdump.py -just-dc john:H4x00r123..@captain.polaris.local
```

!!! question
    What is a Group Policy Object and what is its purpose in an Active Directory environment?
??? success "Answer"
    A Group Policy Object (GPO) is a collection of policy settings that can be applied in AD. They're used to enforce specific configurations across users and computers within a domain. Its purpose is to centralize the management of settings. GPOs can apply to Organizational Units (OUs), domains, or sites, allowing administrators to control environments automatically.
!!! question
    What types of critical configurations can be applied through GPOs?
??? success "Answer"
    GPOs can enforce a wide range of critical configurations, including logon and logoff scripts, startup and shutdown commands, software deployment, registry modifications, and security policies (such as password requirements and account lockouts).
!!! question
    How can you identify that a user has permissions over a GPO in BloodHound?
??? success "Answer"
    In BloodHound, you can identify GPO permissions by running specific Cypher queries in the GUI. When analyzing a user node like Hank, you can check if they have access rights such as GenericAll, WriteDacl, or WriteOwner over a GPO object. This appears in the relationship graph, as the link between the GPO and Hank's node. 