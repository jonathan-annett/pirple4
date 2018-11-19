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
var crypto=require('crypto');
const dns = require('dns');
var zlib=require('zlib');
var StringDecoder = require('string_decoder').StringDecoder;
    //this file has some app dependancies
var handlers=require('./handlers');
var router=require('./router');
var config=require('./config');

lib.randomString = function (len) {
    var result='';
    while (result.length<len) {
        result += crypto.createHash('sha256').update(Math.random().toString()).digest('base64').replace("=","");
    }
    return result.substr(0,len);
};

lib.hash = function (str,user_salt,cb) {
    var result = "";
    if (typeof str==='string' && typeof id==='string') {
        result = crypto.createHmac('sha256',config.hashingSalt+user_salt).update(str).digest('base64');
    }
    return typeof cb==='function' ? cb(result) : result;
};


// check that a string hashed using a user's secret matches the given hash
// optionally call a callback with the computed hash, otherwise return the hash
lib.checkHash= function(str,user_salt,hash,cb) {
    var result=
       typeof str==='string' && 
       typeof id==='string'&& 
       typeof hash==='string' && 
       (crypto.createHmac('sha256',config.hashingSalt+user_salt).update(str).digest('base64')===hash);
       
    return typeof cb==='function' ? cb(result) : result;
};


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

lib.validate = {};

// calls cb with true or false depending on if domain is a valid domain
// (first call does dns lookup then caches result)
lib.validate._domain_cache = {};
lib.validate._domain = function (domain,force,cb) {
    if (typeof force==='function') {cb=force;force=false}
    if (!force && typeof lib._domain_cache[domain]==='boolean') return cb(lib._domain_cache[domain]);
    
    dns.lookup(domain, {hints: dns.ADDRCONFIG,all :true}, function (err, address) {
        cb((lib._domain_cache[domain] = !err && typeof address ==='object' && address.length>0));
    });
};

lib.validate.email = function (obj,cb) {
    
    if (typeof obj==='object' && typeof obj.email==='string') {
        
        // use regex to see if email "looks ok"
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        
        if (re.test(obj.email)) {
        
            var parts = obj.string.split('@');
            if (parts.length==2) {
                
                // now see if the email is a valid domain
                var domain=parts[1];
                return lib.validate._domain(domain,function(valid){
                    cb(valid ? obj.email : false);
                });
            }
        }
    }
    
    cb (false);

};


if (process.mainModule===module) {
    
    lib.validate.email('jonathan.max.annett@gmail.com',console.log.bind(console));
    
    
}