/*
  File: handlers.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handlers
  Used By: router,helpers
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
var handlers = module.exports = { };

var _data = require('./data');
var helpers  = require('./helpers'), 
    validate = helpers.validate;

var codes = handlers.codes = {
    success_200 : 200,     //    Success with response body.
    created_201 : 201,     //    Success with response body.
    success_204 : 204,     //    Success with no response body.
    bad_request_400 : 400,     //    The request URI does not match the APIs in the system, or the operation failed for unknown reasons. Invalid headers can also cause this error.
    unauthorized_401 : 401,     //    The user is not authorized to use the API.
    forbidden_403 : 403,     //    The requested operation is not permitted for the user. This error can also be caused by ACL failures, or business rule or data policy constraints.
    not_found_404 : 404,     //    The requested resource was not found. This can be caused by an ACL constraint or if the resource does not exist.
    method_not_allowed_405 : 405,     //    The HTTP action is not allowed for the requested REST API, or it is not supported by any API.
    not_acceptable_406 : 406,     //    The endpoint does not support the response format specified in the request Accept header.
    unsupported_media_type_415 : 415,     //    The endpoint does not support the format of the request body.
    internal_server_error_500 : 500,
    text : {
    "200" : "Success",    //Success with response body.
    "201" : "Created",    //Success with response body.
    "204" : "Success",    //Success with no response body.
    "400" : "Bad Request",    //The request URI does not match the APIs in the system, or the operation failed for unknown reasons. Invalid headers can also cause this error.
    "401" : "Unauthorized",    //The user is not authorized to use the API.
    "403" : "Forbidden",    //The requested operation is not permitted for the user. This error can also be caused by ACL failures, or business rule or data policy constraints.
    "404" : "Not found",    //The requested resource was not found. This can be caused by an ACL constraint or if the resource does not exist.
    "405" : "Method not allowed",    //The HTTP action is not allowed for the requested REST API, or it is not supported by any API.
    "406" : "Not acceptable",    //The endpoint does not support the response format specified in the request Accept header.
    "415" : "Unsupported media type",    //The endpoint does not support the format of the request body.
    "500" : "Internal server error"
    }
};

var session_timeout_hours = 1;
var session_timeout_msec = (session_timeout_hours * 60 * 60 * 1000);

// generic fallback handler that returns an empty object
// note- for REPL testing, if cb is not supplied, payload object is returned.
handlers.notFound = function(data, cb) {
    var payloadOut = {};
    return typeof cb === 'function' ? cb(codes.not_found_404, payloadOut) : payloadOut;
};


// generic handler to echo to incoming request
handlers.echo = function(data, cb) {

    var payloadOut = {
        method: data.method,
        via: data.via,
        path: data.path,
        payloadIn: data.payloadIn
    };

    return typeof cb === 'function' ? cb(codes.success_200, payloadOut) : payloadOut;
};

handlers.user = {};
handlers.token= {};

// constants to ensure conistent filename spelling throughout

const USER="user";
const TOKEN = "token";

/*

Anatomy of a handler:

handlers taken 2 arguments - handlerParams and cb

    handlerParams : {
    
        when        : timestamp  
        method      : get/post/put/delete
        headers     : headers from the http request
        via         : "http" or "https"
        path        : the url 
        queryParams : <object version of query string (everything after "?" in the url)>
        payloadIn   : <parsed json from the http post/put body data> 
        
    };


note: for flexibility, handlers can be generic or specific in scope

 this means the typical use case is to write a specific handler for each method and data type, and
 the appropriate one is selected by the router at runtime
 
 there is nothing to stop you writing a generic handler that deals with post/get/delete/put for any data type
 this is the main reason the method and path fields are provided in their original form, which are more or less
 redundant in a specific handler, as for example handlers.user.post will always have a method of POST and a path /user 
 

*/


handlers.token.authentication = {
    
};

// (params.payloadIn || params.queryParams).email must match the token stored in 
// the file pointed to by params.headers.token
// calls cb(email_from_token) if ok to proceed, otherwise cb(false)

handlers.token.authentication.check = function (params,cb) {
    
    // decide where this particular request should get it's email field from
    var emailSource = {
        post:params.payloadIn,
        put:params.payloadIn,
        get:params.queryParams,
        delete:params.queryParams } [params.method];
        
        
    if (typeof emailSource !== 'object') {
        // need a valid email address source
        return cb(false);
    }
    
    var tokenSource = params.headers;
    
    // validate the email according to the validate rules
    validate.email(emailSource, function(email) {
        
        if (!email) {
            // need an actual email address
            return cb(false);
        }
        
        // ensure the token conforms to valid token format
        validate.token(tokenSource, function(token_id) {
     
            if (!token_id) {
                return cb(false);
            }
            // see if a file exists for this token, if so read it and parse it
            _data.read(TOKEN,token_id, function( err,token){
                
                if (err){
                    // there was a problem reading or parsing the file
                    return cb(false);
                }
                
                if (token.expires >= params.when) {
                    // the token has expired
                    return cb(false);
                }
                
                if (email === token.email) {
                    return cb(email);
                }
                
    
            });
            
        });   
        
    });
    
    

 
    
};



// handlers.user.post = create NEW user
// required: params.payloadIn with valid email,name,password and street_address
// does:
//  - validates inputs in params.payloadIn, creating a new sanitised user object (eg email ---> user.email)
//  - sets user.salt and updates user.password to secure values for storage
//  - destructively updates postData to remove password
handlers.user.post = function(params, cb) {
    
    var postData = params.payloadIn;

    validate.new_user(postData,function(user){
        
        if (user) {
            
            // create a hashing salt per user 
            user.salt = helpers.randomString(48);
            
            // and replace the plaintext password with a salted hashed password
            user.password = helpers.hash(postData.password,user.salt);
            
            // actually remove password from passed in object
            delete postData.password;
            
            // store the new user object in the USER table (with updated password)
            _data.create(USER,user.email,user,function(err){
                
                if (err) return cb(codes.internal_server_error_500,err);
                
                return cb(codes.success_200,user);
            });        
            
        }
        
    });
    
    
};



// user.get = get existing user
// required : params.queryParams.email <--- valid email address of existing user
handlers.user.get = function(params, cb) {
    
    

    // check the email address given in the params object
    // matches the one in the token file. if not this request can't be authorized
    handlers.token.authentication.check(params,function(email_from_token){
        
        if (!email_from_token) {
            // the token is invalid, or is for another user, or it has expired
            return cb(codes.unauthorized_401);
        }
        
       
        if (!email_from_token) {
            return cb(codes.bad_request_400);
        }
        
        // see if a file exists for this email address
        _data.read(USER,email_from_token, function( err,user){
            
            if (err){
                // there was a problem reading the file
                return cb(codes.not_found_404,err);
            }   
            
            return cb(codes.success_200,user);
        });
        
     
    });
    
    
    

};

// handlers.user.put = update existing user
// required = params.payloadIn.email - primary key for a user
// optional = params.payloadIn.street_address
//            params.payloadIn.name
//            params.payloadIn.password
handlers.user.put = function(params, cb) {

    var putData = params.payloadIn;
    
    // need a valid email address to search for a user to update
    handlers.token.authentication.check(params,function(email_from_token){
    //validate.email(putData, function(email) {

        if (!email_from_token) {
            return cb(codes.bad_request_400);
        }
        
        // first fetch existing data, thus validating user exists, and giving
        // us a base object to later update.
        _data.read(USER,email_from_token, function( err,user){
            
            if (err){
                return cb(codes.not_found_404,err);
            }   
            
            // now check update is valid as per rules laid out in validate helper
            validate.update_user(putData, user, function(updated) {
                
                if (updated) {
                    // update file and notify caller
                    
                    if (putData.password) {
                        // and replace the plaintext password with a salted hashed password
                        updated.password = helpers.hash(putData.password,user.salt);
                        delete putData.password;
                    }
                    
                    _data.update(USER,email_from_token,updated,function(){
                        cb(codes.success_200,updated);
                    });
                    
                } else {
                    return cb(codes.internal_server_error_500,err);
                }
                
            });
        });
        
    });
    

};

// handlers.user.delete = delete existing user by email address
handlers.user.delete = function(params, cb) {

     //var deleteData = params.queryParams;

     handlers.token.authentication.check(params,function(email_from_token){
     //validate.email(deleteData, function(email) {
 
         if (!email_from_token) {
             return cb(codes.bad_request_400);
         }
         
         _data.read(USER,email_from_token, function( err,user){
             
             if (err) {
                 return cb(codes.not_found_404,err);
             }   
             
            _data.delete(USER,email_from_token, function( err,user){
               
               if (err) {
                   return cb(codes.internal_server_error_500,err);
               }
               
               return cb(codes.success_204);
            });
            
         });
         
     });

 };
 

// handlers.token.post - create login token
// post a valid email and password, get back token object in return
// this object has an inbult expiry of (1) hour from creation, unless refreshed using handlers.token.put
// note - the returned token data does not contain the email feild.
handlers.token.post = function(params, cb) {
    
    var postData = params.payloadIn;

    // need a valid email address to lookup user
    validate.email(postData, function(email) {

        if (!email) {
            return cb(codes.bad_request_400);
        }
        
        // see if a file exists for this email address
        _data.read(USER,email, function( err,user){
            
            if (err){
                // there was a problem reading the file
                return cb(codes.not_found_404,err);
            }   
            
            // check the supplied password, when hashed, matches the stored hash in the user file
            helpers.checkHash(postData.password,user.salt,user.hash,function(hash_matches){
                
                console.log({postData:postData,user:user});
                delete postData.password;
                
                if (!hash_matches)  {
                    return cb(codes.forbidden_403,err); 
                }
                
                var token = {
                    id      : helpers.randomString(validate.token_length),
                    email   : email,
                    created : params.when,
                    expires : params.when + session_timeout_msec
                };
                
                _data.create(TOKEN,token.id,token,function(err){
                    
                    if (err) return cb(codes.internal_server_error_500,err);
                    delete token.email;
                    return cb(codes.success_200,token);
                });  
                
                
            });
            
        });
        
    });
    
    
}; 
 
 
// handlers.token.get - lookup token details by token_id
// required: params.queryParams.token (minus the email feild)
handlers.token.get = function(params, cb) {
                   
   var getData = params.queryParams;
   
   // ensure the token conforms to valid token format
   validate.token(getData, function(token_id) {

       if (!token_id) {
           return cb(codes.bad_request_400);
       }
       
       // see if a file exists for this token
       _data.read(TOKEN,token_id, function( err,token){
           
           if (err){
               // there was a problem reading the file
               return cb(codes.not_found_404,err);
           }   
           delete token.email;
           return cb(codes.success_200,token);
       });
       
   });
   

};


// handlers.token.put - refresh the expiry time for a token
// required: params.payloadIn.token 
//           params.payloadIn.email (must match the email for this token)
// returns: updated token object (minus the email field)
handlers.token.put = function(params, cb) {

   var putData = params.payloadIn;
   
   // ensure the token conforms to valid token format
   validate.token(putData, function(token_id) {

       if (!token_id) {
           return cb(codes.bad_request_400);
       }
       
       // first fetch existing data, thus validating that the token exists
       // (we'll also use the data to verify the expiry if it does in fact exist)
       _data.read(TOKEN,token_id, function( err,token){
           
           if (err){
               // abort if token does not exist
               return cb(codes.not_found_404,err);
           }   
           
           
           if (
               (token.expires >= Date.now()) || // abort if token has already expired.
                 !( 
                    (typeof token.email === 'string') &&
                    (token.putData === token.email)
                  )
               ) {
                   
               return cb(codes.unauthorized_401,err);
               
           }
           
           // refresh the expiry time by (1) hour 
           token.expires = params.when + session_timeout_msec; 
           
           _data.update(TOKEN,token.id,token,function(err){
               
               if (err) {
                   // abort 
                   return cb(codes.internal_server_error_500,err);
               }
               
               delete token.email;
               return cb(codes.success_200,token);
           });  
           
           
           
       });
       
   });
   

};



if (process.mainModule===module) {
    

 var handlerParams = {
         when        : new Date(),
         method      : "post",
         headers     : [],
         via         : 'https',
         path        : "/user",
         queryParams : {},
         payloadIn   : {
             
             name  : "Johnny Appleseed",
             email : "johnny.appleseed.fake.addresss@gmail.com",
             password : "A s3cret#",
             street_address : "5 The Orchard Lane"
         }
     };

    
 
 handlers.user.post(handlerParams, function(code,payload) {
     
     console.log({code:code,payload:payload});
     
     if (code===200) {
         
        delete handlerParams.payloadIn.name;
        delete handlerParams.payloadIn.street_address;
        
        handlers.token.post(handlerParams,function(code,payload) {
           console.log({code:code,payload:payload});
        });
     }
     
     
 });
       
    
    
}