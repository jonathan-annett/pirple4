module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
            variables : { 
               'head.title'   : 'Shopping Cart',
               'body.class'   : 'cartView' },
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
           
           app.api.cart.get(function(code,cart){
               
               if (code===200 && cart){
                   
                   vars["cart.total"] = cart.total;
                   
                   vars.cart=[];
                   var item_keys = Object.keys(cart.items);
                   for(var i = 0; i < item_keys.length; i++) {
                       var item_key = item_keys[i];
                       var item = cart.items[item_key];
                       item.id = item_key; 
                       vars.cart.push(item);
                   }
                   
                   app.config.cartEmpty = false;

               } else {
                   vars["cart"] = [];
                   vars["cart.total"] = 0;
                   app.config.cartEmpty = true;
               }
            
                cb(vars);
               
           });

           
       },

        //after_template : function () { },
         
        forms: [
            {
                id_prefix: "cartAdd_",
    
                //before_submit : function (formData,cb) { cb(); },
            
    
                 after_submit: function() {
                    app.clearTemplateCache("cartView");
                    app.clearTemplateCache("menuList");
                    app.templates["cart/view"]();
                }
    
            },
            
            {
                id_prefix: "cartSubtract_",
    
                 before_submit : function (formData,cb) { 
                    
                    if (Number(document.getElementById("edit_quantity_"+formData.id).value) >1) {
                        cb(); 
                    }
                    
                },
    
                 after_submit: function() {
                    app.clearTemplateCache("cartView");
                    app.clearTemplateCache("menuList");
                    app.templates["cart/view"]();
                }
    
            },
            
            {
            id_prefix: "cartDelete_",

            //before_submit : function (formData,cb) { cb(); },
            

              after_submit: function(user) {
                app.clearTemplateCache("cartView");
                app.templates["cart/view"]();
            }

        }, {
            
            id_prefix: "cartQuantity_",
            

            //before_submit : function (formData,cb) { cb(); },
            
            on_input : function (formData,element){
                
                var 
                idstr = formData.id,
                proceed = Number(element.value) > 0 || element.value.trim()==='0' ;
                if (proceed) {
                    app.api.cart.put({
                        id : formData.id,
                        quantity : formData.quantity
                    },function(code,cart){
                        if (code===200) {
                            
                            document.getElementById("subtotal_"+idstr).innerHTML=
                                cart.items[idstr].subtotal;
                                
                            
                            document.getElementById("cartViewTotal").innerHTML=
                                cart.total;

                        }
                    });
                }
                
            },

            after_submit: function(user) {
                app.clearTemplateCache("cartView");
                app.templates["cart/view"]();
            }

        },
        {
        
            id: "cartGotoCheckout",

            before_submit : function (formData,cb) { 
                document.getElementById("")
                if (!app.config.cartEmpty) {
                    app.templates["cart/checkout"]();
                }
            },
        
            //after_submit: function() {  }

        }]

        
    };
    
    return page;
    
};