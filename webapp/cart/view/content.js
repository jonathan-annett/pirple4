module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
            variables : { 
               'head.title'   : 'Shopping Cart',
               'body.class'   : 'cartView'
            },
            dataSources : {
               cart : true
            }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             
             return handlers.html.template(params,cb);
        },

        //browser_variables : function (vars,cb){ cb(vars); }

        //after_template : function () { },
         
         
         
        //before_submit : function (cb) { cb(); },
         
        after_submit : function (user) {
            app.clearTemplateCache("cartView");
        },
        
        after_submit_redirects : {
            "cartAdd_"      : "cart/view",
            "cartDelete_"   : "cart/view",
            "cartQuantity_" : "cart/view"
        }

        
    };
    
    return page;
    
};