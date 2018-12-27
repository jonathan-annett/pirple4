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
var path = require('path');
var fs = require('fs');

var rootdir = path.join(__dirname,'../..');


helpers.chain=typeof setImmediate==='function' ? setImmediate : function(fn,x){setTimeout(fn,0,x);};

/*
  filterConditionals (
     raw - input text
     variables - object with keys
     spacer - optional - string to insert between conditional cuts 
  )
  
  looks for the following pattern in raw:
  
    {?:key} ..some text... {:?}
    
    or 
  
    {?:key} ..some text... {:else:} alternate {:?}  
    
    these markers are removed from raw
    if the key does not exist in variables, the text between the marker pairs is removed also 

*/    
helpers.filterConditionals = function(raw,variables,spacer) {
     
    var conditionals = raw.split ("{?:");
    
    if (conditionals.length===1) {
        return raw;
    }
    spacer = spacer || "";
    var cooked = conditionals.shift();
    /*   
       raw          = "prefix{?:key}conditional {key} content{:?} intermediate {data} {?:key1}conditional content{:?} suffix"
       cooked       = "prefix"
       conditionals = ["key}conditional {key} content{:?} intermediate {data} ","key1}conditional content{:?} suffix"]
    */
    conditionals.forEach(function(chunk){
        /* chunk = "key}conditional {key} content{:?}intermediate {data} " */
        var split = chunk.split("{:?}");
        /* split = ["key}conditional {key} content","intermediate {data} "] */
        var key_content= split.shift().split("}");
        /* 
            key_content = ["key","conditional {key"," content"] 
            split       = ["intermediate {data} "]
        */
        var key = key_content.shift();
        var content=key_content.join("}"),altContent = "";
        /* 
           key         = "key"
           key_content = ["conditional {key"," content"]
           content     = "conditional {key} content"
           altContent  = ""
        */

        var content_altContent = content.split("{:else:}");
        /*
           content_altContent [""]
        */
        if (content_altContent.length==2) {
            /*  
               content = "cond cont {:else:} alt cont" 
               content_altContent = ["cond cont "," alt cont"] 
            */
            content = content_altContent[0];
            altContent = content_altContent[1] + spacer ;
            /*  
               content = "cond cont " 
               altContent = " alt cont "
            */
        }
        
        
        if (variables && typeof variables[key] !== 'undefined') {
            cooked += spacer+content+spacer+split.join("{:?}");
            /* cooked = "prefix conditional {key} content intermediate {data} " */
            /* cooked = "prefix cond cont intermediate {data} " */
            
        } else {
            cooked += spacer+altContent+split.join("{:?}");
            /* cooked = "prefix intermediate {data} " */
            /* cooked = "prefix alt cont intermediate {data} " */
        }
    });
    
    return cooked;
};


/*

  asyncronous function to process html templates.
   - replaces {key} with variables[key] in raw
   - if variables[key] is a function,  it is invoked as follows
        variables[key](context,key,return_handler)
        the function returns the string value by calling return_handler(value)
    - also replaces {[key]} with JSON.stringify(variables[key]) in raw
    
*/
helpers.replaceVariables = function (raw,variables,cb) {
    if (!variables || !raw) {
        return cb(raw);
    }    
    var cooked = raw;
    
    var var_keys = Object.keys(variables);
    
    var find_jsons = function (i) {
        if (i>= var_keys.length) {
            cb(cooked);
        } else {
            var key = var_keys[i];
            var value = variables[key];
            
            var parts = cooked.split("{"+key+"}");
            if (parts.length>1) {
                switch (typeof value) {
                    case "object"   : 
                    case "string"   : 
                    case "number"   : 
                        cooked=parts.join(JSON.stringify(value)); 
                        return helpers.chain(find_strings,++i);
                    case "function" : 
                        return value(key,function(strValue){
                            cooked=parts.join(JSON.stringify(strValue)); 
                            return find_jsons(++i);
                        });
                }
            }
            find_jsons(++i);
        }
    };

    var find_strings = function (i) {
        if (i>= var_keys.length) {
            find_jsons(0);
        } else {
            var key = var_keys[i];
            var value = variables[key];
            
            var parts = cooked.split("{"+key+"}");
            if (parts.length>1) {
                switch (typeof value) {
                    
                    case "number"   : 
                        cooked=parts.join(value.toString()); 
                        return helpers.chain(find_strings,++i);
                    case "string"   : 
                        cooked=parts.join(value); 
                        return helpers.chain(find_strings,++i);
                    case "function" : 
                        return value(key,function(strValue){
                            cooked=parts.join(strValue); 
                            return find_strings(++i);
                        });
                }
            }
            find_strings(++i);
        }
    };
    
    find_strings(0);
};


/*

    mergeVariables - used to "preprocess" html, replacing {key} with variables[key]
    
    - filters out conditional wrappers marked with {?:key} some text {:?}
      (if key does not exist in variables, deletes " some text " from raw)
    
    - filters out conditional wrappers marked with {?:key} some text {:else:} some other text {:?}
      (if key does not exist in variables, " some other text " will remain in raw)
    
    once these replacements are made, asyncronous replacement takes place as follows
      (async only because functions may be needed)
    
    - replaces {key} with variables[key] in raw
    - if variables[key] is a function,  it is invoked as follows
         variables[key](context,key,return_handler)
         the function returns the string value by calling return_handler(value)
     - also replaces {[key]} with JSON.stringify(variables[key]) in raw
    
    mergeVariables (
       raw          - input text
       variables    - object with keys to values (either strings or functions that return a string)
       spacer       - optional - string to insert between conditional cuts 
       cb           - callback for resulting html
    )
    
*/
helpers.mergeVariables  = function (raw,variables,spacer,cb){
    
    return helpers.replaceVariables(
        helpers.filterConditionals (raw,variables,spacer),
        variables,
        cb
    ); 
    
};



/*

 mergeVariableArray -
 
 return a large chunk of html using raw as template for each element in an array/keyed object
 templates can use {_meta.index} and {_meta.key} to diffentiate between elements and create ids etc

 array: [ { one: 1, a : 'a' }, { one: 100, a : 'z'} ]
     --> { one: 1, a : 'a', '_meta.index' : 0, '_meta.key' : '0' }
     --> { one: 100, a : 'z', '_meta.index' : 1, '_meta.key' : '1' }

 { "key1" : { one: 1, a : 'a' }, "key2" : { one: 100, a : 'z'} }
     --> { one: 1, a : 'a', '_meta.index' : 0, '_meta.key' : 'key1' }
     --> { one: 100, a : 'z', '_meta.index' : 1, '_meta.key' : 'key2' }
*/
helpers.mergeVariableArray = function(raw,array,spacer,cb){
    var var_keys = Object.keys(array),html='',xspacer='';
    var loop = function (i) {
        if (i>= var_keys.length) {
            cb(html);
        } else {
            var key = var_keys[i],variables = array[key];
            variables["_meta.index"]=i;
            variables["_meta.key"]=key;
            helpers.mergeVariables(raw,variables,spacer,function(cooked) {
                html += xspacer+cooked;
                xspacer=spacer;
                loop(++i);
            });
        }
    };
    loop(0);
};


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
         context.variables.global = {}
         var glob_keys = Object.keys(config.globals);
         for(var i = 0; i < glob_keys.length; i++) {
             var glob_key = glob_keys[i];
             context.variables.global[glob_key] = config.globals[glob_key];
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
        context.variables.globals = config.globals;
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

