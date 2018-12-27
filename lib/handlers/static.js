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
    var history={};
    
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
    
    var filter_js = function (src,etag,cb) {
        var tag_in = '[[["',tag_out='"]]]';
        var pos_in  = src.indexOf(tag_in);
        var pos_out = src.indexOf(tag_out);
        var files = [];
        if ( (pos_in>=0) && (pos_out>pos_in)) {
            
           var chunks =  src.split(tag_in);
           var res = chunks.shift();
           
           var loop=function(i){
               
               if (i>=chunks.length) {
                   return cb(res,etag,files);
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
                               files.push({mtime:stat.mtime.getTime(),path:fnpath});
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
    
    var test_files_changed = function(files, cb) {
        var loop=function(i){
            if (i>=files.length) {
                return cb(false);
            }
            
            fs.stat(files[i].path,function(err,stat){
                if (files[i].mtime !== stat.mtime.getTime()) {
                    return cb(true);
                }
                loop(++i);
            });
        };
        loop(0);
    };
    
    handlers.static.get = function(params, cb) {
        var ext = helpers.filenameToExtension(params.path);
        var custom = handlers.static.get[ext];
        if (typeof custom==='function') return custom(params,cb);
        var filepath = path.join(rootdir,params.path);
        
        fs.stat(filepath,function(err,stat){
            
            if (err || !stat) return cb (codes.not_found_404,"path "+params.path+" not found","text");
            
            var etag = stat.mtime.getTime().toString();

            var reread=function(){
                
                fs.readFile(filepath,function(err,buffer){
                    
                    if (err || !buffer ) return cb (codes.internal_server_error_500,"path "+params.path+" error","text");
                    
                    history[filepath] = {
                        file_data : buffer,
                        headers : {etag:etag},
                        mtime : stat.mtime.getTime(),
                    };
                    
                    return cb(
                        codes.success_200,
                        history[filepath].file_data,
                        ext,
                        history[filepath].headers
                    );

                });
                
            };

            if (typeof history[filepath]==='object') {
                
                // version history exists

                if (stat.mtime.getTime() !== history[filepath].mtime) {
                    // file has changed on disk
                    return reread();
                    
                } else { 
                    
                    var browser_etag = params.headers["if-none-match"];

                    if (browser_etag && (browser_etag === history[filepath].headers.etag) ) {
                        
                        // browser has same version
                        return cb(
                            304,
                            undefined,
                            ext,
                            history[filepath].headers);
                            
                    }
                    
                    return cb(
                        codes.success_200,
                        history[filepath].file_data,
                        ext,
                        history[filepath].headers);
                }
                
            } 
            
            // need to reread from disk
            return reread();
                
        });

    };

    handlers.static.get.js = function(params, cb) {

        var filepath = path.join(rootdir, params.path);

        fs.stat(filepath, function(err, stat) {

            if (err || !stat) return cb(codes.not_found_404, "path " + params.path + " not found", "text");

            var etag = stat.mtime.getTime().toString();

            var ext = helpers.filenameToExtension(params.path);

            var reread = function() {

                fs.readFile(filepath, "utf-8", function(err,src) {

                    if (err || !src) return cb(codes.internal_server_error_500, "path " + params.path + " error", "text");

                    filter_js (
                      src,etag,
                      function(src,etag,files){
                          
                        files.unshift({path:filepath,mtime:stat.mtime.getTime()});
                        history[filepath] = {
                            file_data: src,
                            headers: {
                                etag: etag
                            },
                            files : files
                        };
                        
                        return cb(
                            codes.success_200,
                            history[filepath].file_data,
                            ext,
                            history[filepath].headers
                        ); 
                        
                    });

                });

            };

            if (typeof history[filepath] === 'object') {

                // version history exists
                
                test_files_changed(history[filepath].files , function(changed){
                    
                    if (changed) return reread(); // file has changed on disk
                    
                    var browser_etag = params.headers["if-none-match"];

                    if (browser_etag && (browser_etag === history[filepath].headers.etag)) {

                        // browser has same version
                        return cb(
                        304,
                        undefined,
                        ext,
                        history[filepath].headers);

                    }

                    return cb(
                        codes.success_200,
                        history[filepath].file_data,
                        ext,
                        history[filepath].headers
                    );     
                    
                });
            }

            // need to reread from disk
            return reread();

        });

    };
};

