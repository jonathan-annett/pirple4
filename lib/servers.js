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

// Project Dependancies

var config = require('./config');
var helpers = require('./helpers');

var unified_server = function(req, res) {

    helpers.getJsonPayload(req, function(payloadIn) {

        helpers.getHandlerPathInfo(req, function(handlerPath, queryParams) {

            var handlerParams = {
                when        : new Date(),
                method      : req.method.toLowerCase(),
                headers     : req.headers,
                via         : req.connection.constructor.name === 'Socket' ? 'http' : 'https',
                path        : handlerPath,
                queryParams : queryParams,
                payloadIn   : payloadIn
            };

            // call the appropriate handler returning http result and payload
            helpers.getHandler(req, handlerPath) /*--exec-->*/ (handlerParams, function(httpCode, payloadOut) {

                handlerParams.payloadOut = payloadOut || {};

                // send httpcode, content-type and JSON string payload as http response 
                res.writeHead(httpCode, {
                    "content-type": "application/json"
                });
                res.end(JSON.stringify(handlerParams.payloadOut));

                // log the event 
                console.log(handlerParams);

            });

        });
    });

};




lib.start = function () {
    
    
    // load some localhost certs
    helpers.localhost_certs(function(certs){
        
        lib.http = http.createServer(unified_server);
        lib.https = https.createServer(certs, unified_server);
        
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