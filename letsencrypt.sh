#!/bin/bash

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


DOMAIN=$(parse_json noip hostname)
EMAIL=$(parse_json noip domain_email)

if [[ -e $(which certbot) ]] ; then


  if [[ "${DOMAIN}" != "" ]] && [[ "${EMAIL}" != "" ]] ; then
    USER=$(whoami)
    DNS_IP=$(getent hosts ${DOMAIN} | awk '{ print $1 ; exit }')
    EXT_IP=$(curl -s https://api.ipify.org?format=text)
    
    if [[ "$DNS_IP" != "$EXT_IP" ]] ; then
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
    
    sudo certbot certonly --standalone -d ${DOMAIN} --email ${EMAIL} --agree-tos  --no-eff-email --staging

    sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ../.apis/le-cert.pem
    sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ../.apis/le-key.pem
    sudo chown $USER:$USER ../.apis/le-cert.pem
    sudo chown $USER:$USER ../.apis/le-key.pem
    node -e "console.log(JSON.stringify({key:fs.readFileSync('../.apis/le-key.pem'),cert:fs.readFileSync('../.apis/le-cert.pem')}))" > ../.apis/letsencrypt.json
    shred -n 200 -z -u ../.apis/le-cert.pem
    shred -n 200 -z -u ../.apis/le-key.pem
    echo created letsencrypt.json for ${DOMAIN}
  fi
else
  echo please install certbot first
  echo see https://certbot.eff.org/all-instructions
fi