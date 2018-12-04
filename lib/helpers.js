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
var dns = require('dns');

var zlib = require('zlib');
var StringDecoder = require('string_decoder').StringDecoder;
//this file has some app dependancies
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


};


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

// optionally call a callback with the computed hash, otherwise return the hash
lib.hash = function(str, user_salt, cb) {
    var result = "";
    if (typeof str === 'string' && typeof user_salt === 'string') {
        result = crypto.createHmac('sha256', config.hashingSalt + user_salt).update(str).digest('base64');
    }
    return typeof cb === 'function' ? cb(result) : result;
};

// check that a string hashed using a user's secret matches the given hash
// optionally call a callback with true/false, otherwise return true/false
lib.checkHash = function(str, user_salt, hash, cb) {
    var result = typeof str === 'string' && typeof user_salt === 'string' && typeof hash === 'string' && (crypto.createHmac('sha256', config.hashingSalt + user_salt).update(str).digest('base64') === hash);

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
       from    : config.mailgun.sender,
       to      : email,
       subject : subject,
       text    : message
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

lib.lookup_ips = function(domain, cb) {
    dns.lookup(domain, {
        family : 4,
        hints: dns.ADDRCONFIG,
        all: true
    }, function(err, address) {
        cb(address);
    });
};


lib.update_noip = function (newip,cb) {
     //http://username:password@dynupdate.no-ip.com/nic/update?hostname=mytest.testdomain.com&myip=1.2.3.4
     //http://dynupdate.no-ip.com/nic/update
     
     var url_parts = url.parse(config.noip.base_url);
     var default_port = (url_parts.protocol==="https" ? 443 : 80);
     var HTTP = (url_parts.protocol==="https" ? https : http);
     var req = HTTP.request({
           hostname: url_parts.hostname,
           port: url_parts.port || default_port,
           path: url_parts.path+"?hostname="+config.noip.hostname+"&myip="+newip,
           method: 'GET',
           auth : config.noip.username+':'+config.noip.password,
           
           headers : {
               'User-Agent' : config.noip.user_agent
             }
         },function(res){
         // Grab the status of the sent request
         var status =  res.statusCode;
         // Callback successfully if the request went through
         if(status == 200 || status == 201){
             
             lib.getBody(res,function(payload){
                 if (payload) {
                     console.log(payload);
                     cb(payload==='good '+newip);
                 } else {
                     cb('did not get valid response');
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
    // req.write(stringPayload);
 
     // End the request
     req.end();
 
}

lib.check_noip = function (cb) {
    
    
    // get the ip address of the noip servers
    lib.lookup_ips(url.parse(config.noip.base_url).hostname,function(ips){
        console.log({noips_ips:ips});
        if (typeof ips==='object' && ips.constructor === Array) {
            
            var noip_servers=ips.map(function(x){return x.address;});
            
            console.log({noip_servers:noip_servers});    
        
            
            //backup the current dns servers
            var backup_servers = dns.getServers();
                
            // tell node to use noips server to get the current ip addres
            dns.setServers(noip_servers);
                
            console.log({backup_servers:backup_servers});    
    
            // now lookup our dynmamic host name
            lib.lookup_ips(config.noip.hostname,function(ips){
                
                // restored the backed up servers
               dns.setServers(backup_servers);
               
               console.log({dyn_hostname_ip:ips});    
    

                if (typeof ips==='object' && ips.constructor === Array && ips.length==1) {
                    
                    var dns_reports_ip=ips[0].address;
                    console.log("local dns lookup reports ip for "+config.noip.hostname+" as "+dns_reports_ip);
                                 
                    lib.external_ip (function(err,current_ip){
                        if (!err && typeof current_ip === 'string') {
                            if (current_ip===dns_reports_ip) {
                                 console.log("lib.external_ip reports matching ip:"+current_ip);
                                 cb();
                            } else {
                                console.log("lib.external_ip reports changed ip:"+current_ip+", updating now");
                                 
                                lib.update_noip(current_ip,cb);                        
                            }    
                        } else {
                            console.log("lib.external_ip failed, trying lib.ipinfo");
                            lib.ipinfo('',function(err,info){
                                if (!err && typeof info === 'object' && typeof info.ip === 'string') {
                                    if (info.ip===dns_reports_ip) {
                                         console.log("lib.ipfino reports matching ip:"+info.ip);
                                         cb();
                                    } else {
                                        console.log("lib.ipinfo reports changed ip:"+current_ip+", updating now");
                                        lib.update_noip(info.ip,cb);        
                                    }    
                                }   
                            });
                        }
                        
                    });  
                }
                
            });

                
            
        
        }
    
        
    
    });
    
    
    
    
    
};

lib.letsencrypt = {};

lib.letsencrypt.certs= function(cb) {

    if (typeof config.letsencrypt === 'object' &&
        typeof config.letsencrypt.key === 'object'&&
        config.letsencrypt.key.type === 'Buffer'&&
        typeof config.letsencrypt.key.data === 'object'&&
        config.letsencrypt.key.data.constructor === Array &&
        typeof config.letsencrypt.cert === 'object'&&
        config.letsencrypt.cert.type === 'Buffer'&&
        typeof config.letsencrypt.cert.data === 'object'&&
        config.letsencrypt.cert.data.constructor === Array  ) {

        return cb (undefined,{
            key : Buffer.from(config.letsencrypt.key.data),
            cert : Buffer.from(config.letsencrypt.cert.data)
        });            
        
    }
    
    cb ("could not locate certificates for letsencrypt")

};

if (process.mainModule === module) {
  
/*
    lib.spawn('ls index.js', function(x) {
        console.log(x);
    });
    
*;

/*

 /*
   lib.external_ip(function(err,ip){
       console.log({err:err,ip:ip});
       lib.ipinfo('',function(err,info){
           console.log({err:err,info:info});
       });
   });   
   */
   
   //lib.check_noip (console.log.bind(console));
   
   lib.letsencrypt.certs(function(err,certs){console.log({certs:certs,err:err})});
}
