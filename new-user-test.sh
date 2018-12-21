
reset_data() {
   mkdir -p .data/$1  && rm -rf .data/$1  && mkdir .data/$1  
}




#helper bash function to create a menu item
menu_item() {
  curl --header "Content-Type: application/json" \
  --header "token: $4" \
  --request POST \
  --data "{\"description\":\"$1\",\"image_url\":\"$2\",\"price\":$3}" \
  http://localhost:3000/menu  > /dev/null
}

#helper bash function to populate a sample menu
create_menu() {
    
    #create a superuser to give us edit menu privileges in the api

    curl -v --header "Content-Type: application/json" \
    --request POST \
    --data "{\"email\":\"$1\",\"name\":\"$2\",\"password\":\"$3\",\"street_address\" : \"$4\"}" \
    http://localhost:3000/user > ./admin-user.json 2> curl.err
    if grep -q "200 OK" curl.err ; then
        ADMIN=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./admin-user.json\")).token.id);")
    
        #edit the user file to allow user to create menu items permission
        node -e "var fn=\".data/user/admin-mc-admin-face@some-domain.com.json\",u=JSON.parse(fs.readFileSync(fn));u.permissions={edit_menu:true};fs.writeFileSync(fn,JSON.stringify(u));"
        
        #create a bunch of menu items
        menu_item "vegan pizza" "https://i.imgur.com/yMu7sjT.jpg" 9.99 ${ADMIN}
        menu_item "Meat Lovers Pizza" "https://i.imgur.com/ouAz8i8.jpg" 9.99 ${ADMIN}
        menu_item "Desert Pizza" "https://i.imgur.com/WFqSUbe.jpg" 19.99 ${ADMIN}
        
        #trash the temp superuser files
        rm .data/token/${ADMIN}.json
        rm .data/user/admin-mc-admin-face@some-domain.com.json
        rm ./admin-user.json
        
        ADMIN=
    fi
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
    
    #edit the user file to allow user to create menu items permission
    node -e "var fn=\".data/user/user@domain.com.json\",u=JSON.parse(fs.readFileSync(fn));u.permissions={edit_menu:true};fs.writeFileSync(fn,JSON.stringify(u));"
    
    
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
    
    fi

fi