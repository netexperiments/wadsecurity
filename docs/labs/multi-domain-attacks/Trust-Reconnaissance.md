#Trust Reconnaissance

We've previously took a look at which trust relationships are established in this environment using LDAP, but we'll take a look at that again here. Trusts allow users from one domain to access resources in another. If misconfigured or too permissive, attackers can move laterally across domains.

Trust relationships are established between different domains in AD in order to allow cooperability between trusting and trusted domains. For an attacker, trust relationships can open ways to compromise even more domains once a single domain has been compromised.

To enumerate established trust relationships, an attacker only needs valid credentials:

```
ldeep ldap -u skyler.white -p 'Password123' -d north.altair.local -s ldap://192.168.122.10 trusts
ldeep ldap -u skyler.white -p 'Password123' -d north.altair.local -s ldap://192.168.122.20 trusts
ldeep ldap -u skyler.white -p 'Password123' -d north.altair.local -s ldap://192.168.122.30 trusts

```

This way, the attacker assesses that there's a trust relationship between north and altair, as well as a different trust relationship between altair and sirius.

Other than which trust relationships are established, an attacker can assess cross-domain access. These are cases in which for example, there's a user from sirius that's part of a group on the north domain. This indicates that this user has a cross domain presence, indicating that it might be an high-value target for an attacker, since it possibly has higher privileges when compared to regular users, as well as being able to access objects across different domains.

We previously identified Holly Flax, an HR employee from the sirius domain, as a potential cross-domain user (Authenticated AD Reconnaissance section). This indicates that Holly might have a presence in different domains, as well as having access to sensitive employee information across domains. BloodHound helps visualize attack paths and privileged group memberships across domain boundaries, which is perfect for spotting users with broad access, like Holly. If you haven't performed the commands in the 'BloodHound' section of the lab, please do, and come back to perform further steps.

First, head for the search bar on the top-left corner of the BH GUI. Then search for HOLLY.FLAX. You should see a node representing holly. Click the node. Now, to your right, there’s all different kinds of information related to the holly.flax user account. We are interested in looking for different group memberships, since groups are used to grant permissions to different entities in an easier way, such as Human Resources workers. By clicking the “MemberOf” menu, the GUI presents us with different groups that Holly is part of, including nested groups. At this point, we can clearly see that Holly is part of the Human Resources Group both in the sirius.local domain as well as in the north.altair.local domain. This tells us that the account has permissions on both these domains, and can probably have access to sensitive shares containing employee information.

As an attacker, we should try and compromise this account, not only potentially gaining access to sensitive information in one but at least two different domains. Access to sensitive information and cross-domain presence with one stone!

!!! question
What are Active Directory trust relationships and why are they relevant to attackers?
??? success "Answer"
Trust relationships link domains together so that users in one domain can access resources in another. For attackers, these relationships can be abused to move laterally and expand access once a single domain is compromised.
!!! question
What is cross-domain access and why does it make certain accounts more valuable?
??? success "Answer"
Cross-domain access occurs when a user from one domain has group memberships or privileges in another domain. These accounts are more valuable because they can access resources across multiple domains and may hold higher privileges.
!!! question
How does BloodHound help attackers identify valuable cross-domain users?
??? success "Answer"
BloodHound maps group memberships and trust paths across domains. By inspecting a user node, attackers can see which groups the user belongs to, including in other domains, highlighting accounts with broad access.