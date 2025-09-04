#User enumeration

At this point, we've uncovered north.altair.local's user accounts, but not sirius.local's nor altair.local's, since these domains do not allow anonymous user enumeration. To guess these domain's user accounts, the attacker can execute the User Enumeration attack.

This exercise resorts to the Kerbrute tool and a list of popular usernames to obtain the usernames configured at the DCs (valid usernames). Use the [potential_users.txt](../multi-domain-attacks/potential_users.txt) as the list of popular usernames. Run the following commands while performing a Wireshark capture at the attacker’s interface:
```
./kerbrute userenum -d altair.local potential_users.txt --dc 192.168.122.20
./kerbrute userenum -d sirius.local potential_users.txt --dc 192.168.122.30
```

It seems that we've uncovered 3 users in each of these domains. Nice! Other usernames seem to not have been found, which doesn't mean there are no more users. It means that we couldn't guess them...


You may use a kerberos filter to analyze the Wireshark capture.

!!! question
    Explain the user enumeration process, using a Wireshark capture.

??? success "Answer"
    The attacker sent AS-REQ messages over UDP, since there are nine usernames in the users.txt file. Received five PRINCIPAL UNKNOWN error messages, three PREAUTH REQUIRED, and one RESPONSE_TOO_BIG. The latter is due to user angela.moss with does not require pre-authentication. In this case, a TCP connection is established with the AD, the AS-REQ is sent again, and an AS-REP is received. The AS-REP message carries the username of the requesting user. The correlation between requests and responses in the UDP messages is done through the port number. 

!!! question
    How does kerbrute correlate the requests with the responses?
??? success "Answer"
    Kerbrute correlates each AS-REP response to its username by sending one request per UDP source port, allowing it to match replies based on the unique port used per query.

