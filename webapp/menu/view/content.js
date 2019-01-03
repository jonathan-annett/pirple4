module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
            variables : { 
                'head.title'   : 'Pizza Menu!',
                'body.class'   : 'menuView'
            }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
            
             return handlers.html.template(params,cb);
        },

        //browser_variables : function (vars,cb){ cb(vars); }

        //after_template : function () { },
         
        forms : [
            { 
                id : "menuListAdd",
                //before_submit : function (formData,cb) { },
                after_submit : function (user) {
                     app.templates["cart/view"]();
                }
            },
            { 
                id : "menuListEdit",
                before_submit : function (formData,cb) {
                    app.templates["menu/edit"](formData);
                },
                //after_submit : function (user) {}
            }
        ]
        
    };
    
    return page;
    
};