Once an attacker has uncovered some valid usernames from domains through user enumeration or anonymous SAMR enumeration attacks, they can shift their focus into uncovering passwords.

One way of doing so is through a Password Spraying attack, in which a single password is attempted using different valid usernames, a technique useful for preventing account lockouts when compared with traditional bruteforce attacks. To execute this attack on the polaris domain, you can make use of the [polaris_users.txt](../single-domain-attacks/polaris_users.txt) file, containing polaris domain's user names. Using this file you may execute the password spray attack using the Kerbrute tool:

```
./kerbrute passwordspray -d polaris.local polaris_users.txt --dc 192.168.122.10 Password123
```

By having valid usernames and trying common passwords, an attacker may gather credentials to access the domain as an authenticated user. This way, the attacker has retrieved one user account password, having now the possibility of authenticating and accessing new information.

!!! question
    How does this attack prevent account lockout when compared with traditional bruteforce attacks?

??? success "Answer"
    This attack prevents account lockouts when compared to traditional bruteforce attacks because it targets many user accounts with a single password per attempt, instead of trying many passwords on one user. In traditional bruteforce, repeatedly guessing passwords for the same account quickly triggers lockouts. In contrast, password spraying spreads login attempts across users, which avoids triggering lockout policies while still allowing the attacker to find weak passwords and gain access.