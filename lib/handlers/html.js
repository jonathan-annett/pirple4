/*
  File: html.js
  Project: Asignment 3 https://github.com/jonathan-annett/pirple2
  Synopsis: HTML handlers
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
var fs = require('fs');

var path = require('path');
var rootdir = path.join(__dirname,'../..');

// load a filename or array of filenames
/*

    // single path to file
    helpers.loadHTMLContent("public/index.html",cb);
    
    
    fs.readFile(filename,function(err,data) {
        if (!err && data) helpers.loadHTMLContent(data,cb);    
    }
    
    fs.readFile(filename,function(err,data) {
        if (!err && data) helpers.loadHTMLContent([header,data,footer],cb);    
    }
    
    helpers.loadHTMLContent(["templates/_header.html","templates/accountEdit.html","templates/_footer.html"],{ variables:{user:userData}},function(){});

   cb is called with (error, cookedHtml, rawHtml, context);
*/

require('../helpers/html_merge')(helpers);

helpers.loadHTMLContent = function (source,context,cb) {
    
    // context is optional
    if (typeof context==="function") { cb=context; context=undefined;}
    
    // determine the file sources
    var sources=[];
    switch (typeof source) {
        case "string" :
            // single path to file
            sources = [ source ];
            break;
        case "object" : 
            if (source.constructor===Array) {
                // fully constructed array of paths,buffers, or callbacks
                sources = source;
            }
            
            if (source.constructor=== Buffer) {
                // buffer of previously cached file
                sources = [ source ];
            }
            
            break;
            
        case "function" : 
            // a callback function
            sources = [ source ];
    }
    
    if (source.length===0) {
        // no point in iterating an empty array
        return cb (undefined,'','',context);
    }
    
    // loop will be called for each element index of sources array
    var loop = function (index) {
        
        if (index >= sources.length) {
            // we have processed all the chunks
            
            // concatenate the buffers as a utf string
            console.log({sources});
            var raw = Buffer.concat(sources).toString("utf8");
            
            var variables = context && context.variables ? context.variables : undefined;
            
            return helpers.mergeVariables(raw,variables,'',function(cooked){
                return cb(undefined,cooked,raw,context);
            });

        }
        
        var loop_continue = function(err,data) {
            if (err) return cb(err);
            sources[index]=data;
            loop(++index);
        };
                              
         
        // there are still elements not processed
        var t;
        switch ( (t=typeof sources[index]) ) {
            
            case "string" : // this is a path to file chunk
                var fn = path.join(rootdir,sources[index]);
                // load the file as a raw buffer 
                return fs.readFile(fn,loop_continue);
                
            case "object" : // already a buffer 
                return loop(++index);
                
            case "function" : // generator function
                return sources[index](context,loop_continue);
                
        } 
        console.log({sources});
        return cb("unknown html chunk type:"+t+ "at index "+index);
    };
    
    loop(0);
    
   
};

    
// constants to ensure conistent filename spelling throughout
const USER="user";
const HTML= "html";


module.exports=function(handlers){
    var codes = handlers.codes;
    
    handlers.html={};
    
    
    // load and serve a html file
    // params.htmlOptions.source can specify filepath or array of filepaths (for segmented [header,body,footer])
    // params.htmlOptions.dataSources = {} indicates user data is needed 
    // params.htmlOptions.dataSources = { cart : true} indicates user & cart data is needed 
    // params.htmlOptions.dataSources = { menu : "someid" } indicates user & menu data is needed 
    // params.htmlOptions.dataSources = { menu : false } indicates user & menu data is needed 
    
    handlers.html.template = function(params, cb) {
         
         // build an array of files to concatenate, using options.header and options.footer
         var source;
         var context =  { variables : params.htmlOptions.variables || {} };
         context.variables.global = {};
         var glob_keys = Object.keys(config.globals);
         for(var i = 0; i < glob_keys.length; i++) {
             var glob_key = glob_keys[i];
             context.variables["global."+glob_key] = config.globals[glob_key];
         }
         
         if (params.htmlOptions && params.htmlOptions.source ) {
             source = params.htmlOptions.source;
         } else {
             source = [ params.path ];
         }

         // after fetching the required datasources, serve_html loads the file and serves it
         var serve_html = function( ) {
             
               if (params.serve_html_callback) {
                   return params.serve_html_callback(source,context);
               }

               helpers.loadHTMLContent(
                  source,context,
                  function(err,html){
                      if (err) {
                          // there was a problem reading the file
                          return cb(codes.not_found_404,err.message||err,HTML);
                      } 
                     return cb(codes.success_200,html,HTML); 
                  }
              );

          };

         if (params.htmlOptions && params.htmlOptions.dataSources) {
             
             if (params.htmlOptions.dataSources.user) {
                 // we always read user file in authentication phase, 
                 // so remove it from requested dataSources
                 delete params.htmlOptions.dataSources.user;
             }

             // ok - it's time to ensure the remote user has a valid token
             handlers.token.authentication.email_and_cart(params,function(email_from_token,cart_id_from_token){
                
                //without a valid "email_from_token" we can't proceed
                if (!email_from_token || !cart_id_from_token) {
                    // the token is invalid, or is for another user, or it has expired
                    return cb(codes.unauthorized_401,'',HTML);
                }
                

                // see if a file exists for this email address
                _data.read(USER,email_from_token, function (err,user){
                    
                    if (err){
                        // there was a problem reading the file
                        return cb(codes.not_found_404,err.message || err, HTML);
                    }   
                    
                    
                    // ensure any required permissions are set in the user's profile
                    if (params.htmlOptions.requiredPermissions) {
                        var perm_keys = Object.keys(params.htmlOptions.requiredPermissions);
                        for(var i = 0; i < perm_keys.length; i++) {
                            var perm_key = perm_keys[i];
                            var perm = params.htmlOptions.requiredPermissions[perm_key];
                            var uperm = user && user.permissions ? user.permissions[perm_key] : null;
                            if (uperm!==perm)  {
                                return cb(codes.unauthorized_401,'',HTML);
                            }
                        }
                    }
                    
                    if (user) {
                        // sanitize the user file
                       delete user.password;
                       delete user.salt;
                       context.variables.user = user;
                    }
                    
                    // build an array of dataSource names to iterate asyncronously with the fetch () function below
                    var dbs = Object.keys(params.htmlOptions.dataSources);
                    if (dbs.indexOf('cart') >=0 ) {
                        // any mention of the cart in dbs indicates we need the current cart_id
                        params.htmlOptions.dataSources.cart=cart_id_from_token;
                    }
                    
                    // we'll call fetch once for each element index in the dbs array
                    var fetch = function(index){
                        if (index < dbs.length) {
                            var dbname = dbs[index];
                            var key = params.htmlOptions.dataSources[dbname];
                            
                            var collector = function(err,data){
                               if (err) {
                                   return cb (codes.internal_server_error_500,err.message || err,HTML);
                               }
                               if (data) {
                                  context.variables[dbname] = data;
                               }    
                               return fetch(++index);   
                            };
            
                            if (typeof key==='object') {
                                // { menu  : { list:{preload:true,flatten:true}} }
                                // { cart  : { indirect : "user.cart_id" } }
                                // { order : { indirect : "user.orders[-1]" } }
                                // { order : { indirect : "user.orders[0]" } }
                                
                                if (typeof key.list==='object') {
                                   // { menu : {list:{preload:true,flatten:true}} }
                                  _data.list(dbname,key.list,collector);
                                } else {
                                    
                                    if (typeof key.indirect ==='string') {
                                       // { cart  : { indirect : "user.cart_id" } }
                                       // { order : { indirect : "user.orders[-1]" } }
                                       // { order : { indirect : "user.orders[0]" } }
                                       
                                       var subdbname_keyname = key.indirect.split(".");
                                       
                                       if (subdbname_keyname.length!==2) {
                                            return cb (codes.internal_server_error_500,"",HTML);
                                       }
                                       
                                       var subdbname  = subdbname_keyname.shift();
                                       var subdb      = context.variables[subdbname];
                                       
                                       var keyname     = subdbname_keyname.join(".");
                                       var array_index = keyname.split("[");
                                       
                                       switch (array_index.length) {
                                           case 1 :
                                               // { cart  : { indirect : "user.cart_id" } }
                                               key = subdb[keyname];    
                                               return _data.read(dbname,key, collector);
                                               
                                           case 2 :
                                               // { order : { indirect : "user.orders[-1]" } }
                                               // { order : { indirect : "user.orders[0]" } }
                                               
                                               var subindex=array_index[1];
                                               subindex = Number(subindex.substr(0,subindex.length-1));
                                               
                                               var array = subdb[ array_index[0] ];
                                               key = array[subindex < 0 ? array.length+subindex : subindex];
                                               
                                               return _data.read(dbname,key, collector);
                                               
                                            default:
                                               
                                               return cb (codes.internal_server_error_500,err.message || err,HTML);
                                       }
                                       
                                    } else {
                                        return cb (codes.internal_server_error_500,"",HTML);
                                    }
                                }
                                
                            } else {
                                _data.read(dbname,key, collector);
                            }
                            
                            
                        } else {
                           serve_html(); 
                        }
                    };
                    
                    // kick off the dataSource collection loop.
                    
                    /*still trying to make*/fetch/*happen*/(0);
                    
                });
    
          
            });
            
         } else {
             // no params.htmlOptions.dataSources to scan,
             // but globals will still be available 
             serve_html();
         }
        

    };
    
    
    handlers.html.post = function (params, cb) {
        var context =  { variables : params.payloadIn.variables || {} };
        var glob_keys = Object.keys(config.globals);
        for(var i = 0; i < glob_keys.length; i++) {
            var glob_key = glob_keys[i];
            context.variables["global."+glob_key] = config.globals[glob_key];
        }
        
        
        var frmId=params.payloadIn.formId;
        helpers.loadHTMLContent(
            ["templates/"+frmId+".html"],
            context,
            function(err,cookedHtml, rawHtml){
                if (err) {
                    // there was a problem reading the file
                    return cb(codes.not_found_404,err.message||err);
                } 
                
                if ( (typeof params.payloadIn.handler === 'string') && 
                     (typeof params.payloadIn.operation === 'string') ) {
                    var hndlr = handlers[params.payloadIn.handler];
                    if (typeof hndlr==='object' && typeof hndlr.html === 'object') {
                        var fn = hndlr.html[params.payloadIn.operation];
                        if (typeof fn==='function') {
                           params.serve_html_callback = function (source,context) {
                                return cb(
                                    codes.success_200,{
                                        cookedHtml:cookedHtml, 
                                        rawHtml:rawHtml, 
                                        variables:context.variables}
                                );
                           };
                           return fn(params);
                        } 
                    }
                }
                
                return cb(codes.success_200,{cookedHtml:cookedHtml, rawHtml:rawHtml}); 
            }
        );
    };

};

