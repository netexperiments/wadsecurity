Once an attacker has uncovered some valid usernames from domains through user enumeration or anonymous SAMR enumeration attacks, they can shift their focus into uncovering passwords.

One way of doing so is through a Password Spraying attack, in which a single password is attempted using different valid usernames, a technique useful for preventing account lockouts when compared with traditional bruteforce attacks. To execute this attack on the different domains, you can make use of the following files: [north_users.txt](../multi-domain-attacks/north_users.txt), containing the north's domain users, [altair_users.txt](../multi-domain-attacks/altair_users.txt) for altair domain's users, and [sirius_users.txt](../multi-domain-attacks/sirius_users.txt) for sirius. Using these files you may execute password spray attacks using the Kerbrute tool:

```
./kerbrute passwordspray -d north.altair.local north_users.txt --dc 192.168.122.10 Password123
./kerbrute passwordspray -d altair.local altair_users.txt --dc 192.168.122.20 ThisIsMyPassword123
./kerbrute passwordspray -d sirius.local sirius_users.txt --dc 192.168.122.30 IDontKnow?
```

By having valid usernames and trying common passwords, an attacker may gather credentials to access the domain as an authenticated user. This way, the attacker has retrieved 3 user accounts, one for each domain in our environment.

!!! question
    How does this attack prevent account lockout when compared with traditional bruteforce attacks?

??? success "Answer"
    This attack prevents account lockouts when compared to traditional bruteforce attacks because it targets many user accounts with a single password per attempt, instead of trying many passwords on one user. In traditional bruteforce, repeatedly guessing passwords for the same account quickly triggers lockouts. In contrast, password spraying spreads login attempts across users, which avoids triggering lockout policies while still allowing the attacker to find weak passwords and gain access.