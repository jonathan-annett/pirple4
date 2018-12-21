#clear data from any previous tests
mkdir -p .data/menu  && rm -rf .data/menu  && mkdir .data/menu 
mkdir -p .data/user  && rm -rf .data/user  && mkdir .data/user 
mkdir -p .data/token && rm -rf .data/token && mkdir .data/token 
mkdir -p .data/cart  && rm -rf .data/cart  && mkdir .data/cart 


#create a user file and save the session token
curl -v --header "Content-Type: application/json" \
--request POST \
--data '{ "email":"user@domain.com","name":"Mr Squirrely Squirrel","password":"monkey123","street_address" : "45 Squirrel Lane"}' \
http://localhost:3000/user > ./new-user.json 2> curl.err

grep -q "200 OK" curl.err || exit -1

# pull in the session token and save it as a bash variable called TOKEN
TOKEN=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./new-user.json\")).token.id);")

echo created new user, will use token ${TOKEN}

#edit the user file to allow menu edit permission
node -e "var fn=\".data/user/user@domain.com.json\",u=JSON.parse(fs.readFileSync(fn));u.permissions={edit_menu:true};fs.writeFileSync(fn,JSON.stringify(u));"


#helper bash function to create a menu item
menu_item() {
  curl --header "Content-Type: application/json" \
  --header "token: $4" \
  --request POST \
  --data "{\"description\":\"$1\",\"image_url\":\"$2\",\"price\":$3}" \
  http://localhost:3000/menu  > /dev/null
}

# create a few menu items for test purchases
menu_item "vegan pizza" "https://i.imgur.com/yMu7sjT.jpg" 9.99 ${TOKEN}
menu_item "Meat Lovers Pizza" "https://i.imgur.com/ouAz8i8.jpg" 9.99 ${TOKEN}
menu_item "Desert Pizza" "https://i.imgur.com/WFqSUbe.jpg" 19.99 ${TOKEN}


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

#pay for the order 

curl -v --header "Content-Type: application/json" \
--header "token: ${TOKEN}" \
--request POST \
--data '{"stripe":"tok_visa"}' \
http://localhost:3000/order > ./test-order.json 2> curl.err


 