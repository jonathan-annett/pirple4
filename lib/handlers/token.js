/*
  File: token.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handler for user session tokens
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/



var session_timeout_hours = 1;
var session_timeout_msec = (session_timeout_hours * 60 * 60 * 1000);

var _data    = require('../data');
var helpers  = require('../helpers');
var validate = helpers.validate;
    
// constants to ensure conistent filename spelling throughout
const TOKEN = "token";
const USER  = "user";


module.exports=function(handlers){
    var codes = handlers.codes;
    
    handlers.token = {};
    
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
                    
                    return cb(false);
                    
        
                });
                
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
                
                if (token.expires >= params.when) {
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
                helpers.checkHash(postData.password,user.salt,user.password,function(hash_matches){
                    
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
                _data.delete(TOKEN,token_id, function( err,user){
                   
                   if (err) {
                       return cb(codes.internal_server_error_500,err);
                   }
                   
                   return cb(codes.success_204);
                });
            });
            
        });
    }
    
};