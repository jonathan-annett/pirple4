***"Pizza Ordering API" Documentation***
====



Sample [API calls](#sample-api-calls-for-new-user-to-buy-the-first-pizza-on-the-menu-1) for new user to "buy the first pizza on the menu":
----

  * 1 [>>>](#step-1-create-user) [POST /user](#sign-up) - supply user details,  get a session `token` 

  * 2 [>>>](#step-2-get-menu-array) [GET /menu](#get-menu-items) - get an array of menu items (each with an `id`) 

  * 3 [>>>](#step-3-add-first-item-in-menu-to-cart) [POST /cart](#add-menu-item-to-shopping-cart) - using a menu item's `id` and the session `token`, place an item in the shopping cart.

  * 4 [>>>](#step-4-submit-shopping-cart-as-an-order) [POST /order](#create-order-with-contents-of-shopping-cart) - using a stripe payment `source`, authorize payment for the shopping cart.
  * 5 [>>>](#step-5-logout-user) [DELETE /token](#sign-out) - having placed an order, the user can now log out. 
  



Sample [API calls](#sample-api-calls-for-existing-user-to-search-a-vegan-pizza-and-then-buy-it-1) for existing user to search a "vegan" pizza, and then buy it:
----
* 1 [>>>](#step-1-create-session-token) [POST /token](#sign-in) - supply `email` and `password`,  get session `token` 

* 2 [>>>](#step-2-get-filtered-menu-array) [GET /menu?description=vegan](#filter-menu-items) - substring search for `description`, choose an `id` from the returned array. 

* 3 [>>>](#step-3-add-first-filtered-item-to-cart) [POST /cart](#add-menu-item-to-shopping-cart) - supply `id` and `token`, place item in cart.

* 4 [>>>](#step-4-submit-shopping-cart-as-an-order-1) [POST /order](#create-order-with-contents-of-shopping-cart) - supply a stripe payment `source` to pay for the cart contents.

* 5 [>>>](#step-5-logout-user-1) [DELETE /token](#sign-out) - having placed an order, the user can now log out. 




Sample [API calls](#sample-api-calls-for-existing-user-to-get-their-info-1) for existing user to get their info:
----
* 1 [>>>](#step-1-create-session-token) [POST /token](#sign-in) - supply `email` and `password`,  get session `token` 

* 2 [>>>](#step-2-get-filtered-menu-array) [GET /user](#get-user-details) - get user details. 



[bash/curl](https://github.com/jonathan-annett/pirple2/blob/master/all-tests.sh) script (ubuntu) to do these tests* 










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

`GET /menu` <=== Headers ====[ `token: 6kufSGWMkqgCODYRCjRO` ]  

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







Sample API calls for existing user to get their info:
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
    "id": "nXj95GQRyoHkquD3fWvm",
    "email": "jonathan.max.annett@gmail.com",
    "created": 1545523134087,
    "expires": 1545526734087,
    "cart_id": "JU1yoOu8xMTrUn1qwQi5"
}
```

## step 2: get filtered menu array

`GET /user` <=== Headers ====[ `token: nXj95GQRyoHkquD3fWvm` ]
*200 Response*
```JSON 
{
    "name": "Mr Squirrely Squirrel",
    "email": "jonathan.max.annett@gmail.com",
    "street_address": "82 rodent park",
    "orders": [
        "LW7i6UwGPPkh1Fft0OhB",
        "I4Vcw9Q53akK61wLQwZl",
        "fvJGHDVRm7imZ6UpENz9"
    ]
}
```


***
***"Pizza Ordering API" /user endpoint***
====

 * POST = [Sign up](#sign-up)
 * GET = [Get User Info](#get-user-info)
 * PUT = [Update User Details](#update-user-details)
 * DELETE = [Delete User](#delete-user)

 
***
# Sign up
### POST /user

Simultaneously create a new user account, and a new session token.  
 
 * **REST endpoint**  
 [`POST /user`]
 * **JSON body** `{ email,name,password,street_address}`

  
 * **Responses**
    * 200,`{ email,name, street_address, token:{id,created,expires,cart_id }}`
    * 400 - missing/invalid email, password or street address.
    * 403 - user already exists. (or something else that stopped the creation of a new file - disk space or hardware error)
 * [Example](#sample-api-calls-for-new-user-to-buy-the-first-pizza-on-the-menu-1)
 * [implementation: handlers.user.post() in lib/handlers/user.js](user.js#L80)
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

  * [Example](#)
  
  * [implementation: lib/handlers/user.js](user.js#L161)
***
# Update User Details
### PUT /user

Update user account.  
Returns the updated user data  
Note that the password is not returned in the user data.  

  * **REST endpoint**  
`PUT /user`
  * **JSON body** `{ email,name,password,street_address}` 

  * **HTTP Headers**  
  `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 

  * **Responses**  
    * 200,`{ email,name,street_address}`  
    * 401 - (token invalid/missing/expired/wrong email in token file)
    * 404 - user not found (for admins trying to update another user file)
    * 500 - missing/invalid email, password or street address, or no field to update.

  * [Example](#)
  
  * [implementation: lib/handlers/user.js](user.js#L211)

                    
  * **Notes**  
     - only those fields supplied will be updated
     - email is not updated, and if suppplied, must match the logged in user
     - if email is not supplied, the logged in user is implied.
     - admins can update other users (by supplying another valid email and only if permissions.admin===true in the logged in user's .data/user/username@domain.com.json)
     - the password is not returned to the user, and it is stored internally as a hash result




***
# Delete User
### DELETE /user

Delete user account.

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

* [Example](#)

* [implementation: lib/handlers/user.js](user.js#L283) 

























***
***"Pizza Ordering API" /token endpoint***
====




***
# Sign in
### POST /token

Create and return a session token for an existing user account, using credentials supplied when the account was [created](#sign-up).

  * **REST endpoint**  
`POST /token`
  * **JSON body** `{email,password}`

  * **HTTP Headers**  
`token` - *optional* The previous session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


  * **Responses*
    * 200,`{id,email,created,expires,cart_id }` - session created ok
    * 400 - missing or invalid email
    * 401 - user and password does not match an account.

  * [Example](#step-1-create-session-token)
    
  * [implementation: lib/handlers/token.js](token.js#L360)


  
***
# Get Token
### GET /token

return token details

  * **REST endpoint** 
  `GET /token?token=some-valid-token-id`

  * **Responses*
    * 200,`{id,email,created,expires,cart_id }` - session details
    * 400 - missing or invalid token_id format
    * 404 - token does not refer to a valid session
    * 401 - session has already expired.

  * [Example](#)

  * [implementation: lib/handlers/token.js](token.js#L485)

***
# Extend Session
### PUT /token

Extends Session Token Expiry

  * **REST endpoint** 
  `PUT /token`

  * **JSON body** `{ token }` - a valid session token

  * **HTTP Headers**  
  `token` - *optional* The previous session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 

      
  * **Responses*
      * 200,`{id,email,created,expires,cart_id }` - session expiry extended ok
      * 400 - missing or invalid token_id format
      * 404 - token does not refer to a valid session
      * 401 - session has already expired.
      * 500 - internal error trying to update session file(s)
  * [Example](#)  
  * [implementation: lib/handlers/token.js](token.js#L534)


***
# Sign out
### DELETE /token

  Delete a session token, logging out the user<br />
  also clears any shopping cart associated with this session token. 
  The `token` argument is either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). 

* **REST endpoint**
 
  `DELETE /token?token=abcdef123456789`

* ** Responses**

   * 204 - session deleted ok
   * 400 - missing or invalid token_id format
   * 404 - token does not refer to a valid session
   * 500 - internal error trying to delete session file(s)
      
* [Example](#step-5-logout-user)
  
* [implementation: lib/handlers/token.js](token.js#L596)
























***
***"Pizza Ordering API" /menu endpoint***
====

 
***
# Get Menu Items
### GET /menu

  Retreive a full list of food items available to order from the menu.<br \>



 * **REST endpoint**

`GET /menu`

 * **Responses**
 

   * 200,`[{ id, description, price, image_url }, ... ]` - list of one or more items
   * 200,`[]` - an empty array means no menu items exist
   * 401 - user is not logged in. 
    
 * [Example](#step-2-get-menu-array)
 
 * [implementation: lib/handlers/pizza_menu.js](pizza_menu.js#L65)

     
***
# Get Menu Item
### GET /menu?id

Retreive a specific food item available to order from the menu. 



 * **REST endpoint**

`GET /menu?id=6JiEVO9UNdNBfqWGoHKz` - **id** *a valid menu item id*
    
 * **Responses**

   * 200,`[{ id, description, price, image_url } ]` - the result  
   * 404 - menu id does not correspond to a menu item file  
   * 401 - user is not logged in. 

 * [Example](#)

 * [implementation: lib/handlers/pizza_menu.js](pizza_menu.js#L65)
 

***
# Filter Menu Items
###  /menu?description

  Filter the list of items available to order from the menu.

 
 * **REST endpoint**

`GET /menu?description=hawaii` - **description** *a word (or search term) to filter the list on*

 * **Responses**
   * 200, `[{ id, description, price, image_url }, ... ]` - list of one or more items  
   * 200, [] - an empty array can mean no menu items exist, or the search term was not found  
   * 401 - user is not logged in.

 * [Example](#step-2-get-filtered-menu-array)

 * [implementation: lib/handlers/pizza_menu.js](pizza_menu.js#L65)













***
***"Pizza Ordering API" /cart endpoint***
====


***
# Get the logged in user's shopping cart
### GET /cart

  Retreive the list of items in the shopping cart.
  

* **REST endpoint**

  `GET /cart`

* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


* **Responses**

   * 200, `{ items : { id : {quantity,price,subtotal,description,image_url}}, total}` 
   * 401 - user is not logged in. 

* [Example](#)

* [implementation: lib/handlers/cart.js](cart.js#L63)


 
***
# Add Menu Item to shopping cart
### POST /cart

  add an item to the shopping cart, optionally specifying quantity.
  
 * **REST endpoint**

  `POST /cart`
  
 * **JSON body** `{id,quantity}` 
    * id - valid menu item id
    * quantity (optional) - how many items to add to cart, defaults to 1

 * **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


* **Responses**

  * 200, `{items:{id:{quantity,price,subtotal,description,image_url}},total}` 
  * 400 - missing/invalid id, or invalid quantity
  * 401 - user is not logged in. 
  * 500 - problem reading menu item or writing cart item to disk

* [Example](#step-3-add-first-filtered-item-to-cart)

* [implementation: lib/handlers/cart.js](cart.js#L104)
 
 
***
# Update quantity of items in shopping cart
### PUT /cart

  update the number of items in the shopping cart.
  
* **REST endpoint**

  `PUT /cart`

* **JSON body** `{id,quantity}` 
  * id - valid menu item id
  * quantity - set how many items with this id there should be in the cart.


* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


* **Responses**

    * 200, `{items:{id:{quantity,price,subtotal,description,image_url}},total}`
    * 400 - missing/invalid id or quantity
    * 401 - user is not logged in. 
    * 404 - item with that id not in shopping cart
    * 500 - problem reading menu item or writing cart item to disk
    
* [Example](#)

* [implementation: lib/handlers/cart.js](cart.js#L201)

***
# Delete Cart Item
### DELETE /cart

 remove a specific item from the shopping cart.  

* **REST endpoint**

  `DELETE /cart?id=oBBofNs316bjZs0d7a70`

* **HTTP Headers** 

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 

  * **Responses**
    * 200, `{items:{id:{quantity,price,subtotal,description,image_url}},total}`
    * 400 - missing/invalid id
    * 401 - user is not logged in. 
    * 404 - item with that id not in shopping cart
    * 500 - problem reading menu item or writing cart item to disk

* [Example](#)

* [implementation: lib/handlers/cart.js](cart.js#L302)



















***
***"Pizza Ordering API" /order endpoint***
====



***
# Create order with contents of shopping cart
### POST /order

 pay for the contents of shopping cart, adding the order to cutomers history, and returning the order no .

* **REST endpoint**

  `POST /order`
  
* **JSON body** `{ stripe }` or `{stripe:{number,exp_month,exp_year,cvc}}`
      * stripe - valid stripe test token, or credit card details


* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


  * **Responses**
    * 200, `{ order_id, items : {}, total, stripe : {} }` - item
    * 400 - stripe payment source is invalid 
    * 404 - no shopping cart or shopping cart is empty
    * 401 - user is not logged in. 
    * 406 - payment was not accepted
    * 500 - stripe payment failed to return payment details

* [Example](#)

* [implementation: lib/handlers/order.js](order.js#L158)

     
***
# get previous orders
### GET /order

* **REST endpoint**
    `GET /order`

* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


* **Responses**
   * 200, `[{ order_id, items : {}, total, stripe : {} }]` - items
   * 404 - no shopping cart or shopping cart is empty
   * 401 - user is not logged in.   
  
  
  
***
# get previous order
### GET /order?id

* **REST endpoint**
    `GET /order?id=abcdef234324`

* **HTTP Headers**

    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 


* **Responses**
   * 200, `{ order_id, items : {}, total, stripe : {} }` - item
   * 400 - order_id is invalid 
   * 404 - no shopping cart or shopping cart is empty
   * 401 - user is not logged in.   
  
    
    
    
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