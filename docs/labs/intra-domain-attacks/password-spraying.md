Once you know a few usernames, you can start guessing their passwords. The file valid_users.txt, available in the course materials folder, lists the valid users found in the previous exercise. While performing a Wireshark capture, run the following command to check if any valid user has the password Password123.
./kerbrute passwordspray -d polaris.local valid_users.txt --dc 192.168.122.10 Password123
Summary of what is to be explained:
1.	Explain the process of password spraying performed by kerbrute, using a Wireshark capture.
