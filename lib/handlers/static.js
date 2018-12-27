/*
  File: static.js
  Project: Asignment 3 https://github.com/jonathan-annett/pirple2
  Synopsis: static file handler
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
and associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


var _data    = require('../data');
var helpers  = require('../helpers');
var config = require('../config');
var validate = helpers.validate;
var path = require('path');
var fs = require('fs');

var rootdir = path.join(__dirname,'../..');


helpers.chain=typeof setImmediate==='function' ? setImmediate : function(fn,x){setTimeout(fn,0,x);};

    
// constants to ensure conistent filename spelling throughout
const USER="user";
const HTML= "html";


module.exports=function(handlers){
    var codes = handlers.codes;
    var stats = {}, buffers = {};
    handlers.static={};
    
    handlers.static.get = function(params, cb) {
        
        var filepath = path.join(rootdir,params.path);
        fs.stat(filepath,function(err,stat){
            
            if (err || !stat) return cb (codes.not_found_404,"path "+params.path+" not found","text");
            var hdrs = {etag : stat.mtime.getTime().toString()};

            if (params.headers["if-none-match"]===hdrs.etag) {
                return cb(
                    304,
                    undefined,
                    helpers.filenameToExtension(params.path),
                    hdrs);
            }
            
            var reread=function(){
                stats[path]=stat;
                fs.readFile(filepath,function(err,buffer){
                    if (err) return cb (codes.internal_server_error_500,"path "+params.path+" error","text");
                    buffers[filepath]=buffer;
                    return cb(
                        codes.success_200,
                        buffer,
                        helpers.filenameToExtension(params.path),
                        hdrs);

                });
            };
            
            if (stats[path] && buffers[path]) {
                if (stat.mtime !== stats[path].mtime) {
                    return reread();
                } else { 
                    return cb(
                        codes.success_200,
                        buffers[filepath],
                        helpers.filenameToExtension(params.path),
                        hdrs);
                }
            } else {
                return reread();
            }
        });

         
        
};
    
   

};

