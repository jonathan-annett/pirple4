module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
             variables : { 
                 'head.title'   : 'Shopping Cart Checkout',
                 'body.class'   : 'cartCheckout'
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
         
         
        forms : [{  
            
            before_submit : function (formData,cb) { 
                
                app.helpers.validate.card(formData,function(card){
                    if (card) {
                        cb();     
                    }
                });

            },
            
            after_submit : function () {
                app.clearTemplateCache("cartCheckout");
            }
        }]
    };
    
    return page;
    
};