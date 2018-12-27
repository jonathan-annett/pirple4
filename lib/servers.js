/*
  File: servers.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: https and http server encapsulation
  Used By: index
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var lib = module.exports = {};

// Dependancies

var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');

// Project Dependancies

var config = require('./config');
var helpers = require('./helpers');
var handlers = require('./handlers');
var router = require('./router');


// extract the hander path from the request
helpers.getHandlerPathInfo = function(req, cb) {
    var u = url.parse(req.url, true);
    u.trimmedPath = u.pathname.replace(/^\/+|\/+$/g, '');
    return typeof cb === 'function' ? cb(u.trimmedPath, u.query) : u;
};

// convert handlerPath to callable handler
// see router defintions below for more info
helpers.getHandler = function(req, handlerPath) {
    
    var method=req.method.toLowerCase(),
        getter = router[method+"_"];

    var  handler = (typeof getter === 'function') ? getter(handlerPath) : router[method]?router[method][handlerPath]:undefined;

    if (typeof handler === 'function') return handler;
    
    handler = router.ALL[handlerPath];
    
    console.log({fallback:{handler,handlerPath}});

    return typeof handler === 'function' ? handler : handlers.notFound;
};





helpers.payloadContent=function(ext/*=js,json,html,png etc*/,payload){
    switch (ext) {
        case "json" : return JSON.stringify(payload);
    }
    return payload;
};

 

var unified_server = function(req, res) {

    helpers.getJsonPayload(req, function(payloadIn) {

        helpers.getHandlerPathInfo(req, function(handlerPath, queryParams) {

            var handlerParams = {
                when        : Date.now(),
                method      : req.method.toLowerCase(),
                headers     : req.headers,
                via         : req.connection.constructor.name === 'Socket' ? 'http' : 'https',
                path        : handlerPath,
                queryParams : queryParams,
                payloadIn   : payloadIn
            };

            // call the appropriate handler returning http result and payload
            helpers.getHandler(req, handlerPath) /*--exec-->*/ (handlerParams, function(httpCode, payloadOut, contentExt, headersOut) {
                
                
                
                // if content extension is not specified, assume json
                handlerParams.contentExt  = contentExt || "json";
                
                // convert extension to mime content type
                handlerParams.contentType = helpers.extensionToContentType(handlerParams.contentExt);
                
                // fudge default httpCode to 200
                httpCode = typeof httpCode === 'number' ? httpCode : 200;
                
                headersOut = headersOut||{};
                headersOut["content-type"] = handlerParams.contentType;
                
                 // send httpcode, content-type and JSON string payload as http response 
                res.writeHead(httpCode, headersOut);
                
                if (httpCode===304) {
                    // not modified does not have any payload/body
                    res.end();
                } else {
                    // if there is no payload, assume the default for it's content extension 
                    handlerParams.payloadOut  = payloadOut || helpers.defaultPayload(handlerParams.contentExt);
                    
                    // convert the payload to it's appropriate type and send it
                    res.end(helpers.payloadContent(handlerParams.contentExt,handlerParams.payloadOut));
                }
                // log the event 
                console.log(handlerParams);

            });

        });
    });

};




lib.start = function () {
    
    
    // load some certs
    helpers[config.cert_mode](function(certs){
        
        lib.http = http.createServer(unified_server);
        if (certs) {
            lib.https = https.createServer(certs, unified_server);
        }
        // start each server.
    
        Object.keys(lib).forEach(function(protocol) {
            var server_type = lib[protocol];
            var cfg=config[protocol];
            if (typeof cfg==='object' && typeof server_type.listen==='function') {
                server_type.listen(cfg.port, function() {
                    console.log(config.envMode + " server started using " + protocol + " protocol on port " + cfg.port);
                });
            }
        });
    
    });
    

};