***API Documentation - Sample Code Call Summary***
====

Sample [API calls](#sample-api-calls-for-new-user-to-buy-the-first-pizza-on-the-menu-1) for new user to "buy the first pizza on the menu":
----
  * [>>>](#step-1-create-user) [POST /user](#sign-up) - supply user details,  get session `token` 
  * [>>>](#step-2-get-menu-array) [GET /menu](#get-menu-items) - get list of menu items (each with an `id`) 
  * [>>>](#step-3-add-first-item-in-menu-to-cart) [POST /cart](#add-menu-item-to-shopping-cart) - supply `id` and `token`, get updated cart with `items` and `total` 
  * [>>>](#step-4-submit-shopping-cart-as-an-order) [POST /order](#create-order-with-contents-of-shopping-cart) supply stripe payment `source`, get `order_id` 
  * [>>>](#step-5-logout-user) [DELETE /token](#sign-out)
  

Sample [API calls](#sample-api-calls-for-existing-user-to-search-a-vegan-pizza-and-then-buy-it-1) for existing user to search a "vegan" pizza, and then buy it:
----
* [>>>](#step-1-create-session-token) [POST /token](#sign-in) - supply `email` and `password`,  get session `token` 
* [>>>](#step-2-get-filtered-menu-array) [GET /menu?description=vegan](#filter-menu-items) - get menu item containing   `id` 
* [>>>](#step-3-add-first-filtered-item-to-cart) [POST /cart](#add-menu-item-to-shopping-cart) - supply `id` and `token`, get updated cart with `items` and `total` 
* [>>>](#step-4-submit-shopping-cart-as-an-order-1) [POST /order](#create-order-with-contents-of-shopping-cart) supply stripe payment `source`, get `order_id` 
* [>>>](#step-5-logout-user-1) [DELETE /token](#sign-out)

*[bash/curl on ubuntu](https://github.com/jonathan-annett/pirple2/blob/master/all-tests.sh) script to do these tests*


Detailed infomation follows...

Sample API calls for new user to "buy the first pizza on the menu":
----

## step 1: create user

`POST /user`
*Posted Body*
```JSON
{
  "email"    : "mr-squirrel@gmail.com",
  "name"     : "Mr Squirrely Squirrel",
  "password" : "Monkey~123",
  "street_address" : "45 Squirrel Lane" 
}
```
*200 Response*
```JSON
{
    "name": "Mr Squirrely Squirrel",
    "email": "mr-squirrel@gmail.com",
    "street_address": "45 Squirrel Lane",
    "orders": [],
    "token": {
        "id": "6kufSGWMkqgCODYRCjRO",
        "created": 1545470951121,
        "expires": 1545474551121,
        "cart_id": "gmv8OJjaFjQFx7jZNFI2"
    }
}
```

## step 2: get menu array

GET /menu <=== Headers ====[ `token: 6kufSGWMkqgCODYRCjRO` ]  
*200 Response*
```JSON
[
    {
        "description": "Desert Pizza",
        "image_url": "https://i.imgur.com/WFqSUbe.jpg",
        "price": 19.99,
        "id": "0eIZ3cO5KCjd94isKvn7"
    },
    {
        "description": "Vegan Pizza",
        "image_url": "https://i.imgur.com/yMu7sjT.jpg",
        "price": 9.99,
        "id": "Sb2goBvqmIObpQkT3gQZ"
    },
    {
        "description": "Meat Lovers Pizza",
        "image_url": "https://i.imgur.com/ouAz8i8.jpg",
        "price": 9.99,
        "id": "x5l623nP6jjdLFq9X6oJ"
    }
]
```

## step 3: add first item in menu to cart

`POST /cart` <=== Headers ====[ `token: 6kufSGWMkqgCODYRCjRO` ]
*Posted Body*
```JSON
{ "id" : "0eIZ3cO5KCjd94isKvn7", "quantity" : 1 }
```
*200 Response*
```JSON 
{
    "items": {
        "0eIZ3cO5KCjd94isKvn7": {
            "quantity": 1,
            "price": 19.99,
            "description": "Desert Pizza",
            "image_url": "https://i.imgur.com/WFqSUbe.jpg",
            "subtotal": 19.99
        }
    },
    "total": 19.99
}
```

## step 4: submit shopping cart as an order

`POST /order` <=== Headers ====[ `token: 6kufSGWMkqgCODYRCjRO` ]
*Posted Body*
```JSON
{"stripe":"tok_visa"}
```
*200 Response*
```JSON 
{
    "when": 1545470951460,
    "order_id": "XeDs3ZWxSphtSDcjvIox",
    "items": {
        "0eIZ3cO5KCjd94isKvn7": {
            "quantity": 1,
            "price": 19.99,
            "description": "Desert Pizza",
            "image_url": "https://i.imgur.com/WFqSUbe.jpg",
            "subtotal": 19.99
        }
    },
    "total": 19.99,
    "stripe": {
        "id": "ch_1Dk6nGGD93mPalQAKRDfKnbP",
        "object": "charge",
        "amount": 1998,
        "amount_refunded": 0,
        "application": null,
        "application_fee": null,
        "balance_transaction": "txn_1Dk6nGGD93mPalQA7vEnv7Qy",
        "captured": true,
        "created": 1545470954,
        "currency": "aud",
        "customer": null,
        "description": null,
        "destination": null,
        "dispute": null,
        "failure_code": null,
        "failure_message": null,
        "fraud_details": {},
        "invoice": null,
        "livemode": false,
        "metadata": {},
        "on_behalf_of": null,
        "order": null,
        "outcome": {
            "network_status": "approved_by_network",
            "reason": null,
            "risk_level": "normal",
            "risk_score": 49,
            "seller_message": "Payment complete.",
            "type": "authorized"
        },
        "paid": true,
        "payment_intent": null,
        "receipt_email": null,
        "receipt_number": null,
        "refunded": false,
        "refunds": {
            "object": "list",
            "data": [],
            "has_more": false,
            "total_count": 0,
            "url": "/v1/charges/ch_1Dk6nGGD93mPalQAKRDfKnbP/refunds"
        },
        "review": null,
        "shipping": null,
        "source": {
            "id": "card_1Dk6nGGD93mPalQAfCyRd9b3",
            "object": "card",
            "address_city": null,
            "address_country": null,
            "address_line1": null,
            "address_line1_check": null,
            "address_line2": null,
            "address_state": null,
            "address_zip": null,
            "address_zip_check": null,
            "brand": "Visa",
            "country": "US",
            "customer": null,
            "cvc_check": null,
            "dynamic_last4": null,
            "exp_month": 12,
            "exp_year": 2019,
            "fingerprint": "3brGbV1fTjRivna7",
            "funding": "credit",
            "last4": "4242",
            "metadata": {},
            "name": null,
            "tokenization_method": null
        },
        "source_transfer": null,
        "statement_descriptor": null,
        "status": "succeeded",
        "transfer_group": null
    }
}
```

## step 5: logout user

`DELETE /token?token=6kufSGWMkqgCODYRCjRO`  
*204 Response*


Sample API calls for existing user to search a "vegan" pizza, and then buy it:
----

## step 1: create session token

`POST /token`
*Posted Body*
```JSON
    {
      "email"    : "mr-squirrel@gmail.com",
      "password" : "Monkey~123"
    }
```
*200 Response*
```JSON 
{
    "id": "hvWP1HnuWu3EOmxczjkW",
    "email": "mr-squirrel@gmail.com",
    "created": 1545470958848,
    "expires": 1545474558848,
    "cart_id": "8Nw0MNhsEIXRa5s3ircm"
}
```

## step 2: get filtered menu array

`GET /menu?description=vegan` <=== Headers ====[ `token: hvWP1HnuWu3EOmxczjkW` ]  
*200 Response* 
```JSON
[
    {
        "description": "Vegan Pizza",
        "image_url": "https://i.imgur.com/yMu7sjT.jpg",
        "price": 9.99,
        "id": "Sb2goBvqmIObpQkT3gQZ"
    }
]
```

## step 3: add first filtered item to cart

`POST /cart` <=== Headers ====[ `token: hvWP1HnuWu3EOmxczjkW` ]
*Posted Body*
```JSON
        { "id" : "Sb2goBvqmIObpQkT3gQZ", "quantity" : 1 }
```
*200 Response*
```JSON 
{
    "items": {
        "Sb2goBvqmIObpQkT3gQZ": {
            "quantity": 1,
            "price": 9.99,
            "description": "Vegan Pizza",
            "image_url": "https://i.imgur.com/yMu7sjT.jpg",
            "subtotal": 9.99
        }
    },
    "total": 9.99
}
```

## step 4: submit shopping cart as an order

`POST /order` <=== Headers ====[ `token: hvWP1HnuWu3EOmxczjkW` ]
*Posted Body*
```JSON
            {"stripe": { "number" : "4242424242424242", "exp_month" : 12, "exp_year" : 2021, "cvc" : 123 }}
```
*200 Response*
```JSON 
{
    "when": 1545470959140,
    "order_id": "mzbJxgDkaYJmg9Ym5SnG",
    "items": {
        "Sb2goBvqmIObpQkT3gQZ": {
            "quantity": 1,
            "price": 9.99,
            "description": "Vegan Pizza",
            "image_url": "https://i.imgur.com/yMu7sjT.jpg",
            "subtotal": 9.99
        }
    },
    "total": 9.99,
    "stripe": {
        "id": "ch_1Dk6nNGD93mPalQABrGuMvwu",
        "object": "charge",
        "amount": 999,
        "amount_refunded": 0,
        "application": null,
        "application_fee": null,
        "balance_transaction": "txn_1Dk6nNGD93mPalQAEr2UFETy",
        "captured": true,
        "created": 1545470961,
        "currency": "aud",
        "customer": null,
        "description": null,
        "destination": null,
        "dispute": null,
        "failure_code": null,
        "failure_message": null,
        "fraud_details": {},
        "invoice": null,
        "livemode": false,
        "metadata": {},
        "on_behalf_of": null,
        "order": null,
        "outcome": {
            "network_status": "approved_by_network",
            "reason": null,
            "risk_level": "normal",
            "risk_score": 31,
            "seller_message": "Payment complete.",
            "type": "authorized"
        },
        "paid": true,
        "payment_intent": null,
        "receipt_email": null,
        "receipt_number": null,
        "refunded": false,
        "refunds": {
            "object": "list",
            "data": [],
            "has_more": false,
            "total_count": 0,
            "url": "/v1/charges/ch_1Dk6nNGD93mPalQABrGuMvwu/refunds"
        },
        "review": null,
        "shipping": null,
        "source": {
            "id": "card_1Dk6nMGD93mPalQAXwc5G75T",
            "object": "card",
            "address_city": null,
            "address_country": null,
            "address_line1": null,
            "address_line1_check": null,
            "address_line2": null,
            "address_state": null,
            "address_zip": null,
            "address_zip_check": null,
            "brand": "Visa",
            "country": "US",
            "customer": null,
            "cvc_check": "pass",
            "dynamic_last4": null,
            "exp_month": 12,
            "exp_year": 2021,
            "fingerprint": "3brGbV1fTjRivna7",
            "funding": "credit",
            "last4": "4242",
            "metadata": {},
            "name": null,
            "tokenization_method": null
        },
        "source_transfer": null,
        "statement_descriptor": null,
        "status": "succeeded",
        "transfer_group": null
    }
}
```

## step 5: logout user

`DELETE /token?token=hvWP1HnuWu3EOmxczjkW`  
*204 Response*

 
***
# Sign up
### POST /user

Simultaneously create a new user account, and a new session token.  
 
 * [implementation: handlers.user.post() in lib/handlers/user.js](user.js)
 * **REST endpoint** `POST /user`
 * **JSON body** `{ email,name,password,street_address}`
 * [example](#sample-api-calls-for-new-user-to-buy-the-first-pizza-on-the-menu-1)
  
 * **Responses**
    * 200,`{ email,name, street_address, token:{id,created,expires,cart_id }}`
    * 400 - missing/invalid email, password or street address.
    * 403 - user already exists. (or something else that stopped the creation of a new file - disk space or hardware error)
                          
  * Notes:
     - the password is not returned to the user, and it is stored internally as a hash result
     - as this endpoint automatically calls [POST /token](#sign-in) to sign in the user, if there was any issue doing that the error code will be something other than 200, ie whatever POST /token returned
     - any "200 content" response from POST/token is returned as the token field (see 200 response above).

***
# Get User Info
### GET /user

Get user account details.  
Returns the user's data in JSON format.  
Note that the password is not returned in the user data.  

  * [implementation: lib/handlers/user.js](user.js)

  * **REST endpoint**  
`GET /user?email=user@domain.com`  
or  
`GET /user`  

  * **HTTP Headers**  
`token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 
  


  * **Responses**
    * 200,`{ email,name, street_address }` - user details
    * 401 - missing/expired session (token header), or wrong email address
    * 404 - can't read user details



***
# Update User Details
### PUT /user

Update user account.  
Returns the updated user data  
Note that the password is not returned in the user data.  

  * [implementation: lib/handlers/user.js](user.js)

  * **REST endpoint**  
`PUT /user`
```JSON
    { "email":"user@domain.com",
      "name":"Mr Squirrely Squirrel",
      "password":"monkey123",
      "street_address" : "45 Squirrel Lane"
    }
```    

  * **HTTP Headers**  
  `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 

  * **Responses**  
    * 200,`{ email,street_address}` 
    * 401 - (token invalid/missing/expired/wrong email in token file)
    * 404 - user not found (for admins trying to update another user file)
    * 500 - missing/invalid email, password or street address, or no field to update.
                    
  * **Notes**  
     - only those fields supplied will be updated
     - email is not updated, and if suppplied, must match the logged in user
     - if email is not supplied, the logged in user is implied.
     - admins can update other users (by supplying another valid email and only if permissions.admin===true in the logged in user's .data/user/username@dmain.com.json)
     - the password is not returned to the user, and it is stored internally as a hash result




***
# Delete User
### DELETE /user

Delete user account.


  * [implementation: lib/handlers/user.js](user.js)  

  * **REST endpoint**  
`DELETE /user?email=user@domain.com`  
or  
`DELETE /user`  

  * **HTTP Headers**  
`token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 

  * **Responses*
    * 204 - user deleted ok
    * 401 - missing/expired session (token header), or wrong email address
    * 404 - can't read user details,
    * 500 - error occurred reading or deleting one of the files

* **Notes**

* if email is supplied, it must match the logged in user
* if email is not supplied, the logged in user is implied





***
# Sign in
### POST /token

Create and return a session token for an existing user account, using credentials supplied when the account was [created](#sign-up).

  * [implementation: lib/handlers/token.js](token.js)

  * **REST endpoint**  
`POST /token`
```JSON
    {
      "email":"user@domain.com",
      "password":"monkey123"
    }
``` 

  * **HTTP Headers**  
`token` - *optional* The previous session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


  * **Responses*
    * 200,`{id,email,created,expires,cart_id }` - session created ok
    * 400 - missing or invalid email
    * 401 - user and password does not match an account.


***
# Get Token
### GET /token

return token details


  Code:             handlers.token.get() in token.js      
  Endpoint:         GET /token?token=some-valid-token-id
  Responses:
                    200,{id,email,created,expires,cart_id } - session details
                    400 - missing or invalid token_id format
                    404 - token does not refer to a valid session
                    401 - session has already expired.
*/    



/*
  Common Name:      Extend Token
  Code:             handlers.token.put() in token.js      
  Endpoint:         PUT /token
  JSON Payload:     {"token":"some-valid-token-id"}
  Responses:
                    200,{id,email,created,expires,cart_id } - session expiry extended ok
                    400 - missing or invalid token_id format
                    404 - token does not refer to a valid session
                    401 - session has already expired.
                    500 - internal error trying to update session file(s)
*/





***
# Sign out
### DELETE /token

  Delete a session token, logging out the user<br />
  also clears any shopping cart associated with this session token. 
  The `token` argument is either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). 
  
<br>[implementation: lib/handlers/token.js](token.js)

* **REST endpoint**
 
  `DELETE /token?token=abcdef123456789`

* **Success Response:**

  * **Code:** 204 <br />

    
    
* **Error Response:**

  * **Code:** 400 BAD REQUEST
    * a missing or empty token argument

  OR

  * **Code:** 401 UNAUTHORIZED
    * the token is invalid or has already been signed out (deleted)




/*
  Common Name:      Sign Out ( also deletes shopping cart)
  Specification:    "Users can log in and log out by creating or DESTROYING a token."
  Code:             handlers.token.delete() in token.js      
  Endpoint:         DELETE /token?token=asdfghj1234567
  Responses:
                    204 - session deleted ok
                    400 - missing or invalid token_id format
                    404 - token does not refer to a valid session
                    500 - internal error trying to delete session file(s)
*/






 
***
# Get Menu Items
### GET /menu
----
  Retreive a full list of food items available to order from the menu.<br \>

  <br>[implementation: lib/handlers/pizza_menu.js](menu.js)

* **REST endpoint**

`GET /menu`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
[
    {
        "description": "Vegan Pizza",
        "image_url": "https://i.imgur.com/yMu7sjT.jpg",
        "price": 9.99,
        id: "6JiEVO9UNdNBfqWGoHKz"
    },
    {
        "description": "Meat Lovers Pizza",
        "image_url": "https://i.imgur.com/ouAz8i8.jpg",
        "price": 9.99,
        id: "Jg1lpBcQ8pEY70Oxxl8d"
    },
    {
        "description": "Desert Pizza",
        "image_url": "https://i.imgur.com/WFqSUbe.jpg",
        "price": 19.99,
        id: "PiBhPQWNNSek0U41aO2E"
    },
    {
        "description": "Hawaiian Pizza",
        "image_url": "https://i.imgur.com/hL00qJp.jpg?1",
        "price": 9.99,
        id: "oBBofNs316bjZs0d7a70"
    }
]
```
    
  
 * **Error Response:**
 
if there are no menu items defined, you will just get an empty array
 
     
***
# Get Menu Item
### GET /menu?id
----
  Retreive a specific food item available to order from the menu.<br \>

<br>[implementation: lib/handlers/pizza_menu.js](menu.js)

* **REST endpoint**

`GET /menu?id=6JiEVO9UNdNBfqWGoHKz`

 * id is a valid menu item id


* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
[
    {
        "description": "Vegan Pizza",
        "image_url": "https://i.imgur.com/yMu7sjT.jpg",
        "price": 9.99,
        id: "6JiEVO9UNdNBfqWGoHKz"
    }
]
```
    
    
    
 
* **Error Response:**

* **Code:** 404 NOT FOUND <br />

 



***
# Filter Menu Items
###  /menu?description
----
  Filter the list of items available to order from the menu.<br>

<br>[implementation: lib/handlers/pizza_menu.js](menu.js)

* **REST endpoint**

`GET /menu?description=hawaii`

 * description - a word (search term) to filter the list on

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
[
    {
        "description": "Hawaiian Pizza",
        "image_url": "https://i.imgur.com/hL00qJp.jpg?1",
        "price": 9.99,
        id: "oBBofNs316bjZs0d7a70"
    }
]
```
    
* **Error Response:**
 
if there are no menu items defined mathcing your search, you will just get an empty array
 


***
# Get the logged in user's shopping cart
### GET /cart
----
  Retreive the list of items in the shopping cart.
  
<br>[implementation: lib/handlers/cart.js](cart.js)

* **REST endpoint**

  `GET /cart`

* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
{
    items : {
        "oBBofNs316bjZs0d7a70" : {
            "description": "Hawaiian Pizza",
            "image_url": "https://i.imgur.com/hL00qJp.jpg?1",
            "price": 9.99,
            "quantity" : 1,
            "subtotal" : 9.99
        }
    },
    total : 9.99
}
```
    
* **Error Response:**

* **Code:** 401 UNAUTHORIZED <br />

most probably the token has expired, or this endpoint was called without a token
 
***
# Add Menu Item to shopping cart
### POST /cart
----
  add an item to the shopping cart, optionally specifying quantity.
  
<br>[implementation: lib/handlers/cart.js](cart.js)

* **REST endpoint**

  `POST /cart`

* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 

* **Payload**
```JSON
    {  "id" : "...",
       "quantity"  : 1
    }
```    

 * id - valid menu item id

 * quantity (optional) - how many items to add to cart, defaults to 1



* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
{
    items : {
        "oBBofNs316bjZs0d7a70" : {
            "description": "Hawaiian Pizza",
            "image_url": "https://i.imgur.com/hL00qJp.jpg?1",
            "price": 9.99,
            "quantity" : 1,
            "subtotal" : 9.99
        }
    },
    total : 9.99
}
```
    
* **Error Response:**

* **Code:** 400 BAD REQUEST <br />

the id didn't match a valid menu item


OR

* **Code:** 401 UNAUTHORIZED <br />

most probably the token has expired, or this endpoint was called without a token
 
* **Code:** 500 INTERNAL ERROR <br />

most probably there is an issue with writing/reading to/from storage 
 

***
# Update quantity of items in shopping cart
### PUT /cart
----
  update the number of items in the shopping cart.
  
<br>[implementation: lib/handlers/cart.js](cart.js)

* **REST endpoint**

  `PUT /cart`

* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


* **Payload**
```JSON
    {  "id" : "...",
       "quantity"  : 1
    }
```    
* id - valid menu item id

* quantity - explicitly set how many items with this id there should be in the cart.


* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
{
    items : {
        "oBBofNs316bjZs0d7a70" : {
            "description": "Hawaiian Pizza",
            "image_url": "https://i.imgur.com/hL00qJp.jpg?1",
            "price": 9.99,
            "quantity" : 1,
            "subtotal" : 9.99
        }
    },
    total : 9.99
}
```
    
* **Error Response:**

* **Code:** 400 BAD REQUEST <br />

the id or quantity wasn't supplied, or was invalid in some way (eg non numeric quantity)

OR

* **Code:** 404 NOT FOUND <br />

the id doesn't match a valid menu item, or is not currently in the shopping cart

OR


* **Code:** 401 UNAUTHORIZED <br />

most probably the token has expired, or this endpoint was called without a token
 
* **Code:** 500 INTERNAL ERROR <br />

most probably there is an issue with writing/reading to/from storage 
 



***
# Delete Cart Item
### DELETE /cart
----
 remove a specific item from the shopping cart.<br>

<br>[implementation: lib/handlers/cart.js](cart.js)

* **REST endpoint**

  `DELETE /cart?id=oBBofNs316bjZs0d7a70`

* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
returns the new contents of the cart, after the delete.
```JSON
{
    items : {
        "oBBofNs316bjZs0d7a70" : {
            "description": "Hawaiian Pizza",
            "image_url": "https://i.imgur.com/hL00qJp.jpg?1",
            "price": 9.99,
            "quantity" : 1,
            "subtotal" : 9.99
        }
    },
    total : 9.99
}
```
    
* **Error Response:**

* **Code:** 400 BAD REQUEST <br />

the id or quantity wasn't supplied, or was invalid in some way (eg non numeric quantity)

OR

* **Code:** 404 NOT FOUND <br />

the id doesn't match a valid menu item, or is not currently in the shopping cart

OR


* **Code:** 401 UNAUTHORIZED <br />

most probably the token has expired, or this endpoint was called without a token
 
* **Code:** 500 INTERNAL ERROR <br />

most probably there is an issue with writing/reading to/from storage 
 






***
# Create order with contents of shopping cart
### POST /order
----
 pay for the contents of shopping cart, adding the order to cutomers history, and returning the order no .<br>

<br>[implementation: lib/handlers/order.js](order.js)

* **REST endpoint**

  `POST /order`

* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 



* **Payload**
```JSON
    {  "stripe" : "tok_visa" }
```    

OR

```JSON
    {  "stripe" : {
          "card" : "4242424242424242",
          "exp_month" : "12",
          "exp_year" : "2021",  
          "cvc" : "123"
       }
    }
```    
* stripe - either a token string (for testing), or card details - which can be a test card number or actual card details.


* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 



     

    
    
# api validation rules
    
**email** `valid email address`

  * a typical email address in the standard `username@host.com` format 
  
**name** `full name`

  * at least 2 words that are separated by space(s). eg `Will Smith` is ok, `Beyonce` is not.
  * numbers are allowed after the first word so `John Smith 3rd` is acceptable as is `John 3 Smith`

**password** `valid password`

  * at least 8 characters
  * at least 1 upper case character
  * at least 1 lower case character
  * at least 1 numeric digit from 0 through 9
  * at least 1 symbol or space character 
  
**street_address** `a valid street address`
   * at least 1 line of 3 words
   * at least 1 of the words must be a number