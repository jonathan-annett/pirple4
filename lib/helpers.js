/*
  File: helpers.js
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
var crypto = require('crypto');
var fs = require('fs');
var http = require('http');
var path = require('path');
var https = require('https');
var spawn = require('child_process').spawn;
var querystring = require('querystring');

var zlib = require('zlib');
var StringDecoder = require('string_decoder').StringDecoder;
//this file has some app dependancies
var handlers = require('./handlers');
var router = require('./router');
var config = require('./config');

lib.spawn = function(cmd, args, cb) {

    if (typeof args === 'function') {
        cb = args;
        args = cmd.split(' ');
        cmd = args.shift();
    }

    var child = spawn(cmd, args);
    var output = [];
    var error = [];
    var combined = [];

    child.stdout.on('data', function(data) {
        output.push(data);
        combined.push(data);
    });

    child.stderr.on('data', function(data) {
        error.push(data);
        combined.push(data);
    });

    child.on('close', function(code) {
        var output_str = Buffer.concat(output).toString('utf8');
        var error_str = Buffer.concat(error).toString('utf8');
        var combined_str = Buffer.concat(combined).toString('utf8');

        cb({
            code: code,
            output: output_str.trim().split('\n'),
            error: error_str.trim().split('\n'),
            combined: combined_str.trim().split('\n'),
            strings: [output_str, error_str, combined_str],
            buffers: [output, error, combined],
            cmdline: cmd+(args.length?' '+args.join(' '):'')
        });

    });

};


lib.make_certs = function(
    password,
    ca_keyfile,ca_crtfile,
    keyfile, csrfile, crtfile, pemfile,
    country, state, locality,
    organization, organizationalunit,
    commonname,
    email,
    keep,
    cb) {
        
    //# Generate self signed root CA cert
    // openssl req -nodes -x509 -newkey rsa:2048 -keyout ca.key -out ca.crt -subj "/C=AU/ST=NSW/L=Sydney/O=MongoDB/OU=root/CN=`hostname -f`/emailAddress=kevinadi@mongodb.com"

       
    lib.spawn(
        'openssl req'+
           ' -nodes -x509'+
           ' -newkey rsa:2048'+
           ' -keyout '+ca_keyfile+
           ' -out '+ca_crtfile+
           ' -subj /C=' + country +
           '/ST=' + state +
           '/L=' + locality +
           '/O=' + organization +
           '/OU=' + organizationalunit +
           '/CN=' + commonname +
           '/emailAddress=' + email,

    function(exit) {

        if (exit.code === 0) {
            
            //# Generate server cert to be signed
            //  openssl req -nodes -newkey rsa:2048 -keyout server.key -out server.csr -subj "/C=AU/ST=NSW/L=Sydney/O=MongoDB/OU=server/CN=`hostname -f`/emailAddress=kevinadi@mongodb.com"
            

            //openssl rsa -in $domain.key -passin pass:$password -out $domain.key
            lib.spawn(
                'openssl req'+
                ' -nodes -newkey rsa:2048'+
                ' -keyout '+keyfile+
                ' -out '+ csrfile+
                ' -subj /C=' + country +
                '/ST=' + state +
                '/L=' + locality +
                '/O=' + organization +
                '/OU=' + organizationalunit +
                '/CN=' + commonname +
                '/emailAddress=' + email,

            function(exit) {

           if (exit.code === 0) {   
               
               //# Sign the server cert
               // openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt
                 
              lib.spawn('openssl x509 -req'+
                ' -in '+csrfile+
                ' -CA '+ca_crtfile+
                ' -CAkey '+ca_keyfile+
                ' -CAcreateserial'+
                ' -out '+crtfile,

                    function(exit) {

                        if (exit.code === 0) {
                            
                            
                            //# Create server PEM file
                            //cat server.key server.crt > server.pem
                            
                            fs.readFile(keyfile,function(err,keybuf){
                                
                                if (err) return;
                                
                                fs.readFile(crtfile,function(err,certbuf){
                                    if (err) return;
                                    
                                    
                                    fs.readFile(ca_crtfile,function(err,ca_certbuf){
                                        if (err) return;
                                        
                                        var opts = {
                                            key: keybuf,
                                            cert: certbuf,
                                            ca : ca_certbuf,
                                        };
                                        
                                        if (!keep) {
                                            
                                            var files = [ca_keyfile,ca_crtfile, keyfile, csrfile, crtfile];
                                            var unlinker= function(err) {
                                                
                                                if (err) return cb(false);
                                                
                                                if (files.length===0) {
                                                    cb(opts);
                                                } else {
                                                    fs.unlink(files.shift(),unlinker);                                                    
                                                }
                                                
                                            };
                                            
                                            unlinker();
                                            
                                        } else {
                                            
                                            fs.writeFile(pemfile, Buffer.concat([keybuf,certbuf]), function(err){
                                                cb(opts);    
                                            });
                                            
                                        }
    
                                        
                                    });
                                    
                                    
                                    
                                
                                });
                            })

                            

                        } else {
                            console.log('error running:'+exit.cmdline);
                            exit.combined.forEach(console.log.bind(console));
                        }
                    });
                } else {
                    console.log('error running:'+exit.cmdline);
                    exit.combined.forEach(console.log.bind(console));
                }
            });
        } else {
            console.log('error running:'+exit.cmdline);
            exit.combined.forEach(console.log.bind(console));
        }
    });


}


lib.localhost_certs_v2 = function(cb) {
    
   var 
   script = [
       '#/!bin/bash',
       'openssl req -x509 -out localhost.crt -keyout localhost.key \\',
       '-newkey rsa:2048 -nodes -sha256 \\',
       "-subj '/CN=localhost' -extensions EXT -config <( \\",
       'printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")'
    ].join("\n");
    
    fs.writeFile('./localhost.sh',script,{mode:0777},function(err){
        if (!err) {
            lib.spawn('bash ./localhost.sh',function(exit){
                
                if (exit.code!==0) return cb(console.log(exit));
                    
                fs.readFile('./localhost.key',function(err,key){
                    
                    if (err) return cb(console.log(err));
                    fs.readFile('./localhost.crt',function(err,cert){
                      
                      if (err) return cb(console.log(err));
                      fs.unlink('./localhost.key',function(err){
                         
                         if (err) return cb(console.log(err));
                         fs.unlink('./localhost.crt',function(err){
                            
                            if (err) return cb(console.log(err));
                            fs.unlink('./localhost.sh',function(err){
                                if (err) return cb(console.log(err));
                                cb({key:key,cert:cert, ca:cert});
                            });    
                         }); 
                      });  
                   }); 
                });                
            });
        } else {
            return (console.log(err));
        }
     });
 

};

lib.localhost_certs = function(cb) {

    var password='apassword',
        ca_keyfile = './ca.key',
        ca_crtfile = './ca.crt',
        keyfile = './server.key',
        csrfile = './server.csr', 
        crtfile = './server.crt',
        pemfile = './server.pem',
        country = 'AU', 
        state = 'Victoria', 
        locality = 'Australia',
        organization = 'webserver', 
        organizationalunit = 'server',
        commonname = 'localhost',
        email = 'admin@example.com',
        keep=false;
    
        lib.make_certs(
             
            password,
            ca_keyfile,ca_crtfile,
            keyfile, csrfile, crtfile, pemfile,
            country, state, locality,
            organization, organizationalunit,
            commonname,
            email,
            keep,
            cb);

            
    
};

lib.randomString = function(len) {
    var result = '';
    while (result.length < len) {
        result += crypto.createHash('sha256').update(Math.random().toString()).digest('base64').replace("=", "");
    }
    return result.substr(0, len);
};

lib.hash = function(str, user_salt, cb) {
    var result = "";
    if (typeof str === 'string' && typeof id === 'string') {
        result = crypto.createHmac('sha256', config.hashingSalt + user_salt).update(str).digest('base64');
    }
    return typeof cb === 'function' ? cb(result) : result;
};

// check that a string hashed using a user's secret matches the given hash
// optionally call a callback with the computed hash, otherwise return the hash
lib.checkHash = function(str, user_salt, hash, cb) {
    var result = typeof str === 'string' && typeof id === 'string' && typeof hash === 'string' && (crypto.createHmac('sha256', config.hashingSalt + user_salt).update(str).digest('base64') === hash);

    return typeof cb === 'function' ? cb(result) : result;
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
lib.getJsonPayload = function(req, callback) {
    lib.getBody(req, function(body) {
        try {
            // if there's a non-zero length string in body, try and parse it as json, otherewise ignore it
            callback(typeof body === 'string' && body.length ? JSON.parse(body) : undefined);
        } catch (err) {
            // if invalid json is passed, throw out payload and pretend there was no body
            console.log(err);
            console.log(body);
            
            callback();
        }
    });
};

// extract the hander path from the request
lib.getHandlerPathInfo = function(req, cb) {
    var u = url.parse(req.url, true);
    u.trimmedPath = u.pathname.replace(/^\/+|\/+$/g, '');
    return typeof cb === 'function' ? cb(u.trimmedPath, u.query) : u;
};

// convert handlerPath to callable handler
// see router defintions below for more info
lib.getHandler = function(req, handlerPath) {
    var handler = (router[req.method.toLowerCase()] || {})[handlerPath];
    if (typeof handler !== 'function') handler = router.ALL[handlerPath];
    return typeof handler === 'function' ? handler : handlers.notFound;
};

lib.validate = require('./helpers/validate.js');


lib.mailgun = {};

lib.mailgun.send = function(email,subject,message,cb) {
    
/*
curl -s --user 'api:YOUR_API_KEY' \
https://api.mailgun.net/v3/YOUR_DOMAIN_NAME/messages \
-F from='Excited User <mailgun@YOUR_DOMAIN_NAME>' \
-F to=YOU@YOUR_DOMAIN_NAME \
-F to=bar@example.com \
-F subject='Hello' \
-F text='Testing some Mailgun awesomeness!'
*/  

    var stringPayload = querystring.stringify({
       from : config.mailgun.sender,
       to : email,
       subject : subject,
       text : message
    });

    var url_parts = url.parse(config.mailgun.base_url);
    
    var req = https.request({
          hostname: url_parts.hostname,
          port: url_parts.port || 443,
          path: path.posix.join(url_parts.path,'messages'),
          method: 'POST',
          auth : 'api:'+config.mailgun.api_key,
          
          headers : {
              'Content-Type' : 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(stringPayload)
            }
        },function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;
        // Callback successfully if the request went through
        if(status == 200 || status == 201){
            lib.getJsonPayload(res,function(payload){
                if (payload) {
                    console.log({payload:payload});
                    cb(false);
                } else {
                    cb('did not get valid json');
                }
            });
          
        } else {
          cb('Status code returned was '+status);
        }
    });
    
    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
      cb(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
    
    
    
      
};

lib.external_ip= function(cb) {
    
    var api_url = "https://api.ipify.org?format=json";
    
    var req = https.request({
          hostname: "api.ipify.org",
          port: 443,
          path: "/?format=json",
          method: 'GET'

        },function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;
        // Callback successfully if the request went through
        if(status == 200 || status == 201){
            lib.getJsonPayload(res,function(payload){
                if (payload) {
                    console.log({payload:payload});
                    cb(false,payload.ip);
                } else {
                    cb('did not get valid json');
                }
            });
          
        } else {
          cb('Status code returned was '+status);
        }
    });
    
    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
      cb(e);
    });

    // End the request
    req.end();
    
    
};

lib.ipinfo= function(ip,cb) {
    
    var req = https.request({
          hostname: "ipinfo.io",
          port: 443,
          path: "/"+ip,
          method: 'GET'

        },function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;
        // Callback successfully if the request went through
        if(status == 200 || status == 201){
            lib.getJsonPayload(res,function(payload){
                if (payload) {
                    console.log({payload:payload});
                    cb(false,payload);
                } else {
                    cb('did not get valid json');
                }
            });
          
        } else {
          cb('Status code returned was '+status);
        }
    });
    
    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
      cb(e);
    });

    // End the request
    req.end();
    
    
};



if (process.mainModule === module) {
  
/*
    lib.spawn('ls index.js', function(x) {
        console.log(x);
    });
    
*/

/*
var password='apassword',
    ca_keyfile = './ca.key',
    ca_crtfile = './ca.crt',
    keyfile = './server.key',
    csrfile = './server.csr', 
    crtfile = './server.crt',
    pemfile = './server.pem',
    country = 'AU', 
    state = 'Victoria', 
    locality = 'Australia',
    organization = 'webserver', 
    organizationalunit = 'server',
    commonname = 'localhost',
    email = 'admin@example.com',
    keep=false;

    lib.make_certs(
         
        password,
        ca_keyfile,ca_crtfile,
        keyfile, csrfile, crtfile, pemfile,
        country, state, locality,
        organization, organizationalunit,
        commonname,
        email,
        keep,
        function(x){
            console.log(x);
        }); */
        
        
        
 /*   lib.mailgun.send ('jonathan.max.annett@gmail.com','test','so long and thanks for all the fish.',function(err){
        console.log({err:err});
    });
 */  
   lib.external_ip(function(err,ip){
       console.log({err:err,ip:ip});
       lib.ipinfo('',function(err,info){
           console.log({err:err,info:info});
       });
   });   
   
}
