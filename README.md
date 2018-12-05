# pirple2

#**pizza ordering api**

[assignment](assignment.md)

***this project is under development***
***and is not complete***


#installation

    mkdir -p ~/jonathan.annett.homework
    cd ~/jonathan.annett.homework
    # if reinstalling
    rm -rf ./pirple2
    git clone https://github.com/jonathan-annett/pirple2.git
    cd pirple2
    

#configuration

    mkdir -p ~/jonathan.annett.homework/.apis
    $(which nano||which vi) ~/jonathan.annett.homework/.apis/mailgun.json
    
*PASTE AND EDIT TO REFLECT YOUR API SETTINGS*

    {
        "api_key" : "**insert key here**",
        "base_url" : "https://api.mailgun.net/v3/INSERT_SANDBOX_HERE.mailgun.org",
        "sender" : "info@INSERT_SANDBOX_HERE.mailgun.org"
    }



***Documentation***
====


**Sign up**
----
  Create a new user account.

* **URL**

  /user

* **Method:**

  `POST`
  
*  **URL Params**

   **Required:**
 
   `(none)`

* **Data Params (JSON)**

  **email** `valid email address`
  
  **name** `full name`
  
  **password** `valid password`
  
    * at least 8 characters
    * at least 1 upper case character
    * at least 1 lower case character
    * at least 1 numeric digit from 0 through 9
    * at least 1 symbol or space character 
    
  **street_address** `a valid street address`
     * at least 1 one line of 3 words
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


**Sign in**
----
  Create a session token

* **URL**

  /token

* **Method:**

  `POST`
  
*  **URL Params**

   **Required:**
 
   `(none)`

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
   
OR

* **Code:** 401 UNAUTHORIZED <br />

