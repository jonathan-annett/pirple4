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
var fs = require("fs");

//var _data = require('./data');
//var helpers  = require('./helpers'), 
//    validate = helpers.validate;

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

fs.readdirSync("./handlers").forEach(
    function(fn){ 
      if (fn.substr(-3)===".js"){
         require('./handlers/'+fn)(handlers);
       }
    });

if (process.mainModule===module) {
    

var handlerParams = {
     when        : new Date(),
     method      : "post",
     headers     : {},
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
        handlerParams.payloadIn.password = "A s3cret#";
        delete handlerParams.payloadIn.name;
        delete handlerParams.payloadIn.street_address;
        handlerParams.path="/token";
        handlers.token.post(handlerParams,function(code,payload) {
           console.log({code:code,payload:payload});
           
           handlerParams.headers.token = payload.id;
           handlerParams.method="get";
           handlerParams.path="/user";
           handlerParams.queryParams.email = handlerParams.payloadIn.email;
           delete handlerParams.payloadIn;
           
           if (code===200) {
           
               handlers.user.get(handlerParams,function(code,payload) {
                   console.log({code:code,payload:payload});
               });
    
           }           
        });
     }
     
     
 });
       
    
    
}