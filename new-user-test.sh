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

source test-tools.sh $1

#clear data from any previous tests
reset_data menu
reset_data user
reset_data token
reset_data cart
reset_data order

dump_jsons() {
    echo
    echo $1
    echo
    echo $2
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

if create_menu ; then

    #create a user and save the session token
    echo creating a test user
    if curl_post user ./new-user.json << USER_JSON
    {
      "email"    : "${TEST_EMAIL}",
      "name"     : "Mr Squirrely Squirrel",
      "password" : "Monkey~123",
      "street_address" : "45 Squirrel Lane" 
    }
USER_JSON

    then
        
        # pull in the session token and save it as a bash variable called TOKEN
        TOKEN=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./new-user.json\")).token.id);")
        
        #get the entire menu as json array
        echo fetching menu as JSON array
        curl_get menu ./test-menu.json ${TOKEN}
        
        #we are going to buy the first item on the menu - get it's id and description as bash vars
        MENU_ID=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./test-menu.json\"))[0].id);")
         
        echo adding ${MENU_ID} to cart
        if curl_post cart ./test-cart.json ${TOKEN} << ITEM_JSON
        { "id" : "${MENU_ID}", "quantity" : 1 }
ITEM_JSON

        then
            #pay for the order 
            echo placing an order using contents of cart
            if curl_post order ./test-order.json ${TOKEN} << CART_JSON
            {"stripe":"tok_visa"}
CART_JSON
            
            then
            
                ORDER=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./test-order.json\")).order_id);")
            
                echo order $ORDER completed ok
                
                # log out by deleting token
                echo logging out
                if curl_delete token?token=${TOKEN}
                then
                    echo logged out ok
                    
                    echo Summary of output from test:
                    echo
                    
                    dump_jsons "step 1: create user" "POST /user" new-user.json
                    dump_jsons "step 2: get menu array" "GET /menu" test-menu.json
                    dump_jsons "step 3: add first item in menu to cart" "POST /cart" test-cart.json
                    dump_jsons "step 4: submit shopping cart as an order" "POST /order" test-order.json
                    dump_jsons "step 5: logout user" "DELETE /token?token=${TOKEN}"

                else
                    echo could not log out
                fi
            
            else
                
                echo could not place order
                
                echo
                
                dump_jsons "step 1: create user" "POST /user" new-user.json
                dump_jsons "step 2: get menu array" "GET /menu" test-menu.json
                dump_jsons "step 3: add first item in menu to cart" "POST /cart" test-cart.json
                dump_jsons "step 4: submit shopping cart as an order" "POST /order" test-order.json
                cat curl.err
            
            fi
        
        fi
    
    fi

fi