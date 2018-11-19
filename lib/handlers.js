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
var handlers = module.exports = {

};
var _data = require('./data');
var helpers = require('./helpers');

// generic fallback handler that returns an empty object
// note- for REPL testing, if cb is not supplied, payload object is returned.
handlers.notFound = function(data, cb) {
    var payloadOut = {};
    return typeof cb === 'function' ? cb(200, payloadOut) : payloadOut;
};

// handler for homework assignment 1:
// When someone posts anything to the route /hello, you should return a welcome message, in JSON format. 
// This message can be anything you want. 
handlers.hello = function(data, cb) {

    var payloadOut = {
        hello: "world",
        message: "Anything you want",
        postPayload: typeof data.payloadIn === "object" ? data.payloadIn : {
            "note": "no data was posted"
        }
    };

    return typeof cb === 'function' ? cb(200, payloadOut) : payloadOut;
};


// generic handler to echo to incoming request
handlers.echo = function(data, cb) {

    var payloadOut = {
        method: data.method,
        via: data.via,
        path: data.path,
        payloadIn: data.payloadIn
    };

    return typeof cb === 'function' ? cb(200, payloadOut) : payloadOut;
};

handlers.user = {};


var USER="user";

handlers.user.post = function(data, cb) {

    helpers.validate.new_user(data,function(user){
        if (user) {
            
            user.
            
            _data.create(USER,user.email,user,function(err){
                
                if (err) return cb(500,err);
                
                cb(200,user);
            });        
        }
    });

    
    
};

handlers.user.get = handlers.echo;
handlers.user.put = handlers.echo;
handlers.user.delete = handlers.echo;