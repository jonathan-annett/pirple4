module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
             variables : { 
                 'head.title'   : 'Order Complete',
                 'body.class'   : 'orderComplete'
             },
             dataSources : {
                 order : { indirect : "user.orders[-1]" }
             }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             
             return handlers.html.template(params,cb);
        },

        //browser_variables : function (vars,cb){ cb(vars); }

        //after_template : function () { },
         
         
        forms : [{ 
            //before_submit : function (cb) { cb(); },
             
            after_submit : function (user) {
                 app.clearTemplateCache("menuView");
            }
            
        }]

        
    };
    
    return page;
    
};