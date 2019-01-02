module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
            variables : { 
                'head.title'   : 'Pizza Menu!',
                'body.class'   : 'menuList'
            },
            dataSources : {
                menu : {list:{preload:true,flatten:true}}
            }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             
             return handlers.html.template(params,cb);
        },

        browser_variables : function (vars,cb){ 
            app.api.menu.get(function(code,array){
                if (code===200) {
                    vars.menu=array;
                }
               
                return cb(vars);
            });
        },

        //after_template : function () { },
         
         forms : [{
            id_prefix: "cartAdd_",

            //before_submit : function (cb) { cb(); },

             after_submit: function() {
                app.clearTemplateCache("cartView");
                app.clearTemplateCache("menuList");
                app.templates["cart/view"]();
            }

        }], 
         
        
    };
    
    return page;
    
};