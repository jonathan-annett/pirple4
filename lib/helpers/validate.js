/*
  File: helpers/validate.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: helper validation functions
  Used By:  
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var validate = module.exports = {};
const dns = require('dns');
const config = require('../config');

require("./validate_forms")(validate);

validate.default_image_url = config.default_image_url;

validate._domain_cache = {};
// calls cb with true or false depending on if domain is a valid domain
// (first call does dns lookup then caches result)
validate._domain = function(domain, force, cb) {
    if (typeof force === 'function') {
        cb = force;
        force = false;
    }
    var cache = validate._domain_cache;
    if (!force && typeof cache[domain] === 'boolean') return cb(cache[domain]);

    dns.lookup(domain, {
        hints: dns.ADDRCONFIG,
        all: true
    }, function(err, address) {
        cb((cache[domain] = !err && typeof address === 'object' && address.length > 0));
    });
};

// in - obj containing email field to validate
// does:calls cb with eiher false, or the validated email address
validate.email = function(obj, cb) {
    if (typeof obj === 'object') {

        if (typeof obj.email === 'string') {

            // use regex to see if email "looks ok"
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            if (re.test(obj.email)) {

                var parts = obj.email.split('@');
                if (parts.length == 2) {

                    // now see if the email is a valid domain
                    var domain = parts[1];

                    return /*<-- defer callback*/ validate._domain(domain, function(domain_is_valid) {
                        var result = domain_is_valid ? obj.email : false;
                        return typeof cb === 'function' ? cb(result) : result;
                    });

                }
            }
        }
    }

    return typeof cb === 'function' ? cb(false) : false;

};


