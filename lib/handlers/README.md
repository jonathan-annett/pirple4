***API Documentation***
====

***
# Sign up
----

  Create a new user account.<br>
  returns the provided user data, and a newly created session token.<br>
  note that the password is not returned in the user data.

* **REST endpoint**

  `POST /user HTTP/2`

* **Payload**

```JSON
    {  "email" : "<>",
       "password" : "<>",
    }
```    

  **email** `valid email address`
  
  **name** `full name`
  
  **password** `valid password`
  
    * at least 8 characters
    * at least 1 upper case character
    * at least 1 lower case character
    * at least 1 numeric digit from 0 through 9
    * at least 1 symbol or space character 
    
  **street_address** `a valid street address`
     * at least 1 line of 3 words
     * at least 1 of the words must be a number
  

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
----
  Create a session token

* **URL**

  `/token`

* **Method:**

  `POST`
  

* **Data Params (JSON)**

  **email** `valid email address`
  
   **password** `valid password`
  
    * at least 8 characters
    * at least 1 upper case character
    * at least 1 lower case character
    * at least 1 numeric digit from 0 through 9
    * at least 1 symbol or space character 


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
----
  Delete a session token, logging out the user<br />
  also clears any shopping cart associated with this session token
  

* **URL**

  `/token?token=abcdef123456789`

* **Method:**

  `DELETE`
  
*  **URL Params**

   **Required:**
 
   `token` - the id returned from [Sign In](#sign-in) (`/token`) or [Sign Up](#sign-up)  (`/user`)

* **Success Response:**

  * **Code:** 204 <br />

    
    
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />

most probably a missing token   
OR

* **Code:** 401 UNAUTHORIZED <br />

most probably the token is invalid or has already been signed out (deleted)

***
# Get User Info
----
  Get user account details.<br>
  returns the provided user data.<br>
  note that the password is not returned in the user data.

* **URL**

  `/user?email=user@domain.com`

* **Method:**

  `GET`
  
  
* **HTTP Headers**
  
    `token` - the id returned from [Sign In](#sign-in) (`/token`) or [Sign Up](#sign-up)  (`/user`)
  
*  **URL Params**

   **Required:**
 
   `email` - must match the email address used to create the token


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

  * **Code:** 400 BAD REQUEST <br>

  OR

  * **Code:** 401 UNAUTHORIZED <br>




***
# Update User Details
----
  Update user account.<br \>
  returns the updated user data, and a newly created session token.<br \>
  note that the password is not returned in the user data.

* **URL**

  `/user`

* **Method:**

  `PUT`
  
* **HTTP Headers**

    `token` - the id returned from [Sign In](#sign-in) (`/token`) or [Sign Up](#sign-up)  (`/user`)


* **Data Params (JSON)**

  **email** `valid email address` - required, must match token
  
  **name** `full name` - optional
  
  **password** `valid password` - optional
  
    * at least 8 characters
    * at least 1 upper case character
    * at least 1 lower case character
    * at least 1 numeric digit from 0 through 9
    * at least 1 symbol or space character 
    
  **street_address** `a valid street address` - optional
     * at least 1 line of 3 words
     * at least 1 of the words must be a number
  

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
----
  Delete user account.<br>

* **URL**

  `/user?email=user@domain.com`

* **Method:**

  `DELETE`
  
* **HTTP Headers**

    `token` - the id returned from [Sign In](#sign-in) (`/token`) or [Sign Up](#sign-up)  (`/user`)

  
*  **URL Params**

   **Required:**
 
  **email** `valid email address` - required, must match token


* **Success Response:**

  * **Code:** 204 <br />


 
* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />

  OR

  * **Code:** 401 UNAUTHORIZED <br />

 
 
***
# Get Menu Items
----
  Retreive a full list of food items available to order from the menu.<br \>

* **URL**

  `/menu`

* **Method:**

  `GET`
  

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
----
  Retreive a specific food item available to order from the menu.<br \>

* **URL**

  `/menu?id=6JiEVO9UNdNBfqWGoHKz`

* **Method:**

  `GET`
  
*  **URL Params**

 **Required:**

**id** `valid menu id` - required


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
# Search Menu Items
----
  Filter the list of items available to order from the menu.<br>

* **URL**

  `/menu?description=hawaii`

* **Method:**

  `GET`
  
*  **URL Params**

 **Required:**

**desciption** `search term` - required


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
----
  add an item to the shopping cart, optionally specifying quantity.<br>

* **URL**

  `/cart`

* **Method:**

  `POST`
  

* **HTTP Headers**

`token` - the id returned from [Sign In](#sign-in) (`/token`) or [Sign Up](#sign-up)  (`/user`)

* **Data Params (JSON)**

**id** `valid menu item id` - required

**quantity** `how many items to add` - optional, defaults to 1



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
<a id="update_item_quantity"></a>
**Update quantity of items in shopping cart**
----
  update the number of items in the shopping cart.<br>

* **URL**

  `/cart`

* **Method:**

  `PUT`
  

* **HTTP Headers**

`token` - the id returned from [Sign In](#sign-in) (`/token`) or [Sign Up](#sign-up)  (`/user`)

* **Data Params (JSON)**

**id** `valid menu item id` - required

**quantity** `number to set quantity to` - required (supplyinng 0 will remove the item from the cart)


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
----
 remove a specific item from the shopping cart.<br>

* **URL**

  `/cart?id=oBBofNs316bjZs0d7a70`

* **Method:**

  `DELETE`
  

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
 



     

    