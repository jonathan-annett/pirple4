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
var querystring = require('querystring');
var dns = require('dns');

var zlib = require('zlib');
var StringDecoder = require('string_decoder').StringDecoder;
//this file has some app dependancies
var config = require('./config');

// load the valiate sub library
lib.validate = require('./helpers/validate.js');

// merge the stripe sub library
require('./helpers/stripe.js')(lib, url, https, path, querystring, config);

require('./helpers/certs.js')(lib, fs, config);

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
lib.randomString = function(len, basedir, suffixes) {

    // worker subfunction to generate a random string of len chars
    // does this using cryptographic hashing of a random number, converting to base64 and
    // stripping out any "=" and "/" characters, repeatedly until enough length (entropy) is generated 
    var verbotten = ["/", "=", "+"];
    var rnd = function() {
        var result = '';
        var zap = function(sym) {
            var find = result.split(sym);
            if (find.length > 1) {
                result = find.join("");
            }
        };

        while (result.length < len) {
            result += crypto.createHash('sha256').update(Math.random().toString()).digest('base64');
            verbotten.forEach(zap);
        }
        return result.substr(0, len);
    };

    var result = rnd(),
        extensions = suffixes ? suffixes : [".json"];
    // worker subfunction that returns true if filename exists with any of the specified extensions
    //   ( checks inside basedir )
    var exists = function(fn) {
        for (var i = 0; i < extensions.length; i++) {
            if (fs.existsSync(path.join(basedir, fn + extensions[i]))) {
                return true;
            }
        }
        return false;
    };

    if (typeof basedir === 'string') {

        if (!fs.existsSync(basedir)) {
            // basedir must be a string and valid path
            console.log(basedir, "path not found");
            return false;
        }

        var maxloops = 128;
        while (exists(result)) {
            if (maxloops-- <= 0) {
                console.log("tried 128 times to generate unique code:", result);
                return false;
            }
            result = rnd();
        }


    }
    console.log("generated random string:", result);
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




lib.mailgun = {};

lib.mailgun.send = function(email, subject, message, cb) {

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
        from: config.mailgun.sender,
        to: email,
        subject: subject,
        text: message
    });

    var url_parts = url.parse(config.mailgun.base_url);

    var req = https.request({
        hostname: url_parts.hostname,
        port: url_parts.port || 443,
        path: path.posix.join(url_parts.path, 'messages'),
        method: 'POST',
        auth: 'api:' + config.mailgun.api_key,

        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
        }
    }, function(res) {
        // Grab the status of the sent request
        var status = res.statusCode;
        // Callback successfully if the request went through
        if (status == 200 || status == 201) {
            lib.getJsonPayload(res, function(payload) {
                if (payload) {
                    console.log({
                        payload: payload
                    });
                    cb(false);
                } else {
                    cb('did not get valid json');
                }
            });

        } else {
            cb('Status code returned was ' + status);
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function(e) {
        cb(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();




};

lib.github={};
lib.github.check=function(last_etag,cb){
    var url_parts = url.parse(config.github.repo_url);
    var default_port = (url_parts.protocol === "https" ? 443 : 80);
    var HTTP = (url_parts.protocol === "https" ? https : http);
    var req = HTTP.request({
        hostname: url_parts.hostname,
        port: url_parts.port || default_port,
        path: url_parts.path,
        method: 'GET',
        auth: config.github.username + ':' + config.github.password,
    }, function(res) {
        // Grab the status of the sent request
        var status = res.statusCode;
        // Callback successfully if the request went through
        if (status == 200 || status == 201) {
            console.log({github:res.headers});
            if (res.headers.etag===last_etag) return cb(false);
            
            return cb(res.headers.etag);

        } else {
            console.log({github:status});
            return cb();

        }

    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function(e) {
        cb(e);
    });

    // Add the payload
    // req.write(stringPayload);

    // End the request
    req.end();
};


lib.external_ip = function(cb) {

    var api_url = "https://api.ipify.org?format=json";

    var req = https.request({
        hostname: "api.ipify.org",
        port: 443,
        path: "/?format=json",
        method: 'GET'

    }, function(res) {
        // Grab the status of the sent request
        var status = res.statusCode;
        // Callback successfully if the request went through
        if (status == 200 || status == 201) {
            lib.getJsonPayload(res, function(payload) {
                if (payload) {
                    cb(false, payload.ip);
                } else {
                    cb('did not get valid json');
                }
            });

        } else {
            cb('Status code returned was ' + status);
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function(e) {
        cb(e);
    });

    // End the request
    req.end();


};

lib.ipinfo = function(ip, cb) {

    var req = https.request({
        hostname: "ipinfo.io",
        port: 443,
        path: "/" + ip,
        method: 'GET'

    }, function(res) {
        // Grab the status of the sent request
        var status = res.statusCode;
        // Callback successfully if the request went through
        if (status == 200 || status == 201) {
            lib.getJsonPayload(res, function(payload) {
                if (payload) {
                    cb(false, payload);
                } else {
                    cb('did not get valid json');
                }
            });

        } else {
            cb('Status code returned was ' + status);
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function(e) {
        cb(e);
    });

    // End the request
    req.end();


};

lib.lookup_ips = function(domain, cb) {
    dns.lookup(domain, {
        family: 4,
        hints: dns.ADDRCONFIG,
        all: true
    }, function(err, address) {
        cb(address);
    });
};


lib.update_noip = function(newip, cb) {
    //http://username:password@dynupdate.no-ip.com/nic/update?hostname=mytest.testdomain.com&myip=1.2.3.4
    //http://dynupdate.no-ip.com/nic/update

    var url_parts = url.parse(config.noip.base_url);
    var default_port = (url_parts.protocol === "https" ? 443 : 80);
    var HTTP = (url_parts.protocol === "https" ? https : http);
    var req = HTTP.request({
        hostname: url_parts.hostname,
        port: url_parts.port || default_port,
        path: url_parts.path + "?hostname=" + config.noip.hostname + "&myip=" + newip,
        method: 'GET',
        auth: config.noip.username + ':' + config.noip.password,

        headers: {
            'User-Agent': config.noip.user_agent
        }
    }, function(res) {
        // Grab the status of the sent request
        var status = res.statusCode;
        // Callback successfully if the request went through
        if (status == 200 || status == 201) {

            lib.getBody(res, function(payload) {
                if (payload) {
                    console.log(payload);
                    cb(payload === 'good ' + newip);
                } else {
                    cb('did not get valid response');
                }
            });

        } else {

            cb('Status code returned was ' + status);

        }

    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function(e) {
        cb(e);
    });

    // Add the payload
    // req.write(stringPayload);

    // End the request
    req.end();

};

lib.check_noip = function(cb) {


    // get the ip address of the noip servers
    lib.lookup_ips(url.parse(config.noip.base_url).hostname, function(ips) {
        console.log({
            noips_ips: ips
        });
        if (typeof ips === 'object' && ips.constructor === Array) {

            var noip_servers = ips.map(function(x) {
                return x.address;
            });

            console.log({
                noip_servers: noip_servers
            });


            //backup the current dns servers
            var backup_servers = dns.getServers();

            // tell node to use noips server to get the current ip addres
            dns.setServers(noip_servers);

            console.log({
                backup_servers: backup_servers
            });

            // now lookup our dynmamic host name
            lib.lookup_ips(config.noip.hostname, function(ips) {

                // restored the backed up servers
                dns.setServers(backup_servers);

                console.log({
                    dyn_hostname_ip: ips
                });


                if (typeof ips === 'object' && ips.constructor === Array && ips.length == 1) {

                    var dns_reports_ip = ips[0].address;
                    console.log("local dns lookup reports ip for " + config.noip.hostname + " as " + dns_reports_ip);

                    lib.external_ip(function(err, current_ip) {
                        if (!err && typeof current_ip === 'string') {
                            if (current_ip === dns_reports_ip) {
                                console.log("lib.external_ip reports matching ip:" + current_ip);
                                cb();
                            } else {
                                console.log("lib.external_ip reports changed ip:" + current_ip + ", updating now");

                                lib.update_noip(current_ip, cb);
                            }
                        } else {
                            console.log("lib.external_ip failed, trying lib.ipinfo");
                            lib.ipinfo('', function(err, info) {
                                if (!err && typeof info === 'object' && typeof info.ip === 'string') {
                                    if (info.ip === dns_reports_ip) {
                                        console.log("lib.ipfino reports matching ip:" + info.ip);
                                        cb();
                                    } else {
                                        console.log("lib.ipinfo reports changed ip:" + current_ip + ", updating now");
                                        lib.update_noip(info.ip, cb);
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


lib.defaultPayload = function(payload, contentExt) {
    switch (contentExt) {
        case "json":
            return "{}";
    }

    return "";
};

lib.extensionToContentType = function(ext) {
    if (typeof ext === "string") {
        switch (ext) {
            case "js":
                return "application/javascript";
            case "json":
                return "application/json";
            case "webmanifest":
                return "application/manifest+json";
            case "html":
                return "text/html";
            case "text":
                return "text/plain";
            case "txt":
                return "text/plain";
            case "xml":
                return "application/xml";
            case "css":
                return "text/css";
            case "ico":
                return "image/x-icon";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "svg":
                return "image/svg+cml"
            case "jpg":
                return "image/jpeg";
            case "jpeg":
                return "image/jpeg";
        }
    }
    return "text/plain";
};

lib.filenameToExtension = function(fn) {
    if (typeof fn === "string") {
        fn = fn.toLowerCase();
        switch (fn.substr(-5)) {
            case ".html":
            case ".json":
            case ".jpeg":
            case ".text":
                return fn.substr(-4);
            default:
                switch (fn.substr(-4)) {
                    case ".css":
                    case ".ico":
                    case ".png":
                    case ".gif":
                    case ".jpg":
                    case ".txt":
                    case ".svg":
                    case ".xml":
                        return fn.substr(-3);
                    default:
                        switch (fn.substr(-3)) {
                            case ".js":
                                return fn.substr(-2);
                            default:
                                switch (fn.substr(-12)) {
                                    case ".webmanifest":
                                        return fn.substr(-11);
                                    default:
                                }
                        }
                }
        }
    }
    return false;
};

lib.filename2contentType = function(fn) {
    return lib.extensionToContentType(lib.filenameToExtension(fn));
};