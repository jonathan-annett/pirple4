#
#  File: existing-user-test.sh
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


# bash helper function to post JSON from stdin via curl
# captures JSON from the POST request and saves it to a local file
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

# bash helper function to get JSON via curl
# captures JSON from the GET request and saves it to a local file
# usage: curl_get uri filename token 

curl_get() {
URI=$1
OUT=$2

if [[ "$3" == "" ]] ; then
  curl -v ${LOCAL_URL}/${URI} > ${OUT} 2> curl.err
else
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



    #create a new session token for the user using default credentials
    
    if curl_post token ./new-token.json << USER_JSON
    {
      "email"    : "${TEST_EMAIL}",
      "password" : "Monkey~123"
    }
USER_JSON

    then
        
        # pull in the session token and save it as a bash variable called TOKEN
        TOKEN=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./new-token.json\")).id);")
        
        #get the entire menu as json array
        curl_get menu ./test-menu.json ${TOKEN}
        
        #we are going to buy the first item on the menu - get it's id and description as bash vars
        MENU_ID=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./test-menu.json\"))[0].id);")
        MENU_DESC=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./test-menu.json\"))[0].description);")
        
        echo we will buy ${MENU_DESC} which has id ${MENU_ID}
        
        if curl_post cart ./test-cart.json ${TOKEN} << ITEM_JSON
        { "id" : "${MENU_ID}", "quantity" : 1 }
ITEM_JSON

        then
            #pay for the order 
            
            if curl_post order ./test-order.json ${TOKEN} << CART_JSON
            {"stripe":"tok_visa"}
CART_JSON
            
            then
            
                ORDER=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./test-order.json\")).order_id);")
            
                echo order $ORDER completed ok
                
                # log out by deleting token
                if curl_delete token?token=${TOKEN}
                then
                    echo logged out ok
                    
                    echo Summary of output from test:
                    echo
                    echo
                    echo "step 1: create session token ---> POST /token"
                    echo
                    cat new-token.json  
                        
                    echo
                    echo
                    echo "step 2: get menu array ---> GET /menu"
                    echo
                    cat test-menu.json  
                    
                    echo
                    echo
                    echo "step 3: add first item in menu to cart ---> POST /cart"
                    echo
                    cat test-cart.json  
                    
                    echo
                    echo
                    echo "step 4: submit shopping cart as an order ---> POST /order"
                    echo
                    cat test-order.json
 
                    
                else
                    echo could not log out
                fi
            
            else
                
                echo could not place order
            
            fi
        
        fi
    
    fi

