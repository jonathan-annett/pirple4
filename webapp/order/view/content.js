module.exports = function(app,handlers){
    
    var page = {
        
        /*
           page.htmlOptions is used by handlers.html when rendering html
        */
        htmlOptions : {
            /* 
               page.htmlOptions.variables
               these are the default static variables used by this page
               they are store in the node.js instance and used by handlers.html.template()
               they are also sent to browser by handlers.html.post() 
            */
            variables : { 
                 'head.title'   : 'Previous Order',
                 'body.class'   : 'orderView'
             },
             dataSources : {
                 order : "tba"
             }
        },
        /*
            page.before_template() - optional
                                   - called to prior to loading a page template DYNAMICALLY
                                   - to prevent the template loading, don't call cb()
        */
        before_template : function (cb) {
            app.clearTemplateCache("order/view");
            cb();
        },
        

        
        
        /*
            page.template() is invoked in node.js to serve rendered html
            
            all other functions in page object (besides page.template) are defined in node.js, 
            but never invoked here. they are instead collated into a virtual javascript file

            (browser code is pre-prepared handlers.load_web_pages() in lib/handlers.js )
            
        */
        template : function(params,cb) {
             params.htmlOptions = page.htmlOptions;
             page.htmlOptions.dataSources.order = params.payloadIn.variables.order_id;
             return handlers.html.template(params,cb);
        },

        /*
            page.browser_variables(vars,cb) - optional
                                     - called in the process of rendering html in the browser
                                     - browser code can call app.api functions to fetch data
                                     - vars (first parameter) is used to define variables for html rendering
                                     - to prevent the template loading, don't call cb()
        */
        browser_variables : function (vars,cb){ 
            app.browser_variables["order/completed"](vars,cb); 
        },

        /* 
            page.after_template(code,payload,pageInfo) 
                    - optional
                    - called to after loading a page template DYNAMICALLY
                    - is called BEFORE calling any inline callback that might have been supplied 
                      in the call to app.templates["whatever/link/path"]()
                    - if code is 200:
                            - payload & pageInfo.cookedHtml is the rendered html
                            - pageInfo.rawHtml is the unrendered html
                            - pageInfo.variables are the variables used to render pageInfo.cookedHtml
                    - if code is other than 200:
                            - payload is an error object
        */
        //after_template : function (code,payload,pageInfo) { },
         
        /*
           page.forms[] is an array of objects describing form hooks for 
           html forms defined in the html served by the page template
           
           each element in the array contains object describing these hooks
           
            each of these object has these fields
            
              - id refers to the html id attribute assigned to a form
                    - eg {id:"someForm"} would refer to  <form id="someForm">...</form>  
                    
              - id_prefix refers to a prefix used to map to any one of multiple forms
                    - eg {id_prefix:"someForm_"} would refer to  
                        <form id="someForm_1">...</form>
                        <form id="someForm_2">...</form>
                        
                        
               - before_submit (formData,cb)
                    - optional
                    - invoked before a form is submitted, giving browser code a chance
                      to validate or veto the submit
                    - formData contains the contents of the form (eg each input element's value atrribute)
                    - cb is a callback used to pass the potentially modified formData
                    - to veto the submit, don't call cb, and do something else instead
                        * in this way forms can be used as button handlers, with no server interaction
                        * before_submit could for example perform any number of api methods
                    - assuming cb is called (or if before_submit is not defined at all), 
                      the form submit is converted to an an ajax submit, honouring the method defined in 
                      as a <input type="hidden" name="_method" value="PUT"/> etc inside the form
                      
               - after_submit (data) 
                    - optional
                    - if a form submit was sucessfull after_submit is called with the payload return
                    
               - on_input (formData,element)
                    - optional
                    - called in real time as form data changes
                    - formData contains all entire form elements
                    - element contains the html element actually being changed
        
                - on_change (formData,element)
                    - optional
                    - called after form data changes
                    - formData contains all entire form elements
                    - element contains the html element that actually changed

        */
        forms : [ {
            
            id : "orderViewReorder",
            before_submit : function (formData) {
                
                app.api.cart.get (function (code,cart){
                    
                    if ( (code===200) && cart && cart.items) {
                        
                        var delete_item_loop = function (i) {
                            var cart_keys = Object.keys(cart.items);
                            if (i>= cart_keys.length) {
                                 app.api.order.get ({order_id:formData.order_id}, function (code,order){
                                     if ( (code===200) && order && order.items) {
                 
                                         var item_keys = Object.keys(order.items);
                                         var copy_item_loop = function (i) {
                                             if (i>= item_keys.length) {
                                                 
                                                 
                                             } else {
                                                 
                                                 var item_id = item_keys[i],
                                                     prev_item = order.items[item_id];
                                          
                                                     app.api.cart.post(
                                                         {id:prev_item.id,quantity:prev_item.quantity},
                                                         function(){
                                                             copy_item_loop(++i);
                                                         }
                                                     );

                                             }
                                         };
                                         
                                         copy_item_loop(0);
                 
                                     }
                                 }); 
                            } else {
                                app.api.cart.delete({id : cart_keys[i]},function(){
                                    delete_item_loop(++i);
                                });
                            }
                        };
                        delete_item_loop(0);
                    }
                    
                });
                
                 
            }
            
        }]

        
    };
    
    return page;
    
};