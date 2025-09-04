#User enumeration

At this point, we've uncovered polaris.local's user accounts anonymously in the AD Reconnaissance section of the lab. In that same section it is mentioned that DCs don't allow this behavior by default, and in those cases, attackers may leverage the User Enumeration attack in order to find valid user accounts. In this section, we'll perform the User Enumeration attack, as if polaris' users are yet to be uncovered.

This exercise resorts to the Kerbrute tool and a list of popular usernames to obtain the usernames configured at the DCs (valid usernames). Use the [potential_users.txt](../single-domain-attacks/potential_users.txt) as the list of popular usernames. Run the following command while performing a Wireshark capture at the attacker’s interface:
```
./kerbrute userenum -d polaris.local potential_users.txt --dc 192.168.122.10
```

It seems that we've uncovered 3 usernames in polaris.local through the User Enumeration attack. Nice! Other usernames seem to not have been found, which doesn't mean there are no more users. It means we couldn't guess them...


You may use a kerberos filter to analyze the Wireshark capture.

!!! question
    Explain the user enumeration process, using a Wireshark capture.

??? success "Answer"
    The attacker sent 11 AS-REQ messages over UDP, since there are 11 usernames in the potential_users.txt file. Received 8 PRINCIPAL UNKNOWN error messages, and 3 PREAUTH REQUIRED. This means that 8 of the 11 usernames do not exist in polaris.local, while 3 of them do.

!!! question
    How does kerbrute correlate the requests with the responses?
??? success "Answer"
    Kerbrute correlates each AS-REP response to its username by sending one request per UDP source port, allowing it to match replies based on the unique port used per query.

