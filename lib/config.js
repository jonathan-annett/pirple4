/*
  File: config.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: configuration settings
  Used By: index,servers
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var fs = require('fs');
var path = require('path');

var readPem = function(cert) {
    return fs.readFileSync(path.join(__dirname,'../https/'+cert));
};

var readAPIConfig = function(api) {
    try {
        console.log("Reading api configuration for:"+api+"...");
        return JSON.parse(fs.readFileSync(path.join(__dirname,'../../.apis/'+api+'.json')));
    } catch(e) {
        console.log("Error reading api configuration for:"+api);
        return {};
    }
};


var certs = function () {
  return {
              cert  : readPem('cert.pem'),
              key   : readPem('key.pem')
           };
};

 
var environments = {

    staging : function () {
        return {
            envMode : 'staging',
            domain  : 'localhost',
            http    : { port : 3000 },
            https   : { 
                port : 3001
            },
            hashingSalt : "hqtGyBcXBDJU6Y4zs+qtC9XafC/LM9LK",
            mailgun     : readAPIConfig ('mailgun'),
            stripe      : readAPIConfig ('stripe'),
            letsencrypt : readAPIConfig ('letsencrypt'),
            localhost   : readAPIConfig ('localhost'),
            noip        : readAPIConfig ('noip'),
            default_image_url : "https://i.imgur.com/yMu7sjT.jpg",
            cert_mode : "localhost_certs",
            globals : { appName : "pizza2go", baseUrl : "http://localhost:3000/" }
        };
    },

    production : function() {
        return {
            envMode : 'production',
            domain : 'localhost',
            http : { 
                port : 5000 
            },
            https  : { 
                port : 5001
            },
            hashingSalt : "k5PxNffnu/Usc63bVvt7gYfHAdH4rEkK",
            mailgun : readAPIConfig ('mailgun'),
            stripe      : readAPIConfig ('stripe'),
            letsencrypt : readAPIConfig ('letsencrypt'),
            localhost   : readAPIConfig ('localhost'),
            noip : readAPIConfig ('noip'),
            default_image_url : "https://i.imgur.com/yMu7sjT.jpg",
            cert_mode : "letsencrypt_certs",
            globals : { appName : "pizza2go", baseUrl : "http://localhost:5000/"  }

        };
    }
};


var envMode = environments[process.env.NODE_ENV];

module.exports = typeof envMode === 'function' ? envMode() : environments.staging();

if (process.mainModule===module) console.log({config:module.exports});
 