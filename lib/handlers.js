/*
  File: handlers.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handlers
  Used By: router,helpers
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
var handlers = module.exports = { };
var fs = require("fs");
var path = require('path');
var handlerdir = path.join(__dirname,'..','lib','handlers');
var sys_handlerdir = path.join(__dirname,'..','lib','_handlers');
var webappdir = path.join(__dirname,'..','webapp');
var templatedir = path.join(__dirname,'..','templates');

//var _data = require('./data');
var helpers  = require('./helpers');
//    validate = helpers.validate;

var codes = handlers.codes = {
    success_200 : 200,     //    Success with response body.
    created_201 : 201,     //    Success with response body.
    success_204 : 204,     //    Success with no response body.
    bad_request_400 : 400,     //    The request URI does not match the APIs in the system, or the operation failed for unknown reasons. Invalid headers can also cause this error.
    unauthorized_401 : 401,     //    The user is not authorized to use the API.
    forbidden_403 : 403,     //    The requested operation is not permitted for the user. This error can also be caused by ACL failures, or business rule or data policy constraints.
    not_found_404 : 404,     //    The requested resource was not found. This can be caused by an ACL constraint or if the resource does not exist.
    method_not_allowed_405 : 405,     //    The HTTP action is not allowed for the requested REST API, or it is not supported by any API.
    not_acceptable_406 : 406,     //    The endpoint does not support the response format specified in the request Accept header.
    unsupported_media_type_415 : 415,     //    The endpoint does not support the format of the request body.
    internal_server_error_500 : 500,
    text : {
    "200" : "Success",    //Success with response body.
    "201" : "Created",    //Success with response body.
    "204" : "Success",    //Success with no response body.
    "400" : "Bad Request",    //The request URI does not match the APIs in the system, or the operation failed for unknown reasons. Invalid headers can also cause this error.
    "401" : "Unauthorized",    //The user is not authorized to use the API.
    "403" : "Forbidden",    //The requested operation is not permitted for the user. This error can also be caused by ACL failures, or business rule or data policy constraints.
    "404" : "Not found",    //The requested resource was not found. This can be caused by an ACL constraint or if the resource does not exist.
    "405" : "Method not allowed",    //The HTTP action is not allowed for the requested REST API, or it is not supported by any API.
    "406" : "Not acceptable",    //The endpoint does not support the response format specified in the request Accept header.
    "415" : "Unsupported media type",    //The endpoint does not support the format of the request body.
    "500" : "Internal server error"
    }
};

// generic fallback handler that returns an empty object
// note- for REPL testing, if cb is not supplied, payload object is returned.
handlers.notFound = function(data, cb) {
    var payloadOut = {};
    return typeof cb === 'function' ? cb(codes.not_found_404, payloadOut) : payloadOut;
};

// generic handler to echo to incoming request
handlers.echo = function(data, cb) {

    var payloadOut = {
        method: data.method,
        via: data.via,
        path: data.path,
        payloadIn: data.payloadIn
    };

    return typeof cb === 'function' ? cb(codes.success_200, payloadOut) : payloadOut;
};

// load each handler from lib/_handlers && lib/handlers 
[sys_handlerdir,handlerdir].forEach(function(hpath){
    fs.readdirSync(hpath).forEach(
        function(fn){ 
          if (fn.substr(-3)===".js"){
             require(path.join(hpath,fn))(handlers);
        }
    });
});

handlers.pathToCamel = function (path) {
    
    var result = "";
    
    path.toLowerCase().split("/").forEach(function (r){
        if (result==="") 
            result = r;
        else 
            result += r.substr(0,1).toUpperCase() + r.substr(1);
    });
    
    return result;
    
};


// load_webapp_page() "loads" a webapp page module 
// webapp modules declare all the code for a specific page handler (browser and serverside)
// the serverside code is executed as a callback from the POST api/html (implemented in _handlers/html.js)
// all other functions imported are converted to source code form and collated into a composite 
// source code injection (which is served to browsers in /public/app.js, via /virtual/app/app.)
handlers.load_webapp_page = function (app,page_name,header,footer,cb) {
    
    if (typeof footer==='function') {
        cb=footer;
        footer = false;
    }
    
    if (typeof header==='function') {
        cb=header;
        header = false;
    }
    
    if (header===undefined) {
        header = path.join("templates","_header.html");
    }
    
    if (footer===undefined) {
        footer = path.join("templates","_footer.html");
    }

   var page_path = path.join(webappdir,page_name);
   var js_file = path.join(page_path,"content.js");
   var sanitized_js_file = path.join("/webapp",page_name,"content.js");
   //var page_name_parts = page_name.split("/");
   //var handler_name  = page_name_parts.shift();
   //var template_name = page_name_parts.shift();
   
   var defFormName  = handlers.pathToCamel(page_name);

   fs.stat(js_file,function(err,stat){
      
      if (err ) return cb (err);
      if (!stat) return cb (new Error("fs.stat did not return stat object:"+js_file));
      if (!stat.isFile() ) return cb (new Error(js_file+" is not a file"));
      
      var html_file = path.join(page_path,"content.html");
      var sanitized_html_file = path.join("/webapp",page_name,"content.html");
      
      fs.stat(html_file,function(err,stat){
          
         if (err) return cb (err);
         if (!stat) return cb (new Error("fs.stat did not return stat object:"+html_file));
         if (!stat.isFile() ) return cb (new Error(html_file+" is not a file"));
         
         var page;
         
         try {
              page = require(js_file) (app,handlers);
         } catch (e){
              return cb (e);
         }
          
         if (!page.htmlOptions) {
             return cb (new Error ("no htmlOptions in pageHandler"));
         }
         
         page.htmlOptions.source = [ sanitized_html_file ];
         if (header) {
             page.htmlOptions.source.unshift(header);
         }
         if (footer) {
             page.htmlOptions.source.push(footer);
         }
             
         var before_template = "no_before_template,";
         if (page.before_template) {
             before_template = '/*before_template*/'+page.before_template.toString()+",";
         }
         var links = [page_name];
         if (typeof page.path_alias === 'string') {
            links.push(page.path_alias);
         }
         
         handlers.html.sources[ page_name ] = page.htmlOptions.source;
         
         var browser_variables = "no_browser_variables,";
         if (page.browser_variables) {
             browser_variables = '/*browser_variables*/'+page.browser_variables.toString()+",";
         }

         var after_template = "no_after_template,";
         if (page.after_template) {
             after_template = '/*after_template*/'+page.after_template.toString()+",";
         }
          
          
          var eventNames = ["on_change","on_input","before_submit","after_submit"];
          var frm_src  = "no_forms,";
          var frm_src2 = "no_form_prefixes";

          if (page.forms) {
              
              var f=[ "/*forms*/[" ],   
                  f2 = [ "/*form_prefixes*/{" ],
                  i,evName;
              
              page.forms.forEach(function(frm){
                
                if (frm.id_prefix) {
                    f2.push("      "+JSON.stringify(frm.id_prefix)+" : {");
                    
                    for(i = 0; i < eventNames.length; i++) {
                        evName = eventNames[i];
                        if (frm[evName]) {
                            f2.push('        "'+evName+'" : '+frm[evName].toString() +",");
                        }
                    }
                    if (f2.length>2) {
                        f2[f2.length-1] = f2[f2.length-1].substr(0,f2[f2.length-1].length-1);
                    }
                    
                    f2.push("      },");
                    
                } else {
                    f.push("      {");
                    
                    f.push('        "id" : '+JSON.stringify( (frm.id || defFormName ) ) +"," );
                    
                    for(i = 0; i < eventNames.length; i++) {
                        evName = eventNames[i];
                        if (frm[evName]) {
                            f.push('        "'+evName+'" : '+frm[evName].toString() +",");
                        }
                    }
                    if (f.length>3) {
                        f[f.length-1] = f[f.length-1].substr(0,f[f.length-1].length-1);
                    }
                    
                    f.push("      },");
                    
                }
                
              });
              
              if ( f.length>1 ) {
                f.pop();
                frm_src = f.join("\n")+"\n      }\n    ],";
              }
              
              if ( f2.length>1 ) {
                f2.pop();
                frm_src2 = f2.join("\n")+"\n      }\n    }";
              }

          }

          var template_src = [
            "",
            "  // html template : "+sanitized_html_file,
            "  // js sources: " + sanitized_js_file,
            "    make_template(",
            "    "+JSON.stringify(page_name)+","+JSON.stringify(defFormName)+",",
            "    "+before_template, 
            "    "+browser_variables, 
            "    "+after_template,  
            "    ",
            "    "+frm_src,
            "    "+frm_src2+");",
            ""
              
          ].join("\n");
          
          
          cb (
              false,
              links,
              page.template,
              template_src
             );


      });
       
   });
   
     
};

handlers.collect_web_pages = function  (cb) {
    var pages = [];
    
    var readpath = function (rootpath,cb) {
        
        fs.readdir(rootpath,function(err,filenames){
        
            if (err||!filenames) return cb(err); 
            
            var i=filenames.indexOf("content.html");
            if ( (i>=0) ) {
                
                filenames.splice(i,1);
                
                i= filenames.indexOf("content.js");
                if ( (i>=0) ) {
                    filenames.splice(i,1);
                    var page = {
                        name : rootpath.substr(webappdir.length+1)
                    };
                    
                    i = filenames.indexOf("header.html");
                    if (i>=0) {
                        filenames.splice(i,1);
                        page.header = path.join(rootpath,"header.html");
                    }
                    
                    i = filenames.indexOf("footer.html");
                    if (i>=0) {
                        filenames.splice(i,1);
                        page.footer = path.join(rootpath,"footer.html");
                    }
                    console.log("loaded template for:"+rootpath.substr(webappdir.length+1));
                    pages.push(page);
                }
            }
            
            var scan = function (i) {
                if (i >= filenames.length) {
                    return cb ();
                } else {
                    var page_path = path.join(rootpath,filenames[i]);
                    fs.stat(page_path,function(err,stat) {
                        if (err || !stat) return cb(err);
                        
                        if (stat.isDirectory()) {
                            return readpath (page_path,function(){
                                return scan(++i);
                            });
                        } else {
                            // move on to next 
                            scan(++i);
                        }
                    });
                }
            };
            scan(0);
            
        });
        
    };
    readpath (webappdir,function (err){
        
        if (err) return cb (err);
        
        return cb(false,pages);
    });
 
};


handlers.load_web_pages = function (app,pages,router_GET,cb){
    var js_src = [
        "app.make_page_templates = function (make_template) {",
        "   var no_before_template, no_browser_variables, no_after_template, no_forms, no_form_prefixes;"
        ];
    var page_names = Object.keys(pages);
    // loop will be called once for each element index of pages keys
    handlers.html.router_GET = router_GET;
    var loop = function (i) {
        if (i>= page_names.length) {
            js_src.push("};");
            cb(js_src.join("\n"));
        } else {
            var key = page_names[i],page = pages[key];
            
            handlers.load_webapp_page(
                app,page.name,
                page.header,page.footer,
                
                function(err,links,handler,src) {
                
                    if (err) {
                        
                        js_src.push("/**warning - "+err.toString()+" **/");
                    
                        return loop(++i);
                    }
                    
                    links.forEach(function(link) {
                        router_GET[link] = handler;
                    });
                
                    
                    js_src.push(src);
                    
                    loop(++i);
                }
            );
            
        }
    };
    loop(0);
};


