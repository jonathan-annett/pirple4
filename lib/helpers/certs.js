/*
  File: helpers/certs.js
  Project: Asignment 3 https://github.com/jonathan-annett/pirple3
  Synopsis: certificate generation
  Used By:  
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

module.exports = function(lib, fs, config) {

    var spawn = require('child_process').spawn;

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
                cmdline: cmd + (args.length ? ' ' + args.join(' ') : '')
            });

        });

    };

    lib.make_certs = function(
    password,
    ca_keyfile, ca_crtfile,
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
            'openssl req' +
            ' -nodes -x509' +
            ' -newkey rsa:2048' +
            ' -keyout ' + ca_keyfile +
            ' -out ' + ca_crtfile +
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
                    'openssl req' +
                    ' -nodes -newkey rsa:2048' +
                    ' -keyout ' + keyfile +
                    ' -out ' + csrfile +
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

                        lib.spawn('openssl x509 -req' +
                            ' -in ' + csrfile +
                            ' -CA ' + ca_crtfile +
                            ' -CAkey ' + ca_keyfile +
                            ' -CAcreateserial' +
                            ' -out ' + crtfile,

                        function(exit) {

                            if (exit.code === 0) {


                                //# Create server PEM file
                                //cat server.key server.crt > server.pem

                                fs.readFile(keyfile, function(err, keybuf) {

                                    if (err) return;

                                    fs.readFile(crtfile, function(err, certbuf) {
                                        if (err) return;


                                        fs.readFile(ca_crtfile, function(err, ca_certbuf) {
                                            if (err) return;

                                            var opts = {
                                                key: keybuf,
                                                cert: certbuf,
                                                ca: ca_certbuf,
                                            };

                                            if (!keep) {

                                                var files = [ca_keyfile, ca_crtfile, keyfile, csrfile, crtfile];
                                                var unlinker = function(err) {

                                                    if (err) return cb(false);

                                                    if (files.length === 0) {
                                                        cb(opts);
                                                    } else {
                                                        fs.unlink(files.shift(), unlinker);
                                                    }

                                                };

                                                unlinker();

                                            } else {

                                                fs.writeFile(pemfile, Buffer.concat([keybuf, certbuf]), function(err) {
                                                    cb(opts);
                                                });

                                            }


                                        });




                                    });
                                });



                            } else {
                                console.log('error running:' + exit.cmdline);
                                exit.combined.forEach(console.log.bind(console));
                            }
                        });
                    } else {
                        console.log('error running:' + exit.cmdline);
                        exit.combined.forEach(console.log.bind(console));
                    }
                });
            } else {
                console.log('error running:' + exit.cmdline);
                exit.combined.forEach(console.log.bind(console));
            }
        });


    };


    lib.localhost_certs = function(cb) {

        var password = 'apassword',
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
            keep = false;

        lib.make_certs(

        password,
        ca_keyfile, ca_crtfile,
        keyfile, csrfile, crtfile, pemfile,
        country, state, locality,
        organization, organizationalunit,
        commonname,
        email,
        keep,
        cb);



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
    

};