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

var rootdir = path.join(__dirname,'..','..');


helpers.chain=typeof setImmediate==='function' ? setImmediate : function(fn,x){setTimeout(fn,0,x);};

    
module.exports=function(handlers){
    var codes = handlers.codes;
    var stats = {}, buffers = {};
    handlers.static={};
    
    var fix_js = function (src) {
        var prefix ="module.exports";
        var trimmed = src.trim();
        if (src.substr(0,prefix.length)===prefix) {
            trimmed = trimmed.substr(prefix.length).trim();
            if (trimmed.charAt(0)==='=') {
                return trimmed.substr(1).trim();
            }
        }
        return src;
    };
    handlers.static.filter_js = function (src,etag,cb) {
        var tag_in = '[[["',tag_out='"]]]';
        var pos_in  = src.indexOf(tag_in);
        var pos_out = src.indexOf(tag_out);

        if ( (pos_in>=0) && (pos_out>pos_in)) {
            
           var chunks =  src.split(tag_in);
           var res = chunks.shift();
           
           var loop=function(i){
               
               if (i>=chunks.length) {
                   return cb(res,etag);
               } else {
                   var chunk = chunks[i];
                   pos_out = chunk.indexOf(tag_out);
                   if (pos_out>=0){
                       var fn  = chunk.substr(0,pos_out);
                       var fnpath = path.join(rootdir,fn);
                       fs.stat(fnpath,function(err,stat){
                           if (err) {
                             res += '/* failed:'+fn+' '+err.message+'*/'+chunk.substr(pos_out+tag_out.length);
                             loop(++i);  
                           } else {
                               fs.readFile(fnpath,"utf-8",function(err,file_src){
                                   if (err) {
                                        res += '/* failed:'+fn+' '+err.message+'*/'+chunk.substr(pos_out+tag_out.length);
                                   } else {
                                        etag += "-"+stat.mtime.getTime().toString();
                                        res += (fix_js(file_src) + chunk.substr(pos_out+tag_out.length));
                                   }
                                   loop(++i);
                               });
                           }
                           
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
    
    handlers.static.get_js = function(params, cb) {
            
            var filepath = path.join(rootdir,params.path);
            
            fs.stat(filepath,function(err,stat){
                
                if (err || !stat) return cb (codes.not_found_404,"path "+params.path+" not found","text");
                
                stat.etag = stat.mtime.getTime().toString();
                
                var ext = helpers.filenameToExtension(params.path);
                
                var reread=function(){
                    
                    stats[path]=stat;
                    
                    fs.readFile(filepath,function(err,buffer){
                        if (err) return cb (codes.internal_server_error_500,"path "+params.path+" error","text");
                        buffers[filepath]=buffer;
                        if (ext==='js') {
                            return handlers.static.filter_js(
                               buffer.toString("utf-8"),
                               stat.etag,
                               function(src,etag){
                                   buffers[path]=src;
                                   stat.etag = etag;
                                   return cb(
                                       codes.success_200,
                                       src,ext,
                                       {etag:stat.etag}
                                   );
                               }
                            );
                        }
                        
                        return cb(
                            codes.success_200,
                            buffer,ext,
                            {etag:stat.etag});
    
                    });
                    
                };
                
                if (stats[path] && buffers[path]) {
                    
                    if (stat.mtime !== stats[path].mtime) {
                        return reread();
                    } else { 
                        
                        if (params.headers["if-none-match"] === stats[path].etag ) {
                            return cb(
                                304,
                                undefined,
                                ext,
                                {etag:stats[path].etag});
                        }
                        
                        return cb(
                            codes.success_200,
                            buffers[filepath],
                            ext,
                            {etag:stats[path].etag});
                    }
                    
                } else {
                    
                    return reread();
                    
                }
            });
    
             
            
    };
    
    handlers.static.get = function(params, cb) {
        
        var filepath = path.join(rootdir,params.path);
        
        fs.stat(filepath,function(err,stat){
            
            if (err || !stat) return cb (codes.not_found_404,"path "+params.path+" not found","text");
            
            stat.etag = stat.mtime.getTime().toString();

            var ext = helpers.filenameToExtension(params.path);
            
            var reread=function(){
                
                fs.readFile(filepath,function(err,buffer){
                    
                    if (err) return cb (codes.internal_server_error_500,"path "+params.path+" error","text");
                    
                    return cb(
                        codes.success_200,
                        (buffers[filepath]=buffer),
                        ext,
                        {etag:(stats[filepath]=stat).etag}
                    );

                });
                
            };

            if (stats[filepath]) {
                
                // version history exists
                
                if (stat.mtime !== stats[filepath].mtime) {
                    // file has changed on disk
                    console.log({vs:{stat_mtime:stat.mtime,cached_mtime:stats[filepath].mtime}});
                    
                    return reread();
                    
                } else { 
                    var browser_etag = params.headers["if-none-match"];
                    console.log({vs:{browser_etag,cached_etag:stats[filepath].etag}});
                    if (browser_etag && (browser_etag === stats[filepath].etag) ) {
                        
                        // browser has same version
                        
                        return cb(
                            304,
                            undefined,
                            ext,
                            {etag:stats[filepath].etag});
                            
                    }
                    
                    if (buffers[filepath]) {
                        
                        // cached copy exists
                        
                        return cb(
                            codes.success_200,
                            buffers[filepath],
                            ext,
                            {etag:stats[filepath].etag});

                    }
                    
                }
                
            } 
            
            // need to reread from disk
            return reread();
                
        });

    };
    
};

