/*
  File: user.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handler for user data files
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


var _data    = require('../data');
var helpers  = require('../helpers');
var validate = helpers.validate;
    
// constants to ensure conistent filename spelling throughout
const USER="user";
const CART="cart";
const TOKEN="token";
   
module.exports=function(handlers){
    var codes = handlers.codes;
    
    handlers.user={};
    
    /**********************************/
    /*** REST API HANDLERS FOR /user **/
    /**********************************/
    
    
    

    /*
      Common Name:      Sign Up
      Specification:    "New users can be CREATED, their information can be edited, and they can be deleted. 
                         We should store their name, email address, and street address."
      Code:             handlers.user.post() in user.js      
      Endpoint:         POST /user
      JSON Payload:     {"email":"user@domain.com","name":"Mr Squirrely Squirrel", password":"monkey123","street_address" : "45 Squirrel Lane"}
      Responses:
                        200,{ email,name, street_address, token:{id,created,expires,cart_id }} -
                        400 - missing/invalid email, password or street address.
                        403,{error} - user already exists.
                              (or something else that stopped the creation of a new file - disk space or hardware error)
                              
      Notes:
         - the password is not returned to the user, and it is stored internally as a hash result
         - as this endpoint automatically calls POST /token to sign in the user, if there was any issue doing that
         the error code will be something other than 200, ie whatever POST /token returned
         - any "200 content" response from POST/token is returned as the token field (see 200 response above).
    */
    handlers.user.post = function(params, cb) {
        var postData = params.payloadIn;
        validate.new_user(postData,function(err,user){
            
            if (err||!user) {
                return cb(codes.bad_request_400,err);
            }
                
            // create a hashing salt per user 
            user.salt = helpers.randomString(48);
            
            // and replace the plaintext password with a salted hashed password
            user.password = helpers.hash(postData.password,user.salt);
            
            // create an empty order history list
            user.orders = [];
            
            
            // pre-prepare loginParams to log in the newly created user with a new session token
            var loginParams = {
              when        : params.when,
              method      : "post",
              headers     : params.headers,
              via         : params.via,
              path        : "/token",
              payloadIn   : {
                  email:user.email,
                  password:postData.password,
              }
            };
            
            // remove password from passed in object
            delete postData.password;
            
            // store the new user object in the USER table (with updated password)
            _data.create(USER,user.email,user,function(err){
                delete user.password;
                delete user.salt;
                
                if (err) {
                    // probably means user already exists. (Or can't write file)
                    return cb(codes.forbidden_403,err);
                }
                
                // 
                handlers.token.post(loginParams, function(code,token) {
                    
                    if (code!==200) {
                        return cb(code,token);
                    }
                    
                    user.token=token;
                    
                    delete user.token.email;
                    
                    return cb(codes.success_200,user);
                    
                });

            });
            
    
        });
    };
    
    /*
      Common Name:      Get User Info
      Specification:    "New users can be created, their information can be EDITED, and they can be deleted. 
                         We should store their name, email address, and street address."
      Code:             handlers.user.get() in user.js      
      
      Endpoint:         GET /user?email=user@domain.com
                            -or-      
                        GET /user
                        
      Http Headers:     token: current-token-id
      Responses:
                        200,{ email,name, street_address } - user details
                        401 - missing/expired session (token header), or wrong email address
                        404 - can't read user details
    */   
    handlers.user.get = function(params, cb) {
        
        // check the email address given in the params object
        // matches the one in the token file. if not this request can't be authorized
        handlers.token.authentication.check(params,function(email_from_token){
            
            if (!email_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            }
            
            // see if a file exists for this email address
            _data.read(USER,email_from_token, function( err,user){
                
                if (err){
                    // there was a problem reading the file
                    return cb(codes.not_found_404,err);
                }   
                delete user.password;
                delete user.salt;
                return cb(codes.success_200,user);
                
            });
            
        });

    };
    
    
    /*
      Common Name:      Update User Details
      Specification:    "New users can be created, their information can be EDITED, and they can be deleted. 
                         We should store their name, email address, and street address."
      Code:             handlers.user.put() in user.js      
      Endpoint:         PUT /user
      JSON Payload:     {"email":"user@domain.com","name":"Mr Squirrely Squirrel", "password":"monkey123","street_address" : "45 Squirrel Lane"}
      Http Headers:     token: current-token-id
      Responses:
                        200,{ email,street_address} 
                        401 - (token invalid/missing/expired/wrong email in token file)
                        404 - user not found (for admins trying to update another user file)
                        500 - missing/invalid email, password or street address, or no field to update.
                        
      Notes:
         - only those fields supplied will be updated
         - email is not updated, and if suppplied, must match the logged in user
         - if email is not supplied, the logged in user is implied.
         - admins can update other users (by supplying another valid email and only if permissions.admin===true in the logged in user's .data/user/username@dmain.com.json)
         - the password is not returned to the user, and it is stored internally as a hash result
    */    
    handlers.user.put = function(params, cb) {
    
        var putData = params.payloadIn;
        
        // need a valid email address to search for a user to update
        handlers.token.authentication.check(params,function(email_from_token){

            if (!email_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            }
            
            // first fetch existing data, thus validating user exists, and giving
            // us a base object to later update.
            _data.read(USER,email_from_token, function( err,user){
                
                if (err){
                    return cb(codes.not_found_404,err);
                }   
                
                // now check update is valid as per rules laid out in validate helper
                
                if (!putData.email) { putData.email = email_from_token;}
                
                validate.update_user(putData, user, function(updated) {
                    
                    if (updated) {
                        // update file and notify caller
                        
                        if (putData.password) {
                            // and replace the plaintext password with a salted hashed password
                            updated.password = helpers.hash(putData.password,user.salt);
                        }
                        
                        _data.update(USER,email_from_token,updated,function(){
                            if (putData.password) {
                                user.password=true;
                            } else {
                                delete user.password;
                            }
                            delete user.salt;
                            cb(codes.success_200,updated);
                        });
                        
                    } else {
                        return cb(codes.internal_server_error_500,err);
                    }
                    
                });
            });
            
        });
        
    
    };
    
    /*
      Common Name:      Delete User
      Specification:    "New users can be created, their information can be edited, and they can be DELETED."
      Code:             handlers.user.delete() in user.js      
      
      Endpoint:         DELETE /user?email=user@domain.com
                            -or-      
                        DELETE /user
                        
      Http Headers:     token: current-token-id
      Responses:
                        204 - user deleted ok
                        401 - missing/expired session (token header), or wrong email address
                        404 - can't read user details,
                        500 - error occured reading or deleting one of the files
    */ 
    handlers.user.delete = function(params, cb) {
    
         // first get permission and the email address from session token
         handlers.token.authentication.check(params,function(email_to_delete){
             
             if (!email_to_delete) {
                 // the token is invalid, or is for another user, or it has expired
                 return cb(codes.unauthorized_401);
             }
             
             var token_id = params.headers.token;
             
             // now read in the token file for the logged in user (might be an admin)
             _data.read(TOKEN,token_id, function(err,token){
                       
                   if (err) {
                       return cb(codes.internal_server_error_500,err);
                   }
                       
              
                 // delete the user's json file
                 
                _data.delete(USER,email_to_delete, function( err){
                   
                   if (err) {
                       return cb(codes.internal_server_error_500,err);
                   }
                   
               
                   if (token.email !== email_to_delete) {
                       // don't try to delete session token file unless 
                       // it' the current user deleting their own account
                       return cb(codes.success_204);
                   }
                   
                   // delete the session token file
                   _data.delete(TOKEN,token_id, function(err){
                       
                      if (err) {
                          // this would be a rare error, so log it
                          console.log("coud not delete session token:"+token_id);
                          return cb(codes.internal_server_error_500,err);
                      }
                      
                      _data.delete(CART,token.cart_id, function(){
                         // ignore error if shopping cart is missing
                         // (user might have logged in and not ordered anything)
                         return cb(codes.success_204);
                         
                      });
                      
                   });
                   
                   
               });
              
              
              
               
               
               
            });
            
     
             
         });
    
     };
     
    /***********************************/
    /*** HTML HANDLERS FOR /user      **/
    /***********************************/
 
    /* 
    handlers.user.html = {};
    
    // handler for /account/create
    handlers.user.html.create = function(params,cb) {
        
          params.htmlOptions = {
              source : ["templates/_header.html","templates/accountCreate.html","templates/_footer.html"],
              variables : { 
                  'head.title'       : 'Create an Account',
                  'head.description' : 'Signup is quick, and is happening right now...',
                  'body.class'       : 'accountCreate',
                  'meta.handler'     : 'user.html.create'
              }
          };
          return handlers.html.template(params,cb);
     };
     
    // handler for /account/edit
    handlers.user.html.edit = function(params,cb) {
        
          params.htmlOptions = {
              source : ["templates/_header.html","templates/accountEdit.html","templates/_footer.html"],
              variables : { 
                  'head.title'       : 'Edit Account Details',
                  'body.class'       : 'accountEdit',
                  'meta.handler'     : 'user.html.edit'
              },
              dataSources : { }
          };
          return handlers.html.template(params,cb);
     };
     
     
    // handler for /account/deleted
    handlers.user.html.deleted = function(params,cb) {
        
          params.htmlOptions = {
              source : ["templates/_header.html", "templates/accountDeleted.html", "templates/_footer.html"],
              variables : { 
                  'head.title'       : 'Account Deleted',
                  'head.description' : 'Your account has been deleted.',
                  'body.class'       : 'accountDeleted',
                  'meta.handler'     : 'user.html.deleted'
              },
              dataSources : { }
          };
          return handlers.html.template(params,cb);
     };
     */
};

