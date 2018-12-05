/*
  File: user.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handler for user database
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


var _data    = require('../data');
var helpers  = require('../helpers');
var validate = helpers.validate;
    
// constants to ensure conistent filename spelling throughout
const USER="user";
   
module.exports=function(handlers){
    var codes = handlers.codes;
    
    handlers.user={};
    
    // handlers.user.post = create NEW user
    // required: params.payloadIn with valid email,name,password and street_address
    // does:
    //  - validates inputs in params.payloadIn, creating a new sanitised user object (eg email ---> user.email)
    //  - sets user.salt and updates user.password to secure values for storage
    //  - destructively updates postData to remove password
    handlers.user.post = function(params, cb) {
        var postData = params.payloadIn;
        validate.new_user(postData,function(user){
            
            if (!user) {
                return cb(codes.bad_request_400);
            }
                
            // create a hashing salt per user 
            user.salt = helpers.randomString(48);
            
            // and replace the plaintext password with a salted hashed password
            user.password = helpers.hash(postData.password,user.salt);
            
            
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
                    return cb(codes.unauthorized_401,err);
                }
                
                // 
                handlers.token.post(loginParams, function(code,token) {
                    
                    if (code!==200) {
                        return cb(code,token);
                    }
                    
                    user.token=token;
                    return cb(codes.success_200,user);
                });

            });
            
    
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
                validate.update_user(putData, user, function(updated) {
                    
                    if (updated) {
                        // update file and notify caller
                        
                        if (putData.password) {
                            // and replace the plaintext password with a salted hashed password
                            updated.password = helpers.hash(putData.password,user.salt);
                            delete putData.password;
                        }
                        
                        _data.update(USER,email_from_token,updated,function(){
                            delete user.password;
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
    
    // handlers.user.delete = delete existing user by email address
    handlers.user.delete = function(params, cb) {
    
         //var deleteData = params.queryParams;
    
         handlers.token.authentication.check(params,function(email_from_token){
         //validate.email(deleteData, function(email) {
     
             if (!email_from_token) {
                 // the token is invalid, or is for another user, or it has expired
                 return cb(codes.unauthorized_401);
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
     
    
};

