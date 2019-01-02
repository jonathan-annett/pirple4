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
   var page_name_parts = page_name.split("/");
   var handler_name  = page_name_parts.shift();
   var template_name = page_name_parts.shift();
   var defFormName  = handler_name.lowerCase()+template_name.substr(0,1).toUpperCase()+template_name.substr(1).toLowerCase();
   
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
             
         var before_template = "before_template,";
         if (page.before_template) {
             before_template = page.before_template.toString()+",";
         }
         
         handlers.html.sources[ page.path_alias || page_name ] = page.htmlOptions.source;
         
         var browser_variables = "browser_variables,";
         if (page.browser_variables) {
             browser_variables = page.browser_variables.toString()+",";
         }

         var after_template = "after_template,";
         if (page.after_template) {
             after_template = page.after_template.toString()+",";
         }
          
          
          
          var frm_src  = "no_forms,";
          var frm_src2 = "no_forms";

          if (page.forms) {
              
              var f=[ "[" ],   f2 = [ "{" ];
              
              page.forms.forEach(function(frm){
                
                if (frm.id_prefix) {
                    f2.push("  "+JSON.stringify(frm.id_prefix)+" : {");
                    
                    if (frm.before_submit) {
                        f2.push('    "'+frm.before_submit+'" : '+frm.before_submit.toString());
                    }
                    
                    if (frm.after_submit) {
                        f2.push('    "'+frm.after_submit+'" : '+frm.after_submit.toString());
                    }
                    f2.push("  },");
                    
                } else {
                    f.push("  {");
                    
                    f.push('      "id" : '+JSON.stringify( (frm.id || defFormName ) ) );
                    
                    if (frm.before_submit) {
                        f.push("    '"+frm.before_submit+"' : "+frm.before_submit.toString());
                    }
                    
                    if (frm.after_submit) {
                        f.push("    '"+frm.after_submit+"' : "+frm.after_submit.toString());
                    }
                    f.push("  },");
                    
                }
                
              });
              
              if ( f.length>1 ) {
                f.pop();
                frm_src = f.join("\n")+"  }\n],";
              }
              
              if ( f2.length>1 ) {
                f2.pop();
                frm_src2 = f2.join("\n")+"  }\n}";
              }

          }

          var template_src = [
              "",
              
              "// autocreated by handlers.load_webapp_page(app,'"+page_name+"' ... )",
              "// html template : "+sanitized_html_file,
              "// js sources: " + sanitized_js_file,
                 "make_template(",
                 
                 JSON.stringify(handler_name)+",",
                 JSON.stringify(template_name)+",",
                 
                 "//before_template",before_template, 
                 "//browser_variables",browser_variables, 
                 "//after_template",after_template,  
                 "",
                 frm_src,
                 frm_src2,
              ");",
              
               ""
              
          ].join("\n");
          
          
          cb (
              false,
              page_name,
              page.template,
              template_src
             );


      });
       
   });
   
     
};

// scour the file system under /webapp for page templates
handlers.collect_web_pages = function (cb){
    
   var pages = [];
   fs.readdir(webappdir,function(err,page_list){
       
       if (err||!page_list) return cb(err); 
       
       // loop will be called once for each element index of page_list  
       var pageLoop = function (pageNo) {
           if (pageNo>= page_list.length) {
               cb(false,pages);
           } else {
               var page_path=path.join(webappdir,page_list[pageNo]);
               fs.stat(page_path,function(err,stat) {
                   
                   if (err||!stat||!stat.isDirectory()) return pageLoop(++pageNo); 
                   
                   fs.readdir(page_path,function(err,op_list){
                       var opLoop = function (opNo) {
                           
                           if (opNo>= op_list.length) {
                               return pageLoop(++pageNo);
                           } else {
                               var op_path = path.join(page_path,op_list[opNo]);
                               fs.stat(op_path,function(err,stat) {
                                   
                                   if (err||!stat||!stat.isDirectory()) return opLoop(++opNo); 
                                   
                                   fs.readdir(op_path,function(err,files_list){
                                       
                                       if (err||!files_list) return opLoop(++opNo);
                                       
                                       if (files_list.indexOf("content.js")<0)   return opLoop(++opNo);
                                       if (files_list.indexOf("content.html")<0) return opLoop(++opNo);
                                       
                                       var page = {
                                           name : page_list[pageNo]+"/"+op_list[opNo]
                                       };
                                       
                                       if (files_list.indexOf("header.html")>=0) {
                                           page.header = path.join(op_path,"header.html");
                                       }
                                       
                                       if (files_list.indexOf("footer.html")>=0) {
                                           page.footer = path.join(op_path,"footer.html");
                                       }
                                       
                                       pages.push(page);
                                       return opLoop(++opNo);
                                       
                                   });
                                   
                               });
                           }
                       };
                       opLoop(0);
                   });
                   
               });
           }
       };
       pageLoop(0);
   }); 
};

handlers.load_web_pages = function (app,pages,router_GET,cb){
    var js_src = [
        "app.make_page_templates = function (make_template) {",
        "   var before_template, browser_variables, after_template,  before_submit, after_submit;"
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
                
                function(err,link,handler,src) {
                
                    if (err) {
                        
                        js_src.push("/**warning - "+err.toString()+" **/");
                    
                        return loop(++i);
                    }
                    
                    router_GET[link] = handler;
                    
                    js_src.push(src);
                    
                    loop(++i);
                }
            );
            
        }
    };
    loop(0);
};


