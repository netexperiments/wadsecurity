#Password Spraying
Once you know a few usernames, you can start guessing their passwords. The file valid_users.txt, available in the course materials folder, lists the valid users found in the previous exercise. While performing a Wireshark capture, run the following command to check if any valid user has the password: "Password123".
```
./kerbrute passwordspray -d polaris.local valid_users.txt --dc 192.168.122.10 Password123
```

You can also try to guess multiple passwords using Kerbrute. In this case, you'll have to create a file with multiple passwords. These passwords will then be sprayed against the valid user names, from the valid_users.txt. You can use the existing [passwords.txt](../single-domain-attacks/passwords.txt) file.

```
./kerbrute passwordspray -d polaris.local valid_users.txt --dc 192.168.122.10 passwords.txt
```

<!--Summary of what is to be explained:
1.	Explain the process of password spraying performed by kerbrute, using a Wireshark capture.-->

!!! question
    Explain the process of password spraying performed by kerbrute, using a Wireshark capture.


!!! question
    Is there any advantage in password spraying a group of known user names, when compared to bruteforcing the password of a single user account? Why?

???+ question "Is there any advantage in password spraying a group of known user names, when compared to bruteforcing the password of a single user account? Why?"
    <input type="text" id="answer1" placeholder="Type your answer here" style="width: 100%; padding: 8px;">
    <button onclick="checkAnswer1()" style="
    margin-top: 8px;
    padding: 8px 16px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;">Submit</button>
    <p id="feedback1"></p>

    
