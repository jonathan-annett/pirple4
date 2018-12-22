#
#  File: existing-user-test.sh
#  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
#  Synopsis: test script to demonstrate required functionality.
#
#  Arguments:
#  $1 = optional email address for test user (if you supply this, 
#       mailgun must have permission to send mail to it)
#

#
# Copyright 2018 Jonathan Annett
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
# and associated documentation files (the "Software"), to deal in the Software without restriction,
# including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
# and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
# subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all copies or substantial portions
# of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#


source test-tools.sh $1

    #create a new session token for the user using default credentials
    echo logging in as the test user using test credentials
    if curl_post token ./new-token.json << USER_JSON
    {
      "email"    : "${TEST_EMAIL}",
      "password" : "newPassw0rd!"
    }
USER_JSON

    then
        
        # pull in the session token and save it as a bash variable called TOKEN
        TOKEN=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./new-token.json\")).id);")
        
        echo updating users password
        
        if curl_put user ./update-user.json ${TOKEN} << EDIT_JSON
        {
          "name" : "Squirrely Squirrel"
        }
EDIT_JSON
        then
        
            # log out by deleting token
            echo logging out
            if curl_delete token?token=${TOKEN}
            then
                echo logged out ok
                
                echo Summary of output from test:
                dump_jsons "step 1: create session token" "POST /token" new-token.json
                dump_jsons "step 2: update name" "PUT /user" update-user.json
                dump_jsons "step 3: logout user" "DELETE /token?token=${TOKEN}"
            else
                echo could not log out
                cat curl.err
            fi
        else
            cat curl.err
        fi

    fi

