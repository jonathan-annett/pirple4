***API Documentation***
====

***
# Sign up
### POST /user

  Create a new user account, and a session token.
 
  <br>[implementation: lib/handlers/user.js](user.js)

* **REST endpoint**

`POST /user`

* **Payload**
see [validation rules](#api-validation-rules)
```JSON
    {  "email" : "...",
       "name"  : "...",
       "password" : "...", 
       "street_address" : "..."
    }
```    

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
{ 
 "email" : "user@gmail.com", 
 "name" : "A User Name", 
 "street_address" : "4 some street address",
 "token" : { "id":"oQreTQn4X2nJuQZUudeg",
             "created":"2018-12-04T05:34:34.288Z",
             "expires":"Tue Dec 04 2018 16:34:34 GMT+1100 (AEDT)3600000"
           }
}
```
    
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />

  OR

  * **Code:** 401 UNAUTHORIZED <br />



***
# Sign in
### POST /token

  Create and return a session token for an existing user account, using credentials supplied when the account was [created](#sign-up).

<br>[implementation: lib/handlers/token.js](token.js)

* **REST endpoint**

`POST /token`

* **Payload**
see [validation rules](#api-validation-rules)
```JSON
    {  "email" : "...",
       "password" : "..."
    }
```    


* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
{ "id":"oQreTQn4X2nJuQZUudeg",
  "created":"2018-12-04T05:34:34.288Z",
  "expires":"Tue Dec 04 2018 16:34:34 GMT+1100 (AEDT)3600000"
}
```
    
    
    

* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />

one or more of the required fields is missing

OR

* **Code:** 401 UNAUTHORIZED <br />

could be one of:
  * wrong email adddress
  * incorrect password


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

  * **Code:** 400 BAD REQUEST <br />

a missing or empty token argument
OR

* **Code:** 401 UNAUTHORIZED <br />

the token is invalid or has already been signed out (deleted)

***
# Get User Info
### GET /user
----
  Get user account details.<br>
  Returns the user's data in JSON format.<br>
  Note that the password is not returned in the user data.

<br>[implementation: lib/handlers/user.js](user.js)

* **REST endpoint**

  `GET /user?email=user@domain.com`
  <br>or<br>
  `GET /user`

* if email is supplied, it must match the logged in user
* if email is not supplied, the logged in user is implied

* **HTTP Headers**
  
    `token` - The current session token ( either `id` from [POST /token](#sign-in), or `token.id` from [POST /user](#sign-up). ) 
  


* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
{ 
 "email" : "user@gmail.com", 
 "name" : "A User Name", 
 "street_address" : "4 some street address"
}
```
    
    

 
* **Error Response:**


  * **Code:** 401 UNAUTHORIZED <br>

* **Code:** 404 NOT FOUND <br>


***
# Update User Details
### PUT /user
----
  Update user account.<br>
  Returns the updated user data<br>
  Note that the password is not returned in the user data.

<br>[implementation: lib/handlers/user.js](user.js)

* **REST endpoint**

  `PUT /user`

* **HTTP Headers**
  
    `token` - the id returned from [POST /token](#sign-in) or [POST /user](#sign-up)  


* **Payload**
see [validation rules](#api-validation-rules)
```JSON
    {  "email" : "...",
       "name"  : "...",
       "password" : "...", 
       "street_address" : "..."
    }
```    
  
* if email is supplied, it must match the logged in user
* if email is not supplied, the logged in user is implied

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
```JSON
{ 
 "email" : "user@gmail.com", 
 "name" : "A User Name", 
 "street_address" : "4 some street address"
}
```
    
    

* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    



***
# Delete User
### DELETE /user
----
  Delete user account.<br>


<br>[implementation: lib/handlers/user.js](user.js)

* **REST endpoint**

  `DELETE /user?email=user@domain.com`
  <br>or<br>
  `DELETE /user`

* if email is supplied, it must match the logged in user
* if email is not supplied, the logged in user is implied

* **HTTP Headers**
  
    `token` - the id returned from [POST /token](#sign-in) or [POST /user](#sign-up)  
  


* **Success Response:**

  * **Code:** 204 <br />


* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />

  OR

  * **Code:** 401 UNAUTHORIZED <br />

 
 
***
# Get Menu Items
### GET /menu
----
  Retreive a full list of food items available to order from the menu.<br \>

  <br>[implementation: lib/handlers/menu.js](menu.js)

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
        "id": "6JiEVO9UNdNBfqWGoHKz"
    },
    {
        "description": "Meat Lovers Pizza",
        "image_url": "https://i.imgur.com/ouAz8i8.jpg",
        "price": 9.99,
        "id": "Jg1lpBcQ8pEY70Oxxl8d"
    },
    {
        "description": "Desert Pizza",
        "image_url": "https://i.imgur.com/WFqSUbe.jpg",
        "price": 19.99,
        "id": "PiBhPQWNNSek0U41aO2E"
    },
    {
        "description": "Hawaiian Pizza",
        "image_url": "https://i.imgur.com/hL00qJp.jpg?1",
        "price": 9.99,
        "id": "oBBofNs316bjZs0d7a70"
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

<br>[implementation: lib/handlers/menu.js](menu.js)

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
        "id": "6JiEVO9UNdNBfqWGoHKz"
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

<br>[implementation: lib/handlers/menu.js](menu.js)

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
        "id": "oBBofNs316bjZs0d7a70"
    }
]
```
    
* **Error Response:**
 
if there are no menu items defined mathcing your search, you will just get an empty array
 
     


***
# Add Menu Item to shopping cart
### POST /cart
----
  add an item to the shopping cart, optionally specifying quantity.
  
<br>[implementation: lib/handlers/cart.js](cart.js)

* **REST endpoint**

  `POST /cart`

* **HTTP Headers**

`token` - the id returned from [Sign In](#sign-in) (`/token`) or [Sign Up](#sign-up)  (`/user`)

* **Payload**
```JSON
    {  "id" : "...",
       "quantity"  : 1,
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

  `POST /cart`

* **HTTP Headers**

`token` - the id returned from [Sign In](#sign-in) (`/token`) or [Sign Up](#sign-up)  (`/user`)


* **Payload**
```JSON
    {  "id" : "...",
       "quantity"  : 1,
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

`token` - the id returned from [Sign In](#sign-in) (`/token`) or [Sign Up](#sign-up)  (`/user`)


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