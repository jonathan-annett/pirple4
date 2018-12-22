#
#  File: new-user-test.sh
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

#helper bash function to remove all files in a given data subfolder
reset_data() {
   mkdir -p .data/$1  && rm -rf .data/$1 && mkdir .data/$1  
}


# bash helper function to post JSON from stdin to curl
# captures JSON from curl and saves it to a local file
# usage: curl_post uri filename token 
curl_post() {
URI=$1
OUT=$2

if [[ "$3" == "" ]] ; then
  curl -v --header "Content-Type: application/json" \
          --request POST \
          ${LOCAL_URL}/${URI} \
          --data @- > ${OUT} 2> curl.err
else
  curl -v --header "Content-Type: application/json" \
          --header "token: $3" \
          --request POST \
          ${LOCAL_URL}/${URI} \
          --data @- > ${OUT} 2> curl.err
fi

    CODE=( $(grep "< HTTP/1" curl.err | cut -d "/" -f 2 ) )

    if [ ${CODE[1]} -ge 200 ] && [ ${CODE[1]} -lt 300 ] ; then
        true
    else
        false
    fi
}

#helper bash function to create a menu item
menu_item() {
    
 curl_post menu /dev/null $4 << MENU_JSON
{  "description" : "$1", 
   "image_url"   : "$2",
   "price" : $3 } 
MENU_JSON

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
    PASSWORD="Sectre13!"
    if curl_post user ./admin-user.json << USER_JSON
    {
      "email"    : "admin-mc-admin-face@some-domain.com",
      "name"     :  "Super User",
      "password" : "${PASSWORD}",
      "street_address" : "1 server place" 
    }
USER_JSON
            
    then
        ADMIN_TOK=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./admin-user.json\")).token.id);")
    
        #edit the user file to allow user to create menu items permission
        node -e "var fn=\".data/user/admin-mc-admin-face@some-domain.com.json\",u=JSON.parse(fs.readFileSync(fn));u.permissions={edit_menu:true};fs.writeFileSync(fn,JSON.stringify(u));"
        
        #create a bunch of menu items
        menu_item "vegan pizza" "https://i.imgur.com/yMu7sjT.jpg" 9.99 ${ADMIN_TOK}
        menu_item "Meat Lovers Pizza" "https://i.imgur.com/ouAz8i8.jpg" 9.99 ${ADMIN_TOK}
        menu_item "Desert Pizza" "https://i.imgur.com/WFqSUbe.jpg" 19.99 ${ADMIN_TOK}
        
        
        curl_post menu /dev/null ${ADMIN_TOK} << MENU_JSON
        {  "description" : "vegan pizza 2", 
           "image_url"   : "https://i.imgur.com/yMu7sjT.jpg",
           "price" : 9.99 } 
MENU_JSON
        
        
        
        #trash the temp superuser files
        #rm .data/token/${ADMIN_TOK}.json
        #rm .data/user/admin-mc-admin-face@some-domain.com.json
        #rm ./admin-user.json
        
        ADMIN_TOK=
    else 
       echo could not create user
       cat curl.err
    fi
    PASSWORD=         
}

#clear data from any previous tests
reset_data menu
reset_data user
reset_data token
reset_data cart
reset_data order

create_menu

#create a user and save the session token

curl -v --header "Content-Type: application/json" \
--request POST \
--data '{ "email":"user@domain.com","name":"Mr Squirrely Squirrel","password":"monkey123","street_address" : "45 Squirrel Lane"}' \
http://localhost:3000/user > ./new-user.json 2> curl.err

if grep -q "200 OK" curl.err ; then
    
    # pull in the session token and save it as a bash variable called TOKEN
    TOKEN=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./new-user.json\")).token.id);")
    
    #get the entire menu as json array
    curl -v --header "token: ${TOKEN}" http://localhost:3000/menu > ./test-menu.json 2> curl.err
    
    #we are going to buy the first item on the menu - get it's id and description as bash vars
    MENU_ID=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./test-menu.json\"))[0].id);")
    MENU_DESC=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./test-menu.json\"))[0].description);")
    
    echo we will buy ${MENU_DESC} which has id ${MENU_ID}
    
    curl -v --header "Content-Type: application/json" \
    --header "token: ${TOKEN}" \
    --request POST \
    --data "{\"id\":\"${MENU_ID}\"}" \
    http://localhost:3000/cart > ./test-cart.json 2> curl.err
    
    if grep -q "200 OK" curl.err ; then
    
        #pay for the order 
        
        curl -v --header "Content-Type: application/json" \
        --header "token: ${TOKEN}" \
        --request POST \
        --data '{"stripe":"tok_visa"}' \
        http://localhost:3000/order > ./test-order.json 2> curl.err
        
        
        if grep -q "200 OK" curl.err ; then
        
            ORDER=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./test-order.json\")).order_id);")
        
            echo order $ORDER completed ok
            
            curl -v --request DELETE /token?token=${TOKEN} 
        
        else
            
            echo could not place order
        
        fi
    
    fi

fi