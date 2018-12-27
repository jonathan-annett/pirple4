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

    
module.exports=function(handlers){
    var codes = handlers.codes;
    var stats = {}, buffers = {};
    handlers.static={};
    
    handlers.static.filter_js = function (src,cb) {
        var tag_in = '[[["',tag_out='"]]]';
        var pos_in  = src.indexOf(tag_in);
        var pos_out = src.indexOf(tag_out);

        if ( (pos_in>=0) && (pos_out>pos_in)) {
            
           var chunks =  src.split(tag_in);
           var res = chunks.shift();
           
           var loop=function(i){
               
               if (i>=chunks.length) {
                   return cb(res);
               } else {
                   var chunk = chunks[i];
                   pos_out = chunk.indexOf(tag_out);
                   if (pos_out>=0){
                       var fn  = chunk.substr(0,pos_out);
                       
                       fs.readFile(path.join(rootdir,fn),"utf-8",function(err,file_src){
                           if (err) {
                             res += '/* failed:'+fn+'*/'+chunk.substr(pos_out+tag_out.length);
                           } else {
                             res += '/*'+fn+'*/'+file_src+chunk.substr(pos_out+tag_out.length);
                           }
                           loop(++i);
                       });
                       
                   } else {
                       res += "/* unclosed tag */";
                       loop(++i);
                   }
               }
               
           };
           loop(0);
           
        } else {
            cb (src);
        }
    };
    
    handlers.static.get = function(params, cb) {
        
        var filepath = path.join(rootdir,params.path);
        fs.stat(filepath,function(err,stat){
            
            if (err || !stat) return cb (codes.not_found_404,"path "+params.path+" not found","text");
            var hdrs = {etag : stat.mtime.getTime().toString()};
            var ext = helpers.filenameToExtension(params.path);
            
            if (params.headers["if-none-match"]===hdrs.etag) {
                return cb(
                    304,
                    undefined,
                    ext,
                    hdrs);
            }
            
                      
            
            var reread=function(){
                stats[path]=stat;
                fs.readFile(filepath,function(err,buffer){
                    if (err) return cb (codes.internal_server_error_500,"path "+params.path+" error","text");
                    buffers[filepath]=buffer;
                    if (ext==='js') {
                        return handlers.static.filter_js(
                           buffer.toString("utf-8"),
                           function(src){
                               buffers[path]=src;
                               return cb(
                                   codes.success_200,
                                   src,
                                   ext,
                                   hdrs
                               );
                           }
                        );
                    }
                    return cb(
                        codes.success_200,
                        buffer,
                        ext,
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
                        ext,
                        hdrs);
                }
            } else {
                return reread();
            }
        });

         
        
};
    
   
    
};

