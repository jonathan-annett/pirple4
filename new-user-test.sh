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

if grep -q "200 OK" curl.err ; then

#edit the user file to allow menu edit permission
node -e "var fn=\".data/user/user@domain.com.json\",u=JSON.parse(fs.readFileSync(fn));u.permissions={edit_menu:true};fs.writeFileSync(fn,JSON.stringify(u));"

# create a few menu items for test purchases
curl -v --header "Content-Type: application/json" \
--request POST \
--data '{"description":"vegan pizza","image_url":"https://i.imgur.com/yMu7sjT.jpg","price":9.99}' \
http://localhost:3000/menu

curl -v --header "Content-Type: application/json" \
--request POST \
--data '{"description": "Meat Lovers Pizza","image_url": "https://i.imgur.com/ouAz8i8.jpg","price": 9.99}' \
http://localhost:3000/menu


curl -v --header "Content-Type: application/json" \
--request POST \
--data '{"description":"Desert Pizza","image_url":"https://i.imgur.com/WFqSUbe.jpg","price": 19.99}' \
http://localhost:3000/menu


TOKEN=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./new-user.json\")).token.id);")

echo created new user, will use token ${TOKEN}

curl -v --header "token: ${TOKEN}" http://localhost:3000/menu > ./test-menu.json 2> curl.err

fi