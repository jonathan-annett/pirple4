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

        browser_variables :function (vars,cb){ 
           
           //flatten the cart 
           vars["cart.total"] = vars.cart.total;
           var cart=[];
           
           var item_keys = Object.keys(vars.cart.items);
           for(var i = 0; i < item_keys.length; i++) {
               var item_key = item_keys[i];
               var item = vars.cart.items[item_key];
               item.id = item_key; 
               cart.push(item);
           }
           vars.cart = cart;
           
           cb(vars);
           
       },

        //after_template : function () { },
         
        forms: [{
            id_prefix: "cartDelete_",

            //before_submit : function (cb) { cb(); },

              after_submit: function(user) {
                app.clearTemplateCache("cartView");
                app.template_links["cart/view"]();
            }

        }, {
            id_prefix: "cartQuantity_",

            //before_submit : function (cb) { cb(); },

            after_submit: function(user) {
                app.clearTemplateCache("cartView");
                app.template_links["cart/view"]();
            }

        }]

        
    };
    
    return page;
    
};