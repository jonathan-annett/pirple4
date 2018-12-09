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


lib.localhost_certs = function(cb) {

    var password='apassword',
        ca_keyfile = './ca.key',
        ca_crtfile = './ca.crt',
        keyfile = './server.key',
        csrfile = './server.csr', 
        crtfile = './server.crt',
        pemfile = './server.pem',
        country = config.localhost.country, 
        state = config.localhost.state, 
        locality = config.localhost.locality,
        email = config.localhost.email,
        organization = 'webserver', 
        organizationalunit = 'server',
        commonname = 'localhost',
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
/*

lib.randomString(15)

optional arguments basedir & suffixes

  assuming suffient entropy has been allowed for, these collision avoidance arguments will rarely be needed
  however, as dataset sizes increase, if short ids have been used, these ensure the random number does not 
  map to an existing record

  lib.randomString(15,"./data/tokens")
  lib.randomString(9,"./data/db",[".json",".json.gz"])
  
  note that in the unusual sitution where a unique code can't be generated, this function will return false
   - this will most likely be because basedir does not point to a valid path
   - can also be if there are so many files, a unique code can't be found in 128 random picks.
  

*/
lib.randomString = function(len,basedir,suffixes) {
    
    // worker subfunction to generate a random string of len chars
    // does this using cryptographic hashing of a random number, converting to base64 and
    // stripping out any "=" and "/" characters, repeatedly until enough length (entropy) is generated 
    var verbotten = ["/","=","+"];
    var rnd = function() {
        var result = '';
        var zap=function(sym){result=result.replace(sym,"");};
        while (result.length < len) {
            result += crypto.createHash('sha256').update(Math.random().toString()).digest('base64');
            verbotten.forEach(zap);
        }
        return result.substr(0, len);
    };
    
    var result = rnd(), extensions = suffixes ? suffixes : [ ".json" ];
    // worker subfunction that returns true if filename exists with any of the specified extensions
    //   ( checks inside basedir )
    var exists = function (fn) {
        for(var i = 0; i < extensions.length; i++) {
            if (fs.existsSync(path.join(basedir,fn+extensions[i]))) {
                return true;
            } 
        }
        return false;
    };    
    
    if (typeof basedir === 'string') {
        
        if (!fs.existsSync(basedir)) {
            // basedir must be a string and valid path
            console.log(basedir,"path not found");
            return false;
        }
        
        var maxloops=128;
        while (exists(result)) {
            if (maxloops-- <= 0) {
                console.log("tried 128 times to generate unique code:",result);
                return false;
            }
            result = rnd();
        }
       
        
    }
    console.log("generated random string:",result);
    return result;
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

lib.stripe = {};
lib.stripe.charge={};

lib.stripe.charge.list = function (cb) {
    
    /*
    
    curl https://api.stripe.com/v1/charges \
    -u sk_test_4eC39HqLyjWDarjtT1zdp7dc:
    
    */
    
    var url_parts = url.parse(config.stripe.base_url);
    
    var req = https.request({
          hostname: url_parts.hostname,
          port: url_parts.port || 443,
          path: path.posix.join(url_parts.path,'charges'),
          method: 'GET',
          auth : config.stripe.api_key+":"        
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

lib.stripe.charge.create = function (amount,currency,source,cb) {
  
  /*

  curl https://api.stripe.com/v1/charges \
  -u sk_test_4eC39HqLyjWDarjtT1zdp7dc: \
  -d amount=2000 \
  -d currency=aud \
  -d source=tok_amex \
  -d description="Charge for jenny.rosen@example.com"
  
  */
  
  var stringPayload = querystring.stringify({
     amount    : amount,
     currency  : currency,
     source    : source
  });

  var url_parts = url.parse(config.stripe.base_url);
  
  var req = https.request({
        hostname: url_parts.hostname,
        port: url_parts.port || 443,
        path: path.posix.join(url_parts.path,'charges'),
        method: 'POST',
        auth : config.stripe.api_key+":",
        
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

  // Add the payload
  req.write(stringPayload);

  // End the request
  req.end();
    
};

lib.stripe.charge.retreive = function (charge_id,cb) {
    /*
    curl https://api.stripe.com/v1/charges/ch_1De8rJGD93mPalQAqhY9SX2X \
    -u sk_test_4eC39HqLyjWDarjtT1zdp7dc:
    */
    
    var url_parts = url.parse(config.stripe.base_url);
    
    var req = https.request({
          hostname: url_parts.hostname,
          port: url_parts.port || 443,
          path: path.posix.join(url_parts.path,'charges',charge_id),
          method: 'GET',
          auth : config.stripe.api_key+":"        
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

lib.stripe.token = {};

lib.stripe.token.verify = function (token_id,cb) {
    /*
    
    curl https://api.stripe.com/v1/tokens/tok_visa \
    -u sk_test_4eC39HqLyjWDarjtT1zdp7dc:
    
    */
    
    var url_parts = url.parse(config.stripe.base_url);
    
    var req = https.request({
          hostname: url_parts.hostname,
          port: url_parts.port || 443,
          path: path.posix.join(url_parts.path,'tokens',token_id),
          method: 'GET',
          auth : config.stripe.api_key+":"        
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

lib.stripe.token.create = function (card,cb) {
    /*
    curl https://api.stripe.com/v1/tokens \
    -u sk_test_4eC39HqLyjWDarjtT1zdp7dc: \
    -d card[number]=4242424242424242 \
    -d card[exp_month]=12 \
    -d card[exp_year]=2019 \
    -d card[cvc]=123
    */
    
    // check the supplied card details are "approximately correct"
    // ie the feilds are all there and within sensible ranges
    lib.validate.card(card,function(valid_card){
        
        if (!valid_card) {
           return cb ("invalid card details");   
        }
        
        var stringPayload = querystring.stringify({
            "card[number]"     : valid_card.number,
            "card[exp_month]"  : valid_card.exp_month,
            "card[exp_year]"   : valid_card.exp_year,
            "card[cvc]"        : valid_card.cvc
        });
      
        var url_parts = url.parse(config.stripe.base_url);
        
        var req = https.request({
              hostname: url_parts.hostname,
              port: url_parts.port || 443,
              path: path.posix.join(url_parts.path,'tokens'),
              method: 'POST',
              auth : config.stripe.api_key+":",
              
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
      
        // Add the payload
        req.write(stringPayload);
      
        // End the request
        req.end();      
        
    });
    
    
};
 

lib.stripe.payment = function(amount,currency,source,cb) {
    
    // worker callback to generate user's cb
    var after_charge = function(err,charge){
      if (err) {
          return cb(err);
      }
      
      if (!charge) {
          return cb("stripe.create_charge returned no data");
      }
      
      if (charge.status==="succeeded") {
          return cb(false,charge); 
      }
      
      return cb ("stripe payment failed",charge);
      
    };
    
    if (typeof source ==='object') {
       // this is an object describing an actual card 
       lib.stripe.token.create(source,function(err,valid_token){
           if (err) {
               return cb(err);
           }
           
           if (!valid_token && valid_token.type!=='card') {
               return cb("stripe could not verify token",valid_token);
           }
           
           return lib.stripe.charge.create(amount,currency,valid_token.id,after_charge);
       });
       
    }  else {
        if (typeof source ==='string') {
            // this is either a previously generated token, or a test token
            // run it through the stripe API to validate it's authenticity.
            lib.stripe.token.verify (source,function(err,valid_token){
                
               if (err) {
                   return cb(err);
               }
               if (!valid_token && valid_token.type!=='card') {
                   return cb("stripe could not verify token",valid_token);
               }
               
               return lib.stripe.charge.create(amount,currency,source,after_charge);
               
            });
        } else {
            return cb("unexpected source type:"+typeof source);
        }
        
    }
    
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

lib.letsencrypt_certs= function(cb) {

    if (typeof config.letsencrypt === 'object' &&
        typeof config.letsencrypt.key === 'object'&&
        config.letsencrypt.key.type === 'Buffer'&&
        typeof config.letsencrypt.key.data === 'object'&&
        config.letsencrypt.key.data.constructor === Array &&
        typeof config.letsencrypt.cert === 'object'&&
        config.letsencrypt.cert.type === 'Buffer'&&
        typeof config.letsencrypt.cert.data === 'object'&&
        config.letsencrypt.cert.data.constructor === Array  ) {
        console.log("using letsencrypt certs for domain:"+config.noip.hostname);
        
        return lib.check_noip(function(){
             return cb ({
                key : Buffer.from(config.letsencrypt.key.data),
                cert : Buffer.from(config.letsencrypt.cert.data)
            });  
        });
                 
        
    }
    
    cb (false);

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
   
   //lib.letsencrypt_certs(function(certs){console.log({certs:certs})});
   
   lib.stripe.charges(function(err,charges) {
       
       console.log({err:err,charges:charges});
       
   });
}
