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

app.helpers.resolve_uri=function(url){
    if (url.substr(0,document.baseURI.length)===document.baseURI) {
        return url.substr(document.baseURI.length);         
    } else {
        return url;
    }
};

[[["public/app/app.forms.js"]]];
([[["lib/helpers/html_merge.js"]]])(app.helpers);
([[["lib/helpers/validate_forms.js"]]])(app.helpers);
app.helpers.validate.default_image_url = "/public/default.png";


app.helpers.build_uri = function(path,queryParams,cb){
    var uri = Object.keys(queryParams).reduce(function(uri,key,index){
        return uri+(index===0?'?':'&')+key+'='+encodeURIComponent(queryParams[key]);
    },typeof path==='string'? "api/"+path : 'api/error');
    return cb ? cb(uri) : uri; 
};

app.helpers.xhr={};

app.getTokenId=function(cb){
    var token = (typeof app.config.sessionToken === 'object' && app.config.sessionToken.id) ? app.config.sessionToken.id : false;
    return typeof cb==='function' ? cb(token) : token;
};

app.getToken=function(cb){
    var token = (typeof app.config.sessionToken === 'object' && app.config.sessionToken.id) ? app.config.sessionToken : false;
    return typeof cb==='function' ? cb(token) : token;
};

app.setToken=function(token,cb){
    app.config.sessionToken = token;
    var tokenString = JSON.stringify(token);
    localStorage.setItem('token',tokenString);
    if(typeof(token) == 'object'){
      app.setLoggedInClass(true);
    } else {
      app.setLoggedInClass(false);
    }
    return app.getToken(cb);
};


// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  if(add){
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};


// create an XMLHttpRequest with prevalidated uri,METHOD,headers and cb
app.helpers.xhr = function (uri,METHOD,headers,cb) {
    var xhr = new XMLHttpRequest();
    xhr.open(METHOD, uri, true);
    app.getTokenId(function(tok){if (tok) headers.token=tok;});
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
    if (payload._method) {
        method = payload._method;
        delete payload._method;
    }
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
       fn(payload,function(code,responsePayload){
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


[[["public/app/app.templates.js"]]];

[[["public/app/app.init.js"]]];



app.logout = function(template,cb){
    // determine what template to load after logging out
    var next_template = app.templates.token.deleted;
    if (typeof template==='function') {
        cb = template;
    } else {
        next_template = app.template_links[template]||next_template;
    }
    
    // determine current login status
    app.getToken(function(tok){
        
        if (tok) {
            // user has logged in at least once
            if (tok.id) {
                // and is probably still logged in
                app.api.token.delete({token:tok.id},function(){
                   
                   tok.id=false;       
                   app.setToken(tok,function(){
                      // display logged out page
                      next_template(cb);
                   });
                   
                });
                
            } else {
                // user is currently logged out
                next_template(cb);
            }
            
        } else {
           // never has logged in - show signup page 
           app.templates.user.create(cb); 
        }
        
    });
};



window.onload=app.init;

