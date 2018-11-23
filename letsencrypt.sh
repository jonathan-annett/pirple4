#!/bin/bash

#
# file: letsencrypt.sh
# synopsis:
#   bash script for linux to read host name from ../.apis/noip.json
#   and call the letsencrypt certbot to create ssl certs for testing
#   this enables valid certs to be used on a dynamic dns domain
#   which further faciltates features like progressive web apps or anything that requires
#   real https via a domain name. ideally not to be used for production.
#   (letsencrypt certs might be suitable for production, but not with dynamic dns / noip)
#   it's intend that this script be run once to generate the certs, and create a JSON file 
#   which contain the appropriate certs for runtime. 
#   note that this solution is NOT SECURE in that the certs are readable in plain text JSON 
#   in the .apis directory. 
#   also note that you need sudo privileges to run this script.

# requirements - a valid ../.apis/noip.json file: with at least these fields
# {
#  "username" : "MYUSERNAME",
#  "password" : "MYPASSWORD",
#  "hostname" : "my-cool-site.dyndns.net",
#  "domain_email" : "my-email@my-domain.com"
# }

# THIS MACHINE NEEDS TO HAVE PORT 80 AVAILABLE AND PUBLICALLY EXPOSED TO THE INTERNET
# ie you can't have an http server running, and you might need to use port forwarding on your router to
# ensure that port 80 can be served by this script (via certbot) 

# will create the file ../.apis/letsencrypt.json

parse_json() {
  #bash function to parse JSON config parameters using node.js as a helper
  FILE="../.apis/$1.json"
  KEY=$2
  if [[ -e ${FILE} ]]; then
    if [[ "${KEY}" != "" ]]; then 
        node -e "console.log(JSON.parse(fs.readFileSync(\"$FILE\"))[\"$KEY\"]);"
    fi
  fi
}

# we need to have certbot installed to go any further
if [[ -e $(which certbot) ]] ; then


  # first read in the domain name and email address we will need to create the certs

  DOMAIN=$(parse_json noip hostname)
  EMAIL=$(parse_json noip domain_email)

  #now ensure we have non empty strings for email and domain name
  if [[ "${DOMAIN}" != "" ]] && [[ "${EMAIL}" != "" ]] ; then
  
    # get the current username and external ip address, and what the dns system currently 
    # reports as the current ip for our domain name
    USER=$(whoami)
    DNS_IP=$(getent hosts ${DOMAIN} | awk '{ print $1 ; exit }')
    EXT_IP=$(curl -s https://api.ipify.org?format=text)
    
    # ip is not the same as that being reported by dns, update it using the noip client
    if [[ "$DNS_IP" != "$EXT_IP" ]] ; then
       # get the noip username and password
       NOIP_USER=$(parse_json noip username)
       NOIP_PASS=$(parse_json noip password)
       echo updating ${DOMAIN} to ip ${EXT_IP} via noip service - currently @ $DNS_IP
       curl -s -u ${NOIP_USER}:${NOIP_PASS} http://dynupdate.no-ip.com/nic/update?hostname=${DOMAIN}&myip=${EXT_IP}
       echo pausing for dns update
       sleep 15
       DNS_IP=$(getent hosts ${DOMAIN} | awk '{ print $1 ; exit }')
       while [[ "$DNS_IP" != "$EXT_IP" ]] ; 
       do
         echo waiting for dns update to propagate "$DNS_IP" vs "$EXT_IP"
         sleep 10
         
         DNS_IP=$(getent hosts ${DOMAIN} | awk '{ print $1 ; exit }')
       done
      
    fi
    
    # now we know that this machine's ip is being served by dns for the domain name,
    # run certbot to create the certs. they will end up in /etc/letsencrypt/live/${DOMAIN}/
    
    sudo certbot certonly --standalone -d ${DOMAIN} --email ${EMAIL} --agree-tos  --no-eff-email --staging

    # copy the certs to the api directory and use node.js to package them up into a json payload
    sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ../.apis/le-cert.pem
    sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ../.apis/le-key.pem
    sudo chown $USER:$USER ../.apis/le-cert.pem
    sudo chown $USER:$USER ../.apis/le-key.pem
    node -e "console.log(JSON.stringify({key:fs.readFileSync('../.apis/le-key.pem'),cert:fs.readFileSync('../.apis/le-cert.pem')}))" > ../.apis/letsencrypt.json
    # shred the temp cert files
    shred -n 200 -z -u ../.apis/le-cert.pem
    shred -n 200 -z -u ../.apis/le-key.pem
    echo created letsencrypt.json for ${DOMAIN}
  fi
else
  echo please install certbot first
  echo see https://certbot.eff.org/all-instructions
fi