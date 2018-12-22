#
#  File: test-tools.sh
#  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
#  Synopsis: test script to demonstrate required functionality.
#

#
# Copyright 2018 Jonathan Annett
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#

# we are going to use the local host on port 3000 for this test

LOCAL_URL=http://localhost:3000
TEST_EMAIL=$1
[[ "${TEST_EMAIL}" == "" ]] && TEST_EMAIL=user@domain.com

#helper bash function to remove all files in a given data subfolder
reset_data() {
   mkdir -p .data/$1  && rm -rf .data/$1 && mkdir .data/$1  
}


# bash helper function to post JSON from stdin via curl
# captures JSON from the POST request and saves it to a local file
# usage: curl_post uri filename token 
curl_post() {
URI=$1
OUT=$2
if [[ "${OUT}" == "/dev/null" ]]; then
   JSON=./temp.in.json
   HDRS="/dev/null"
else
   JSON="${OUT}.in"
   HDRS="${OUT}.hdr"
fi

cat > ${JSON}

if [[ "$3" == "" ]] ; then
  curl -v --header "Content-Type: application/json" \
          --request POST \
          ${LOCAL_URL}/${URI} \
          --data @${JSON} > ${OUT} 2> curl.err
  echo -n "" > ${HDRS}
else
  echo -n " <=== Headers ====[ token: $3 ]" > ${HDRS}
  curl -v --header "Content-Type: application/json" \
          --header "token: $3" \
          --request POST \
          ${LOCAL_URL}/${URI} \
          --data @${JSON} > ${OUT} 2> curl.err
fi

    [[ "${OUT}" == "/dev/null" ]] && rm ./temp.in.json

    CODE=( $(grep "< HTTP/1" curl.err | cut -d "/" -f 2 ) )

    if [ ${CODE[1]} -ge 200 ] && [ ${CODE[1]} -lt 300 ] ; then
        true
    else
        false
    fi
}

# bash helper function to post JSON from stdin via curl
# captures JSON from the POST request and saves it to a local file
# usage: curl_post uri filename token 
curl_put() {
URI=$1
OUT=$2
if [[ "${OUT}" == "/dev/null" ]]; then
   JSON=./temp.in.json
   HDRS="/dev/null"
else
   JSON="${OUT}.in"
   HDRS="${OUT}.hdr"
fi

cat > ${JSON}

if [[ "$3" == "" ]] ; then
  curl -v --header "Content-Type: application/json" \
          --request PUT \
          ${LOCAL_URL}/${URI} \
          --data @${JSON} > ${OUT} 2> curl.err
  echo -n "" > ${HDRS}
else
  echo -n " <=== Headers ====[ token: $3 ]" > ${HDRS}

  curl -v --header "Content-Type: application/json" \
          --header "token: $3" \
          --request PUT \
          ${LOCAL_URL}/${URI} \
          --data @${JSON} > ${OUT} 2> curl.err
fi

    [[ "${OUT}" == "/dev/null" ]] && rm ./temp.in.json

    CODE=( $(grep "< HTTP/1" curl.err | cut -d "/" -f 2 ) )

    if [ ${CODE[1]} -ge 200 ] && [ ${CODE[1]} -lt 300 ] ; then
        true
    else
        false
    fi
}


# bash helper function to get JSON via curl
# captures JSON from the GET request and saves it to a local file
# usage: curl_get uri filename token 

curl_get() {
URI=$1
OUT=$2
HDRS=$2.hdr

if [[ "$3" == "" ]] ; then
  curl -v ${LOCAL_URL}/${URI} > ${OUT} 2> curl.err
  echo -n "" > ${HDRS}
else
  echo -n " <=== Headers ====[ token: $3 ]" > ${HDRS}

  curl -v --header "token: $3" \
          ${LOCAL_URL}/${URI} \
          > ${OUT} 2> curl.err
fi
    CODE=( $(grep "< HTTP/1" curl.err | cut -d "/" -f 2 ) )

    if [ ${CODE[1]} -ge 200 ] && [ ${CODE[1]} -lt 300 ] ; then
        true
    else
        false
    fi
}

# bash helper function to delete via curl
# usage: curl_delete uri 

curl_delete() {
URI=$1

  curl -v --request DELETE \
          ${LOCAL_URL}/${URI} \
          2> curl.err

    CODE=( $(grep "< HTTP/1" curl.err | cut -d "/" -f 2 ) )

    if [ ${CODE[1]} -ge 200 ] && [ ${CODE[1]} -lt 300 ] ; then
        true
    else
        false
    fi
}

 
# helper bash function to populate a sample menu dataset
# e.g. create food items avaiable to be ordered by a test customer
# this is not specified as a required functionality of the API, however
# in order to demonstate the required functionality, some test data is required.

create_menu() {
    
    # create a superuser to give us edit menu privileges in the api
    # for security reasons, editing of the menu is only allowed by users with "edit_menu" permission
    # in their user profile. to create the menu items, we create a temporary user with this permision
    # in the normal course of events,
    PASSWORD="SecretPa55word!"
    if curl_post user ./admin-user.json << USER_JSON
    {
      "email"    : "admin-mc-admin-face@some-domain.com",
      "name"     : "Super User",
      "password" : "${PASSWORD}",
      "street_address" : "1 server place" 
    }
USER_JSON
            
    then
        ADMIN_TOK=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./admin-user.json\")).token.id);")
    
        #edit the user file to allow user to create menu items permission
        node -e "var fn=\".data/user/admin-mc-admin-face@some-domain.com.json\",u=JSON.parse(fs.readFileSync(fn));u.permissions={edit_menu:true};fs.writeFileSync(fn,JSON.stringify(u));"
        
        #create a bunch of menu items
        
        echo creating sample menu items
        
        curl_post menu /dev/null ${ADMIN_TOK} << MENU_JSON
        {  "description" : "Vegan Pizza", 
           "image_url"   : "https://i.imgur.com/yMu7sjT.jpg",
           "price" : 9.99 } 
MENU_JSON
        
        curl_post menu /dev/null ${ADMIN_TOK} << MENU_JSON
        {  "description" : "Meat Lovers Pizza", 
           "image_url"   : "https://i.imgur.com/ouAz8i8.jpg",
           "price" : 9.99 } 
MENU_JSON


        curl_post menu /dev/null ${ADMIN_TOK} << MENU_JSON
        {  "description" : "Desert Pizza", 
           "image_url"   : "https://i.imgur.com/WFqSUbe.jpg",
           "price" : 19.99 } 
MENU_JSON

        #trash the temp superuser files
        rm .data/token/${ADMIN_TOK}.json
        rm .data/user/admin-mc-admin-face@some-domain.com.json
        rm ./admin-user.json
        
        ADMIN_TOK=
        PASSWORD=
        true
    else 
       echo could not create user
       cat curl.err
       false
    fi
}

dump_jsons() {
    echo
    echo $1
    echo
    
    if [[ -e $3.hdr ]] ; then
        echo -n $2
        cat $3.hdr
        rm $3.hdr
        echo
    else
        echo $2
    fi
    
    if [[ -e $3.in ]] ;then
        cat $3.in
        rm $3.in
        echo
        if [[ -e $3 ]] ;then
            echo "(((Response:)))"
        fi
    fi
    if [[ -e $3 ]] ;then
        node -e "console.log(JSON.stringify(JSON.parse(fs.readFileSync(\"$3\")),undefined,4));"
        rm $3
        echo
    fi
}

