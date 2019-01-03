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

        browser_variables : function (vars,cb){ 
            app.browser_variables["cart/view"](vars,cb); 
        },

        //after_template : function () { },
         
         
        forms : [{  
            
            before_submit : function (formData,cb) { 
                
                app.helpers.validate.card(formData,function(stripe){
                    if (stripe) {
                        app.api.order.post({stripe:stripe},function(code,order){
                            console.log(order);
                        });
                    }
                });

            },
            
            //after_submit : function () {  }
        }]
    };
    
    return page;
    
};