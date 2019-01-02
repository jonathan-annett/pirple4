module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
            variables : { 
                'head.title'   : 'Pizza Menu!',
                'body.class'   : 'menuView'
            },
            dataSources : {
                menu : "tba"
            }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             page.htmlOptions.dataSources.menu = params.queryParams.id;
             
             return handlers.html.template(params,cb);
        },

        //browser_variables : function (vars,cb){ cb(vars); }

        //after_template : function () { },
         
        forms : [{ 
             
            //before_submit : function (formData,cb) { cb(); },
            
             
            after_submit : function (user) {
                app.templates["cart/view"]();
            }
            
        }]
        
    };
    
    return page;
    
};