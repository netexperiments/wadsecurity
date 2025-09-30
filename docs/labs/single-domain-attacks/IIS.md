#IIS Misconfiguration Abuse

The Internet Information Services (IIS) is Microsoft's web server software, used to host websites, web applications, and more. If there are vulnerable endpoints hosted through IIS, an attacker may exploit the service, reaching for example, Remote Command Execution.

In the Network Reconnaissance section of the lab, we've determined that there's an HTTP endpoint served at CAPTAIN called "Simple Uploader". Maybe it is a vulnerable endpoint. At first glance this endpoint allows users to upload arbitrary files to the DC through HTTP. If uploaded files can be accessed through HTTP as well, it presents a dangerous situation for the domain. If an attacker can upload a file and then access it through HTTP, the attacker can upload for example a webshell, and use it to run commands remotely. Let's take a look:

```
curl -X GET http://192.168.122.10

```

This confirms that we can upload files to this endpoint, it seems. Let's then upload the 'webshell.aspx' file, present in the webshell directory:
```
#in the webshell directory
curl -X POST http://192.168.122.10 -F "file=@webshell.aspx"
``` 

Now, let's try and access the file we've just uploaded. Maybe it's saved on a folder named 'upload'?
```
curl -X GET http://192.168.122.10/upload/webshell.aspx
```

Yes! We can access our webshell! Now we can execute commands through HTTP. Let's try it:
```
curl -X POST http://192.168.122.10/upload/webshell.aspx -d "param=whoami"
```

This way, we've reached remote command execution at the DC under the the context of the IIS Application Pool Identity (IIS APPPOOL\DefaultAppPool), which is the account IIS assigns to isolate each web application.

!!! question
    What has the attacker compromised in this attack?
??? success "Answer"
    The attacker has gained remote command execution on the Domain Controller (DC) through a vulnerable IIS web application that allows file uploads and HTTP access to uploaded files. By uploading a webshell and accessing it via HTTP, the attacker can now execute commands on the server under the security context of the IIS Application Pool Identity. At this point, the domain hasn't been compromised. 