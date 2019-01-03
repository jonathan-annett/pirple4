/*
  File: token.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handler for user session tokens
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
and associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/



var session_timeout_hours = 1;
var session_timeout_msec = (session_timeout_hours * 60 * 60 * 1000);

var _data    = require('../data');
var helpers  = require('../helpers');
var validate = helpers.validate;
    
// constants to ensure conistent filename spelling throughout
const TOKEN = "token";
const USER  = "user";
const CART  = "cart";


module.exports=function(handlers){
    var codes = handlers.codes;
    
    handlers.token = {};
    
    handlers.token.basedir = _data.join(TOKEN);
    
    
    // internal token authentication/information helpers used by other endpoints
    handlers.token.authentication = {
        
    };
    
    
    /*
      Common Name:      Authenticate current session
      Code:             handlers.token.authentication.check() in token.js      
      Endpoint:         various (internal use only)
      GET/DELETE params: { "email":"user@domain.com" }
      PUT/POST Payload:  { "email":"user@domain.com" }
      Http Headers:     token: current-token-id
      notes - if email field is supplied, it MUST match the specified token
            - if email field is NOT SUPPLIED, the email of the current token is assumed
            - users with permissions.admin===true in their ./.data/user/username@domain.com.json file 
              can authenticate using the email of any other user
            
      Responses: 
                cb(false) - could not authenticate the session (invalid token, incorrect email or session expired)
                cb("email@address.com") - authenticated for email address 
    */
    
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
                
                if (typeof emailSource.email === 'undefined') {
                    // special case to use logged in email if no email is supplied.
                    // we check this later once we have validated the token
                    email=null;
                } else {
                    // need an actual email address
                    return cb(false);
                }
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
                    
                    if (token.expires <= params.when) {
                        // the token has expired
                        return cb(false);
                    }
                    
                    if ( 
                          (email === null)          || // special case to use logged in email if no email is supplied.
                          (email === token.email)    // email supplied matches the token for logged in user
                       ) {
                           
                        return cb(token.email);
                        
                    }
                    
                    if (typeof email==='string') {
                        // an email address was supplied which does not match the logged in user
                        // see if they have admin access
                        return handlers.token.authentication.permissions(params,function(permissions){
                            
                            if (permissions && permissions.admin) {
                                // admins can access any account.
                                return cb(email);
                            }
                            
                            return cb(false);
                                                    
                        });
                    }
                    
                    return cb(false);
                    
        
                });
                
            });   
            
        });
        
        
    
     
        
    };
    
    
    /*
      Common Name:      Lookup cart email and cart_id (requires previously authenticated token that has not expired)
      Code:             handlers.token.authentication.email_and_cart() in token.js      
      Endpoint:         various (internal use only)
      Http Headers:     token: current-token-id
      Responses: 
                cb(false) - could not authenticate the session (invalid token, incorrect email or session expired)
                cb("email@address.com","the-currente-cart-id") - logged in user is authenticated for email address, with cart
    */
    handlers.token.authentication.email_and_cart = function (params,cb) {
        
        var tokenSource = params.headers;
    
        // ensure the token conforms to valid token format
        validate.token(tokenSource, function(token_id) {
     
            if (!token_id) {
                return cb(false,false);
            }
            
            // see if a file exists for this token, if so read it and parse it
            _data.read(TOKEN,token_id, function( err,token){
                
                if (err){
                    // there was a problem reading or parsing the file
                    return cb(false,false);
                }
                
                console.log(token);
                
                if (token.expires <= params.when) {
                    // the token has expired
                    return cb(false,false);
                }
                
                if (!token.cart_id) {
                    // the token file does not appear to have a cart id
                    return cb(false,false);
                }
                
                return cb(token.email,token.cart_id);

            });
            
        });   

    };
    
    /*
      Common Name:      create new cart (requires previously authenticated token that has not expired)
      Code:             handlers.token.authentication.email_and_cart() in token.js      
      Endpoint:         various (internal use only)
      Http Headers:     token: current-token-id
      Responses: 
                cb(false) - could not authenticate the session (invalid token, incorrect email or session expired)
                cb("email@address.com","the-currente-cart-id") - logged in user is authenticated for email address, with cart
    */
    handlers.token.authentication.new_cart = function (params,cb) {
        
        var tokenSource = params.headers;
    
        // ensure the token conforms to valid token format
        validate.token(tokenSource, function(token_id) {
     
            if (!token_id) {
                console.log({no_token_id:tokenSource});
                return cb(false,false);
            }
            
            // see if a file exists for this token, if so read it and parse it
            _data.read(TOKEN,token_id, function( err,token){
                
                if (err){
                    // there was a problem reading or parsing the file
                    console.log({error_reading_token:err});
                    return cb(false,false);
                }
                
                if (token.expires <= params.when) {
                    // the token has expired
                    console.log({token_expired:err});
                    return cb(false,false);
                }
                
                // invent a new cart id 
                var new_cart_id = helpers.randomString(validate.token_length,handlers.cart.basedir);
                
                if (token.cart_id) {
                    

                    // if a cart file exists for previous shopping cart, delete it
                    _data.delete(CART,token.cart_id,function(){
                        
                        token.cart_id = new_cart_id;
                        // update the token file with the new shopping cart id
                    
                        _data.update(TOKEN,token_id, token,function(err){
                            if (err){
                                // there was a problem updating the file
                                console.log({error_updating_token:err});
                                return cb(false,false);
                            }
                            
                            return cb(token.email,token.cart_id);
                        });
                        
                    });

                }

            });
            
        });   

    };
    
    
    
    
    // returns the permissions object from the current user, assuming they have a valid token
    // if no valid token exists, or the user does not have a permissions object, returns false
    handlers.token.authentication.permissions = function (params,cb) {
        
        var tokenSource = params.headers;
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
                
                if (token.expires <= params.when) {
                    // the token has expired
                    return cb(false);
                }
                
                // see if a file exists for this email address
                _data.read(USER,token.email, function( err,user){
                    
                    if (err){
                        // there was a problem reading the file
                        return cb(false);
                    }   
                    
                    return cb(user.permissions || false);
                    
                });

    
            });
            
        });   
        
    

     
        
    };
    
    
    
    
    
    
    
    
    
    /***********************************/
    /*** REST API HANDLERS FOR /token **/
    /***********************************/
    
    
    

    /*
      Common Name:      Sign In
      Specification:    "Users can log in and log out by CREATING or destroying a token."
      Code:             handlers.token.post() in token.js      
      Endpoint:         POST /token
      JSON Payload:     {"email":"user@domain.com","password":"monkey123"}
      Http Headers:     token: last-known-token-id (optional)
      Responses:
                        200,{id,email,created,expires,cart_id } - session created ok
                        400 - missing or invalid email
                        401 - user and password does not match an account.
    */
    handlers.token.post = function(params, cb) {
        
        // for security reasons, we rate limit POST /token FAILURES to precisely 5000 milliseconds
        // regardless of the reason for the failure, the callback happens 5000 msec after initial call
        // this is to prevent "hammering" of the api to guess passwords, and to prevent
        // inferring if a username exists based on how long it took to get a response.
        // this means it will always take 5 seconds to get an error code, otherwise 
        // the api returns immedately
        var rate_limit_msecs = 5000;
        var email_missing_message = "Please enter your email address";
        var wrong_user_message = "Can't find an account with that email and password combination";
        var wrong_password_message = wrong_user_message;
        var cb_error= function(code,message) {
            var delay = rate_limit_msecs - (Date.now()- params.when);
            setTimeout(function(){ cb(code,{Error:message}); },delay>0?delay:0);
        };
        
        var postData = params.payloadIn;
        var recycleTokenData = params.headers;
    
        
        validate.email(postData, function(email) {
    
            if (!email) {
                // need a valid email address to lookup user
                return cb_error(codes.bad_request_400,email_missing_message);
            }
            
            // helper subfunctions to exit by either creating or updating a token_id
            var save = function(write_mode,token_id,cart_id,created,permissions) {
            
                var token = {
                    id      : token_id,
                    email   : email,
                    created : created,
                    expires : params.when + session_timeout_msec,
                    cart_id : cart_id
                };
                
                _data[write_mode](TOKEN,token.id,token,function(err){
                    
                    if (err) return cb(codes.unauthorized_401);
                    if (permissions) token.permissions = permissions;
                    return cb(codes.success_200,token);
                    
                });  
            
            };
            var recyle = function (token_id,cart_id,created,permissions) {
                save("update",token_id,cart_id,created,permissions);
            };
            var new_token = function (permissions) {
                save(
                    "create",
                    helpers.randomString(validate.token_length,handlers.token.basedir),
                    helpers.randomString(validate.token_length,handlers.cart.basedir),
                    params.when,
                    permissions
                );
            };
            
            // see if a file exists for this email address
            _data.read(USER,email, function( err,user){
                
                if (err){
                    // there was a problem reading the file
                    return cb_error(codes.unauthorized_401,wrong_user_message);
                }   
                
                // check the supplied password, when hashed, matches the stored hash in the user file
                helpers.checkHash(postData.password,user.salt,user.password,function(hash_matches){
                    
                    console.log({postData:postData,user:user});
                    delete postData.password;
                    
                    if (!hash_matches)  {
                        return cb_error(codes.unauthorized_401,wrong_password_message); 
                    }
                    
                    // attempt to recyle the token_id if it exists
                    validate.token(recycleTokenData, function(token_id) {
                        
                        if (token_id) {
                            
                            _data.read(TOKEN,token_id, function( err,token){
                                
                                if ( ! err 
                                     && token 
                                     && (token.email===email) 
                                     && (typeof token.cart_id === 'string')
                                     && (params.when < token.expires)
                                    ) {
                                    // reuse the caller's token from the header,
                                    // thus salvaging the shopping cart
                                    return recyle(token_id,token.cart_id,token.created,user.permissions);
                                }
                                return new_token(user.permissions);
                            });
                            
                        } else {
                            return new_token(user.permissions);
                        } 
                        
                    });


                });
                
            });
            
        });
        
        
    }; 
     
     
    /*
      Common Name:      Get Token
      Code:             handlers.token.get() in token.js      
      Endpoint:         GET /token?token=some-valid-token-id
      Responses:
                        200,{id,email,created,expires,cart_id } - session details
                        400 - missing or invalid token_id format
                        404 - token does not refer to a valid session
                        401 - session has already expired.
    */    
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
               
               if (
                   token.expires <= Date.now() // abort if token has already expired.
                  ) {
                       
                   return cb(codes.unauthorized_401,err);
                   
               }
               
               return cb(codes.success_200,token);
               
           });
           
       });
       
    
    };
    
    
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
    handlers.token.put = function(params, cb) {
    
       var putData = params.payloadIn;
       
       // ensure the token conforms to valid token format
       validate.token(putData, function(token_id) {
    
           if (!token_id) {
               return cb(codes.bad_request_400);
           }
           
           // first fetch existing data, thus validating that the token exists
           // (we'll also use the data to verify the expiry if it does in fact exist)
           _data.read(TOKEN,token_id, function( err,token) {
               
               if (err){
                   // abort if token does not exist
                   return cb(codes.not_found_404,err);
               }   
               
               
               if (
                   token.expires <= Date.now() // abort if token has already expired.
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
                   
                   return cb(codes.success_200,token);
               });  
           });
           
       });
       
    
    };
    

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
    handlers.token.delete = function (params,cb) {
        var deleteData = params.queryParams;
        
        // ensure the token conforms to valid token format
        validate.token(deleteData, function(token_id) {
     
            if (!token_id) {
                return cb(codes.bad_request_400);
            }
            
            // see if a file exists for this token
            _data.read(TOKEN,token_id, function( err,token){
                
                if (err){
                    // there was a problem reading the file
                    return cb(codes.not_found_404,err);
                }   
                
                _data.delete(TOKEN,token_id, function( err){
                    
                   if (err) {
                       return cb(codes.internal_server_error_500,err);
                   }
                   
                   // if a shoppping cart file exists for this session, delete it also 
                   _data.delete(CART,token.cart_id, function( err ){
                       
                       // silently ignore any error - if cart does not exist, not an issue
                       if (err) {
                        console.log({error_deleting_cart:err,cart_id:token.cart_id});
                       }
                        return cb(codes.success_204);    
                        
                   });
                   
                   
                });
            });
            
        });
    };
  
    /***********************************/
    /*** HTML HANDLERS FOR /token     **/
    /***********************************/
  /*
    handlers.token.html = {};
    
    // handler for /session/create
    handlers.token.html.create = function(params,cb) {
       
         params.htmlOptions = {
             source : ["templates/_header.html","templates/sessionCreate.html","templates/_footer.html"],
             variables : { 
                 'head.title'       : 'Login to your account.',
                 'head.description' : 'Please enter your email and password to access your account.',
                 'body.class'       : 'sessionCreate',
                 'meta.handler'     : 'token.html.create'
             }
         };
         
         return handlers.html.template(params,cb);
    };
    
    
    // handler for /session/deleted
    handlers.token.html.deleted = function(params,cb) {
       
         params.htmlOptions = {
             source : ["templates/_header.html","templates/sessionDeleted.html","templates/_footer.html"],
             variables : { 
                 'head.title'       : 'Logged Out',
                 'head.description' : 'You have been logged out of your account.',
                 'body.class'       : 'sessionDeleted',
                 'meta.handler'     : 'token.html.deleted'
             }
         };
         
         return handlers.html.template(params,cb);
    };
    */
    
};