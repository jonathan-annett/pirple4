/* global app */
app.api = {};

app.api.methods={GET:0,POST:1,PUT:1,DELETE:1};

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
