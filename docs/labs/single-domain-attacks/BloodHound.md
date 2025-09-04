#BloodHound

BloodHound is a very important tool in AD pentesting, both from an offensive as well as a defensive point of view. In this section, we'll go through setting it up and using it.

First, you'll have BH's configuration in /home/ubuntu/.config/bloodhound. There, you'll have the 'docker-compose.yml' file which defines the containers and service needed to run BH via Docker (which we're doing). In this dir you can dispose the containers, or start them (you probably don't have to unless you've restarted the attacker machine):

```
#in /home/ubuntu/.config/bloodhound/
#command to dispose of the docker containers
docker-compose down -v
#command to set up the required containers to run BH
docker-compose up -d
```

Once containers have started, you can access them through HTTP from your host machine. Doing so in Linux is easier, but it is also possible in Windows, as long as you can communicate through the network from your host machine to the Attacker VM running in GNS3.
To access the BH GUI, once you can communicate with the 'Attacker' GNS3 VM, just use your browser and access "http://192.168.122.2:8080/ui/login". If you cannot connect straight away, wait for a while and hit refresh. 

In this page, you'll authenticate as the 'admin' user. You'll need a password though. To retrieve the password and login as admin do the following:
```
#in /home/ubuntu/bloodhound-install/
./bloodhound-cli config get default_password
#take note of the password
```

You'll have to reset the password. Pick your favourite.
At this point you should have logged in BH. You should be presented a warning telling you that there's no data uploaded yet. Let's take care of that.

To do so, we'll use the 'bloodhound.py' ingestor. This script uses valid user credentials to query the domain using LDAP and retrieve JSON files ready to be uploaded to BH. Let's get to it:

```
#in /home/ubuntu/BloodHoundIngestor/
python3 bloodhound.py --zip -c All -d polaris.local -u skyler.white -p Password123 -dc captain.polaris.local 
```
This command will produce a .zip file containing JSON files with AD information ready to be uploaded to BH. Let's upload them:

```
mkdir /home/ubuntu/BHCEupload/bhfiles
mv /home/ubuntu/BloodHoundIngestor/*.zip /home/ubuntu/BHCEupload/bhfiles
cd /home/ubuntu/BHCEupload/
```

In your current directory, there's a Golang tool used to upload these files to BH. In order to use it you need to do the following: Access BH's GUI and navigate to the "Profile" tab, on the left. Then click "API Key Management", followed by "Create Token". Give it a name, click "Save" and take note of both the Key and ID values presented to you before closing this window.


Now, to upload the files:
```
#in /home/ubuntu/BHCEupload/
./BHCEupload -tokenid <token-ID> -tokenkey <token-key> -dir ./bhfiles/ -url http://192.168.122.2:8080


```

At this point, the data retrieved using 'bloodhound.py' was uploaded and can now be accessed through the GUI. It may take a while for the data to be accessible through the GUI. You can head back to the "Explore" tab using the left panel, and navigate through information using BloodHound!

To start you off, you can use the following Cypher queries:
```
#presents the different domains and domain joined machines
MATCH p = (d:Domain)-[r:Contains*1..]->(n:Computer) RETURN p
#presents the different domains and respective user accounts
MATCH p = (d:Domain)-[r:Contains*1..]->(n:User) RETURN p
#presents the overall map of domains, groups and users
MATCH q=(d:Domain)-[r:Contains*1..]->(n:Group)<-[s:MemberOf]-(u:User) RETURN q
```
The BloodHound tool will aid us in further attacks, such as ACL and GPO abuse.



