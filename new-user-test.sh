#clear data from any previous tests
mkdir -p .data/user  && rm -rf .data/user  && mkdir .data/user 
mkdir -p .data/token && rm -rf .data/token && mkdir .data/token 
mkdir -p .data/cart  && rm -rf .data/cart  && mkdir .data/cart 

#create a user file and save the session token
curl -v --header "Content-Type: application/json" \
--request POST \
--data '{ "email":"user@domain.com","name":"Mr Squirrely Squirrel","password":"monkey123","street_address" : "45 Squirrel Lane"}' \
http://localhost:3000/user > ./new-user.json 2> curl.err

if [ grep -q "200 OK" curl.err ] ; then

TOKEN=$(node -e "console.log(JSON.parse(fs.readFileSync(\"./new-user.json\")).token.id);")

echo $TOKEN

fi