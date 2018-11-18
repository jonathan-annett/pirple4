/*
  File: config.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: app specific helper functions
  Used By: servers
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


var lib = module.exports = {};
    // this file has some system dependancies
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
    //this file has some app dependancies
var handlers=require('./handlers');
var router=require('./router');


// asyncronously read any body from http(s) request, treating it as an utf-8 string
lib.getBody = function(req, callback) {
    var body = '',
        decoder = new StringDecoder('utf-8');
    req.on('data', function(data) {
        body += decoder.write(data);
    });
    req.on('end', function() {
        callback(body + decoder.end());
    });
};

// asyncronously read an optional JSON payload from the request body, pass it to callback as an object
lib.getJsonPayload = function (req,callback) {
    lib.getBody(req,function(body){
        try {
            // if there's a non-zero length string in body, try and parse it as json, otherewise ignore it
            callback(typeof body === 'string' && body.length ? JSON.parse(body) : undefined);   
        } catch (err) {
            // if invalid json is passed, throw out payload and pretend there was no body
            callback();
        }
    });
};

// extract the hander path from the request
lib.getHandlerPathInfo = function(req,cb) {
    var u = url.parse(req.url, true);
    u.trimmedPath = u.pathname.replace(/^\/+|\/+$/g, '');
    return typeof cb==='function' ? cb (u.trimmedPath,u.query) : u;
};

// convert handlerPath to callable handler
// see router defintions below for more info
lib.getHandler = function(req,handlerPath) {
    var handler = (router[req.method.toLowerCase()]||{})[handlerPath];
    if (typeof handler!=='function') handler = router.ALL[handlerPath];
    return typeof handler === 'function' ? handler : handlers.notFound;
};