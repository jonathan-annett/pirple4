/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  sessionToken : false,
  appState : false
};

// AJAX api (for RESTful API)
app.api = {};
app.helpers={};


app.helpers.setInput = {
  text     : function(el,value) { el.value = value; },
  checkbox : function(el,value) { if (value) el.checked=true; else el.checked=false;}
};
app.helpers.setInput.password=app.helpers.setInput.text;

app.helpers.getInput = {
  text     : function(el) { return el.value; },
  checkbox : function(el) { return el.checked; }
};
app.helpers.getInput.password=app.helpers.getInput.text;

app.helpers.setFormData = function(frmId,data){

    var elements=document.getElementById(frmId).elements;
    
    Object.keys(elements).forEach(function(i){
       var fn,el = elements[i],value;
       if (el.name && (value=data[el.name]) && (fn = app.helpers.setInput[el.type])) fn(el,value);
    });
    
};

app.helpers.getFormData = function (frmId) {
    var elements=document.getElementById(frmId).elements,result={};

    Object.keys(elements).forEach(function(i){
      var fn,el = elements[i];
      if (el.name && (fn = app.helpers.getInput[el.type])) result[el.name]=fn(el);
    });
    return result;
};

(function(helpers) {
    

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

})(app.helpers);


// 
app.helpers.build_uri = function(path,queryParams,cb){
    var uri = Object.keys(queryParams).reduce(function(uri,key,index){
        return uri+(index===0?'?':'&')+key+'='+encodeURIComponent(queryParams[key]);
    },typeof path==='string'? "api/"+path : 'api/error');
    return cb ? cb(uri) : uri; 
};

app.helpers.xhr={};

app.helpers.getTokenId=function(cb){
    var token = (typeof app.config.sessionToken === 'object' && app.config.sessionToken.id) ? app.config.sessionToken.id : false;
    return typeof cb==='function' ? cb(token) : token;
};

app.helpers.getToken=function(cb){
    var token = (typeof app.config.sessionToken === 'object' && app.config.sessionToken.id) ? app.config.sessionToken : false;
    return typeof cb==='function' ? cb(token) : token;
};

app.helpers.setToken=function(token,cb){
    app.config.sessionToken = token;
    return app.helpers.getToken(cb);
};


// create an XMLHttpRequest with prevalidated uri,METHOD,headers and cb
app.helpers.xhr = function (uri,METHOD,headers,cb) {
    var xhr = new XMLHttpRequest();
    xhr.open(METHOD, uri, true);
    app.helpers.getTokenId(function(tok){if (tok) headers.token=tok;});
    Object.keys(headers).forEach(function(key) {
        xhr.setRequestHeader(key, headers[key]);
    });
    
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE) {
          var statusCode = xhr.status;
          var responseReturned = xhr.responseText;
            try{
              cb(statusCode,JSON.parse(responseReturned));
            } catch(e){
              cb(statusCode,false);
            }
  
        }
    };
  
    cb(undefined,undefined,xhr);
    
};
//headers,path,method,queryStringObject,payload,callback

// app.api.request('menu',function(code,menu){})
// app.api.request('menu',{description:"pizza"},{method:'PUT'},function(code,menu){})
// app.api.request('token',{email:"x@y.z","passw0rd"},function(code,menu){})
// app.api.request('token',{method:"DELETE",queryParams:{token:app.config.sessionToken.id}});
// app.api.request('token',{method:"PUT",queryParams:{token:app.config.sessionToken.id}},function(code,token){});

app.api.methods={GET:0,POST:2,PUT:2,DELETE:2};
app.api.options = function(payloadIn,options,cb) {
    if (typeof options==='function') {
        // app.api.request('/token',{email:"x@y.z","passw0rd"},function(code,menu){})
        return {
            method:'POST',
            params:{},
            headers:{"Content-type":"application/json"},
            body: typeof payloadIn==='object' ? JSON.stringify(payloadIn) : '{}',
            cb : options
        };
    } else {
        
        if (typeof payloadIn==='function') {
            // app.api.request('/menu',function(code,menu){})
            return {method:'GET',params:{},headers:{},body:false, cb : payloadIn};
            
        } else {
            // app.api.request('/token',{method:"DELETE",queryParams:{token:app.config.sessionToken.id}});
            // app.api.request('/token',{method:"PUT",queryParams:{token:app.config.sessionToken.id}},function(code,token){});
            
            if (typeof options.params !== 'object') options.params={};
            if (typeof options.headers !== 'object') options.headers={};
            options.method=String(options.method).toUpperCase();
            if (app.api.methods[options.method]===1) {
                options.headers["Content-type"]="application/json";
                options.body=JSON.stringify(payloadIn);
            } else {
                options.method="GET";
                options.body=false;
            }
            options.cb = typeof cb === 'function' ? cb : function(){};
            return options;
        }
    }
};


// app.api.request('menu',function(code,menu){})
// app.api.request('menu',{description:"pizza"},{method:'PUT'},function(code,menu){})
// app.api.request('token',{email:"x@y.z","passw0rd"},function(code,menu){})
// app.api.request('token',{method:"DELETE",queryParams:{token:app.config.sessionToken.id}});
// app.api.request('token',{method:"PUT",queryParams:{token:app.config.sessionToken.id}},function(code,token){});

app.api.request = function (path,payloadIn,options,cb) {
    
    options = app.api.options(payloadIn,options,cb);

    app.helpers.build_uri(path,options.params,function(uri){
        
        app.helpers.xhr(uri,options.method,options.headers,function(statusCode,payloadOut,xhr){
            
            if (xhr) {
                if (options.body) {
                    xhr.send(options.body);
                } else {
                    xhr.send();
                }
            } else {
                options.cb(statusCode || 500,payloadOut);
            }         
        });
    });

};

app.submitFormData = function (frmId,path,method,cb){
    
    var 
    
    payload = app.helpers.getFormData(frmId),
    error_message=function(code,message) {
       if (typeof cb==='function') {
          cb(code,{Error:message},payload);// note extra parameter for payload
       }
    };
 
    
    if (typeof payload!=='object') {
        return error_message(500,"could not get valid payload for "+frmId+" in submitFormData("+frmId+")" );
    }
    
    if (typeof app.api[path]!=='object') {
        return error_message(500,path+" is not a valid path for the API" );
    }
    
    var fn=app.api[path][method];
    if (typeof fn==='function') {
       fn(path,payload,function(code,responsePayload){
          if (typeof cb==='function') {
            cb(code,responsePayload,payload);// note extra param for submitted payload.
          }  
       });
    } else {
       if (typeof cb==='function') {
           return error_message(500,method+" is not a valid method for "+path+" in app.submitFormData("+frmId+")");
       }
    }
 
};


//
app.init = function (){
    app.init.generate_api_stubs(["user", "token", "cart", "menu", "order"]);
    app.init.generate_templates();
    app.init.interceptFormSubmits();
    app.init.interceptButtonLinks();
};


// auto generate the api tool stubs
// this creates app.api.(user,token,cart,menu,order).(get,post,put,delete) etc
app.init.generate_api_stubs = function(paths) {
    paths.forEach(function(path) {
        app.api[path]={};
    });
    paths.forEach(function(path) {
        app.api[path].post = function(data, cb) {
            return app.api.request(path,data,cb);
        };
    });
    paths.forEach(function(path) {
        app.api[path].get = function(params, cb) {
            if (typeof params==='function' ) return app.api.request(path,params);
            return app.api.request(path,undefined,{method:"GET",params:params},cb);
        };
    });
    paths.pop();
    paths.forEach(function(path) {
        app.api[path].put = function(data, cb) {
            return app.api.request(path,data,{method:"PUT"},cb);
        };
    });
    paths.forEach(function(path) {
        app.api[path].delete = function(params, cb) {
            if (typeof params==='function' ) return app.api.request(path,undefined,{method:"DELETE"},params);
            return app.api.request(path,undefined,{method:"DELETE",params:params},cb);
        };
    });
};



// auto generate the template generators
// creates app.templates.PATH.OPERATION(data,context, cb)
app.init.generate_templates = function(){
    app.templates = {};
    app.template_links = {};
    var templateCache={};
    var header_template_;
    var title_template_;
    
    var extract_title= function(html) {
        // search within html for <title></title> pattern
        
        var scan=html.toLowerCase();
        var pos=scan.indexOf("<title");
        if (pos>=0) {
            
            while(scan.charAt(pos)!=='>') pos++;
            
            scan = scan.substr(++pos);
            html = html.substr(pos);
            pos  = scan.indexOf("</title");
            if (pos>=0) {
                return html.substr(0,pos);
            }
        }
        return false;
    };
    
    var get_title_template = function (cb) {
        // on first call, hit server for the _header html chunk, and extract title format from it.
        // on subsequent calls return the cached title format.
        if (title_template_===undefined) {
            return app.api.post(
                "html", 
                {path: "_header",variables: {}},
                {},
            function(code,data){
                 if (code==200) {
                     header_template_ = data.rawHtml;
                     title_template_  = extract_title(header_template_);
                     return cb (title_template_);
                 } else {
                     return cb (false);
                 }
            });
        } 
        
        return cb(title_template_);
    };
    
    var exit_200= function(formId,pageInfo,cb) { 
        
        // replace the page contents with newly rendered html 
        document.querySelector("div.content").innerHTML = pageInfo.cookedHtml;
        
        // save the formId for future record
        app.config.appState = formId;
        
        // get the template for the document title from the header template
        get_title_template(function(title_temp){
            
            // render the document title using variables from page
            app.helpers.mergeVariables(title_temp,pageInfo.variables,{},'',function(title){
               
               // set the document title
               document.title=title;
               
               if (typeof cb==='function') {
                  cb(200,pageInfo.cookedHtml); 
               }
               
            });
            
        });
        
    };
    
    var exit_err= function(code,err,cb) {
       if (typeof cb==='function') {
          cb(code,{Error:err}); 
       } 
    };
    
    var make_array_template = function(formId,path,op) {
        // extends array template function to allow arrayed delivery
        app.templates[path][op].array = function(array, context, cb) {

            if (typeof context === 'function') {
                cb = context;
                context = {};
            } else {
                if (typeof array === 'function') {
                    cb = array;
                    array = {};
                }
            }

          
            var exit_arrayed = function() {
                app.helpers.mergeVariableArray(templateCache[formId].rawHtml, array, context, '', function(html) {
                    exit_200(
                    formId, {
                        cookedHtml: html,
                        variables: templateCache[formId].variables
                    },
                    cb);
                });
            };

            if (templateCache[formId]) {

                exit_arrayed();

            } else {

                // request html template for 
                return app.api.post(

                    "html", {
                    formId: formId,
                    variables: {},
                    handler: path,
                    operation: op,
                    context: context
                },

                function(code, pageInfo) {
                    if (code == 200) {
                        templateCache[formId] = pageInfo;
                        exit_arrayed();
                    } else {
                        exit_err(code, "error: http code " + code, cb);
                    }
                });
            }
        };
    };
    
    var make_template = function(path, op, path_alias, arrayed) {
        
        var linkpath = path_alias || path;
        // camelcase "account","create" --> accountCreate
        var formId = linkpath.toLowerCase() + op.substr(0, 1).toUpperCase() + op.substr(1).toLowerCase();
       
        app.templates[path] = app.templates[path] || {};
        
        
        //
        app.templates[path][op] = function(variables, cb) {
            
            if (typeof variables === 'function') { 
                cb=variables; variables={}; 
            } 

            if (templateCache[formId]) {
                
                app.helpers.mergeVariables(templateCache[formId].rawHtml,variables,'',function(html){
                    
                    exit_200(formId,{ cookedHtml: html, variables:templateCache[formId].variables },cb);
                    
                });
                
            } else {
                
                return app.api.post("html", {
                    formId     : formId,
                    variables  : variables,
                    handler    : path,
                    operation  : op
                },
                
                function(code,pageInfo){
                     if (code==200) {
                         templateCache[formId]=pageInfo;
                         exit_200(formId,pageInfo,cb);
                     } else {
                         exit_err(code,"error: http error "+code,cb);
                     }
                });
                
            }
        };
        
        if (arrayed) {
            make_array_template(formId,path,op);
        }
        
        app.template_links["/"+linkpath+"/"+op]=app.templates[path][op];
    };
 
    make_template("user",  "create",   "account");
    make_template("user",  "edit",     "account");
    make_template("user",  "deleted",  "account");
    make_template("token", "create",   "session");
    make_template("token", "deleted",  "session");
    make_template("menu",  "list",      undefined,  true);
    make_template("menu",  "view");
    make_template("menu",  "create");
    make_template("menu",  "edit");
    make_template("cart",  "view",      undefined,  true);
    make_template("cart",  "checkout");
    make_template("order", "complete");
    make_template("order", "failed");
    make_template("order", "list",      undefined,  true);
    make_template("order", "view");
    
};



// app.interceptFormSubmits attaches a generic callback to prevent default form submit
// and use our own javascript AJAX style submit without losing current browser page.
app.init.interceptFormSubmits = function(){
    
  var onFormSubmit = function(e) {

      // Stop the form from submitting
      e.preventDefault();
      
      // pull in formId,path & method from form object.
      var formId = this.id,path = this.action, method = this.method.toLowerCase();
      
      // Hide any messages currently shown due to a previous error.
      [ "formError" , "formSuccess"].forEach(function(el) {
         var sel = "#" + formId + " ."+el;
         if (document.querySelector(sel)) {
           document.querySelector(sel).style.display = 'none';
         }  
      });
      
      // submit the form data using API
      app.submitFormData(formId,path,method,function(code,responsePayload,payload){
          // Display an error on the form if needed
          if (code !== 200) {

              if (code == 403) {
                  // log the user out
                  app.logout();

              } else {

                  // Try to get the error from the api, or set a default error message
                  var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

                  // Set the formError field with the error text
                  document.querySelector("#" + formId + " .formError").innerHTML = error;

                  // Show (unhide) the form error field on the form
                  document.querySelector("#" + formId + " .formError").style.display = 'block';
              }
          } else {
              // If successful, send to form response processor
              var processor = app.after_submit[formId] || app.after_submit._generic;
              processor(responsePayload , payload, formId);
          }
      });

  };
  
  var captureFormSubmit = function(form){form.addEventListener("submit", onFormSubmit)};
  
  document.querySelectorAll("form").forEach(captureFormSubmit);
};


// set 
app.init.interceptButtonLinks = function () {
    document.querySelectorAll("li a").forEach(function(el){
        
        var buttonId = el.id, uri = el.href, clickHandler = app.buttons[buttonId] || app.buttons[uri];
        
        if (buttonId && typeof uri==="string" && typeof clickHandler==='function') {
            if (uri==="#") {
                
                el.addEventListener("click", function(e){
                   e.preventDefault();
                   e.stopPropagation();
                   clickHandler.call(this);
                });
                
            } else {
                
                var templateHandler = app.template_links[uri];
                if (typeof templateHandler === "function") {
                    
                    el.addEventListener("click", function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        var btn = this;
                        templateHandler(function(){
                           clickHandler.call(btn);
                        });
                    });
                }
            }
        }

    });
};






app.logout = function(cb){
    // determine current login status
    app.helpers.getTokenId(function(tok){
        
        if (tok) {
            // yes we are logged in - fix that now 
            app.api.token.delete({token:tok},function(){
               app.setToken(false,function(){
                  // display logged out page
                  app.templates.token.deleted(cb);
               });
            });
        } else {
            // redisplay logged out page
           app.templates.token.deleted(cb); 
        }
        
    });
};

app.displayPizzaMenu=function(cb){
    
    if (app.helpers.getTokenId()) {
        app.api.menu.get(function(code,array){
            if (code===200) {
                app.templates.menu.list.arrayed(array,cb);
            } else {
                if (typeof cb==='function') cb();
            }
        });
    } else {
        app.templates.token.create(cb);
    }
};

/*

  form button click callbacks

*/


app.buttons = {};

// invoked after the account/create page has been loaded dynamically into the contents div
app.buttons["/account/create"] = function(){
   console.log(arguments);
};

// invoked after the session/create page has been loaded dynamically into the contents div
app.buttons["/session/create"] = function(){
    console.log(arguments);
};

// invoked after the menu/list page has been loaded dynamically into the contents div
app.buttons["/menu/list"] = function(){
    console.log(arguments);
};

// invoked after the cart/view page has been loaded dynamically into the contents div
app.buttons["/cart/view"] = function(){
    console.log(arguments);
};

// invoked after the account/edit page has been loaded dynamically into the contents div
app.buttons["/account/edit"] = function(){
    console.log(arguments);
};

app.buttons.logoutButton = function(){
    app.logout ();
};

/*

  form after_submit callbacks

*/

app.after_submit={};
app.after_submit._generic = function (responsePayload , payload, formId) {
    console.log({
        warning:{
            info:"unhandled app.after_submit",
            responsePayload:responsePayload , 
            payload:payload, 
            formId:formId
        }
    });
};

// invoked after sucessful submit to /account/create 
app.after_submit.accountCreate = function(user) {
   // store the token
   app.setToken(user.token,function(){
      // display the full menu 
      app.displayPizzaMenu();
   });
};

// invoked after sucessful submit to /session/create  
app.after_submit.sessionCreate = function(token) {
    // store the token
    app.setToken(token,function(){
       // display the full menu 
       app.displayPizzaMenu();
    });
};



app.init();
