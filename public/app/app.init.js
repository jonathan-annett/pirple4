/* global app */

app.init = function() {
    app.init.generate_api_stubs(["user", "token", "cart", "menu", "order", "html"]);
    app.init.generate_templates();
    app.init.interceptFormSubmits();
    app.init.interceptButtonLinks();
    app.init.localStorage();
};

// auto generate the api tool stubs
// this creates app.api.(user,token,cart,menu,order).(get,post,put,delete) etc
app.init.generate_api_stubs = function(paths) {
    paths.forEach(function(path) {
        app.api[path] = {};
    });
    paths.forEach(function(path) {
        app.api[path].post = function(data, cb) {
            return app.api.request(path, data, cb);
        };
    });
    paths.pop(); //html
    paths.forEach(function(path) {
        app.api[path].get = function(params, cb) {
            if (typeof params === 'function') return app.api.request(path, params);
            return app.api.request(path, undefined, {
                method: "GET",
                params: params
            }, cb);
        };
    });
    paths.pop(); //menu
    paths.forEach(function(path) {
        app.api[path].put = function(data, cb) {
            return app.api.request(path, data, {
                method: "PUT"
            }, cb);
        };
    });
    paths.forEach(function(path) {
        app.api[path].delete = function(params, cb) {
            if (typeof params === 'function') return app.api.request(path, undefined, {
                method: "DELETE"
            }, params);
            return app.api.request(path, undefined, {
                method: "DELETE",
                params: params
            }, cb);
        };
    });
};


app.before_template={};

var define_element_event = function (eventName) {
   var trigger = "on_"+eventName;  
   app[trigger]={};
   app[trigger]._generic = function (formData, element,formId,cb) {
       if (typeof formId==='string') {
           
           var evFn;
           if ( (evFn = app.prefix_detect(formId,app[trigger]._generic.prefixes)) ) {
               return evFn(formData,element,cb);
           }
           
       }
   };
   app[trigger]._generic.prefixes={};
};

["change","input"].forEach(define_element_event);


app.prefix_detect=function(formId,prefixes){
    var frm_keys = Object.keys(prefixes);
    for(var i = 0; i < frm_keys.length; i++) {
         var formPrefix = frm_keys[i];
         if (formId.substr(0,formPrefix.length)===formPrefix) {
            return prefixes[ formPrefix ];
        }
    }    
    return false;
};

app.before_submit={}; 
app.before_submit._generic = function (payload, formId,cb) {
    

    if (typeof formId==='string') {
        var evFn;
        if ( (evFn = app.prefix_detect(formId,app.before_submit._generic.prefixes)) ) {
            return evFn(payload,cb);
        }
    }
    return cb(payload);
};
app.before_submit._generic.prefixes={};

app.after_submit={};
app.after_submit._generic = function (responsePayload , payload, formId) {
    

    if (typeof formId==='string') {
        var evFn;
        if ( (evFn = app.prefix_detect(formId,app.after_submit._generic.prefixes)) ) {
            return evFn(responsePayload , payload, formId );
        }
    }

};
app.after_submit._generic.prefixes={};

// auto generate the template generators
app.init.generate_templates = function() {

    app.templates = {};
    var templateCache = {};
    var header_template_;
    var title_template_;

    var extract_title = function(html) {
        // search within html for <title></title> pattern

        var scan = html.toLowerCase();
        var pos = scan.indexOf("<title");
        if (pos >= 0) {

            while (scan.charAt(pos) !== '>') pos++;

            scan = scan.substr(++pos);
            html = html.substr(pos);
            pos = scan.indexOf("</title");
            if (pos >= 0) {
                return html.substr(0, pos);
            }
        }
        return false;
    };

    var get_title_template = function(cb) {
        // on first call, hit server for the _header html chunk, and extract title format from it.
        // on subsequent calls return the cached title format.
        if (title_template_ === undefined) {
            return app.api.html.post({
                formId: "_header",
                variables: {}
            },

            function(code, data) {
                if (code == 200) {
                    header_template_ = data.rawHtml;
                    title_template_ = extract_title(header_template_);
                    return cb(title_template_);
                } else {
                    return cb(false);
                }
            });
        }

        return cb(title_template_);
    };

    var exit_200 = function(formId, pageInfo, cb) {

        // replace the page contents with newly rendered html 
        document.querySelector("div.content").innerHTML = pageInfo.cookedHtml;
        
        // save the formId for future record
        app.config.appState = formId;

        // get the template for the document title from the header template
        get_title_template(function(title_temp) {

            // render the document title using variables from page
            
            app.helpers.mergeVariables(title_temp, pageInfo.variables, '', function(title) {

                // set the document title
                document.title = title;

                app.init.interceptFormSubmits();

                if (typeof cb === 'function') {
                    cb(200, pageInfo.cookedHtml, pageInfo);
                }

            });

        });

    };

    var exit_err = function(code, err, cb) {
        if (typeof cb === 'function') {
            cb(code, {
                Error: err
            });
        }
    };

    var make_template = function(
        link_path, defFormId,
        before_template,
        browser_variables,
        after_template,
        forms,
        form_prefixes) {
        

        var i,x,ev,frm,eventNames=["before_submit","on_change","on_input","after_submit"];
        if (forms) {
            
            for(i = 0; i < forms.length; i++) {
                frm = forms[i];
                for(x = 0; x < eventNames.length; x++) {
                    ev = eventNames[x];
                    if (frm[ev]) {
                       app[ev][frm.id] = frm[ev];
                    }
                }
            }
        }
        
        if (form_prefixes) {
            var prefixes=Object.keys(form_prefixes);
            for(i = 0; i < prefixes.length; i++) {
                var prefix = prefixes[i];
                frm = form_prefixes[prefix];
                
                
                for(x = 0; x < eventNames.length; x++) {
                    ev = eventNames[x];
                    if (frm[ev]) {
                       app[ev][frm.id] = frm[ev];
                       app[ev]._generic.prefixes[prefix] = frm[ev];
                    }
                }
                
            }
        }
        
        if (before_template){
            app.before_template[link_path]=before_template;
        }

        if (typeof browser_variables === 'function') {

            app.templates[link_path] = function(variables, cb) {

                switch (typeof variables) {
                    case  'function' : 
                       cb = variables;
                       variables = {};
                       break;
                    case 'undefined' :
                        variables = {};
                }
                
                var cb_after_template=cb;
                if (typeof after_template === 'function') {   
                    cb_after_template = function (code, html, info) {
                        after_template(code, html, info);
                        if (typeof cb==='function') {
                            cb(code, html, info);
                        }
                    }; 
                }
                
                var loadTemplatePage = function (pageInfo){
                    browser_variables(pageInfo.variables, function(variables) {
                        app.helpers.mergeVariables(pageInfo.rawHtml, variables, '', function(html) {

                            exit_200(
                                defFormId, 
                                {
                                    rawHtml:    pageInfo.rawHtml,
                                    cookedHtml: html,
                                    variables:  variables
                                }, 
                                cb_after_template 
                            );

                        });
                    });
                };
                
                var proceedWithTemplate=function(){
    
                    if (templateCache[link_path]) {
                        return loadTemplatePage(templateCache[link_path]);
                    } else {
    
                        return app.api.html.post({
                            formId:      defFormId,
                            variables:   variables,
                            link_path:   link_path
                        },
    
                        function(code, pageInfo) {
                            if (code == 200) {
                                templateCache[link_path] = pageInfo;
                                return loadTemplatePage (pageInfo);
    
                            } else {
                                if ([403, 401].indexOf(code) >= 0) {
                                    // log the user out
                                    app.logout("session/create");
    
                                } else {
                                    exit_err(code, "error: http error " + code, cb);
                                }
                            }
                        });
    
                    }
                
                };

                if (typeof before_template === 'function') {
                    before_template(proceedWithTemplate);
                } else {
                    proceedWithTemplate();
                }


            };

        } else {

            app.templates[link_path] = function(variables, cb) {

                switch (typeof variables) {
                    case  'function' : 
                       cb = variables;
                       variables = {};
                       break;
                    case 'undefined' :
                        variables = {};
                }
                
                var cb_after_template=cb;
                if (typeof after_template === 'function') {   
                    cb_after_template = function (code, html, info) {
                        after_template(code, html, info);
                        if (typeof cb==='function') {
                            cb(code, html, info);
                        }
                    };
                }

                var proceedWithTemplate=function(){
                    if (templateCache[link_path]) {
    
                        if (variables) variables["meta.handler"] = link_path;
                        app.helpers.mergeVariables(templateCache[link_path].rawHtml, variables, '', function(html) {
    
                            exit_200(defFormId, {
                                cookedHtml: html,
                                variables: templateCache[link_path].variables
                            }, cb_after_template);
    
                        });
    
                    } else {
    
                        return app.api.html.post({
                            formId:     defFormId,
                            variables:  variables,
                            link_path:  link_path
                        },
    
                        function(code, pageInfo) {
                            if (code == 200) {
                                templateCache[link_path] = pageInfo;
                                exit_200(defFormId, pageInfo, cb_after_template);
                            } else {
                                if ([403, 401].indexOf(code) >= 0) {
                                    // log the user out
                                    app.logout("session/create");
    
                                } else {
                                    exit_err(code, "error: http error " + code, cb_after_template);
                                }
                            }
                        });
    
                    }
                };
                
                if (typeof before_template === 'function') {
                    before_template(proceedWithTemplate);
                } else {
                    proceedWithTemplate();
                }
                
            };

        }

    };
    
    app.clearTemplateCache = function(formId){
        if (templateCache[formId]) delete templateCache[formId];  
    };

    app.make_page_templates(make_template);
    
};




// app.interceptFormSubmits attaches a generic callback to prevent default form submit
// and use our own javascript AJAX style submit without losing current browser page.
app.init.interceptFormSubmits = function() {

    var onFormSubmit = function(e) {

        // Stop the form from submitting
        e.preventDefault();

        // pull in formId,path & method from form object.
        var formId = this.getAttribute("id"),
            path   = app.helpers.resolve_uri(this.action),
            method = this.method.toLowerCase();
        var formData = app.helpers.getFormData(formId);  
        
        var proceedWithSubmit = function (data){
            
            if (data) {
                app.helpers.setFormData(formId,data);
            }

            // Hide any messages currently shown due to a previous error.
            var frmEls={};
            ["formError", "formSuccess"].forEach(function(el) {
                frmEls[el]=document.querySelector("#" + formId + " ." + el);
                if (frmEls[el]) {
                    frmEls[el].style.display = 'none';
                }
            });
            frmEls.formBusy = document.querySelector("#" + formId + " .formBusy");
            
            if (frmEls.formBusy) {
                frmEls.formBusy.style.visibility = "visible";
            }
            // submit the form data using API
            app.submitFormData(
                formId,
                app.helpers.resolve_uri(path).substr(4),
                method,
        
                function(code, responsePayload, payload) {
        
                    if (frmEls.formBusy) {
                        frmEls.formBusy.style.visibility = "hidden";
                    }
                    // Display an error on the form if needed
                    if (code !== 200) {
        
                        // if ([403, 401].indexOf(code) >= 0) {
                        // log the user out
                        //    app.logout("account/deleted");
        
                        //} else {
        
                        // Try to get the error from the api, or set a default error message
                        var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';
        
                        if(frmEls.formError) {
                            // Set the formError field with the error text
                            frmEls.formError.innerHTML = error;
        
                            // Show (unhide) the form error field on the form
                            frmEls.formError.style.display = 'block';
                        }
                        //}
                    } else {
                        if(frmEls.formSuccess) {
                            frmEls.formSuccess.style.display = 'block';
                        }
                        // If successful, send to form response processor
                        var processor = app.after_submit[formId] || app.after_submit._generic;
                        processor(responsePayload, payload, formId);
        
                    }
                }
            );
        };
        
        if (app.before_submit[formId]){
            app.before_submit[formId]( formData, proceedWithSubmit);
        } else {
            app.before_submit._generic( formData, formId, proceedWithSubmit);
        }
        
    };

    var captureFormSubmit = function(form) {
        form.addEventListener("submit", onFormSubmit);
    };
    
    var forms = document.querySelectorAll("form");
    
    var capture_element_events =  function (eventName) {
        
        var onElementEvent = function (e) {
            // pull in formId,path & method from form object.
            var formId = this.form.getAttribute("id");
            var formData = app.helpers.getFormData(formId);
            if (app["on_"+eventName][formId]){
                app["on_"+eventName][formId](formData,e.target);
            } else {
                app["on_"+eventName]._generic(formData,e.target,formId);
            } 
           
        };
        
        var captureElementEvent = function(form) {
            var formId = form.getAttribute("id");
            if (app["on_"+eventName][formId] || app.prefix_detect(formId,app["on_"+eventName]._generic.prefixes)){
                var element_keys = Object.keys(form.elements);
                for(var i = 0; i < element_keys.length; i++) {
                    var element_key = element_keys[i];
                    form.elements[element_key].addEventListener(eventName, onElementEvent); 
                }
            }
        };
        
        forms.forEach(captureElementEvent);
    };

    forms.forEach(captureFormSubmit);
    capture_element_events("change");
    capture_element_events("input");

    var unfocussed = true;

    var captureAutoFocus = function(form) {
        var el_keys = Object.keys(form.elements);
        for (var i = 0; i < el_keys.length; i++) {
            var el = form.elements[el_keys[i]];
            if (["text", "password"].indexOf(el.type) >= 0) {
                if (el.autofocus) {
                    el.focus();
                    unfocussed = false;
                    return;
                }
            }
        }
    };

    // dynamically created forms need a helping hand to find focus in life...
    var form_keys = Object.keys(forms);
    for (var i = 0; unfocussed && (i < form_keys.length); i++) {
        var form_key = form_keys[i];
        captureAutoFocus(forms[form_key]);
    }
    
};


// set 
app.init.interceptButtonLinks = function() {
    

    document.addEventListener('click', function (event) {
        
        
        var 
        el = event.target,
        buttonId = el.id,
        uri = el.href ? app.helpers.resolve_uri(el.href) : false,
        clickHandler;
        
        
        if (typeof uri === "string") {   
        
            if (typeof buttonId === "string") {
        
                if (uri === "#") {
                    
                    clickHandler = app.buttons[buttonId] ;
                    if(typeof clickHandler === 'function') {
                        event.preventDefault();
                        clickHandler();
                    }
                    
                    return;
                }
               
                 var templateHandler = app.templates[uri];
                 if (typeof templateHandler === "function") {
                     
                     event.preventDefault();
              
                     templateHandler(function(code, html, info) {
                             
                    });
                   
                 }
            }    
        }
        

    }, false);
    
};

app.init.localStorage = function() {
    var tokenString = localStorage.getItem('token');
    if (typeof(tokenString) == 'string') {
        try {
            var token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            if (typeof(token) == 'object') {
                if (token.id) {
                    // attempt to extend token
                    app.api.token.put({
                        token: token.id
                    }, function(code, token) {
                        if (code == 200) {
                            // session extended ok - must be logged in
                            app.config.sessionToken = token;
                            app.setLoggedInClass(true);
                        } else {
                            // session extend faild - can't have been logged in, or has expired
                            app.config.sessionToken.id = false;
                            app.setLoggedInClass(false);
                        }
                        var tokenString = JSON.stringify(app.config.sessionToken);
                        localStorage.setItem('token', tokenString);
                    });

                } else {
                    // been logged in before, but not anymore
                    app.setLoggedInClass(false);
                    app.templates["session/create"]({
                        email: token.email
                    });
                }
            } else {
                // never been logged in
                app.setLoggedInClass(false);
                app.templates["account/create"]();
            }
        } catch (e) {
            // corrupt or never been logged in
            app.config.sessionToken = false;
            app.setLoggedInClass(false);
        }
    }
};