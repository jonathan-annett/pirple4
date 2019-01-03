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
            id_prefix: "menuView_",

             before_submit : function (formData,cb) { 
                 
                app.clearTemplateCache("menuList");
                app.api.menu.get({
                  id:formData.id
                },function(code,menuItem){
                    if (code===200) {
                        app.templates["menu/view"]({menu:menuItem});    
                    }
                });
                
             },

             after_submit: function() {
                app.clearTemplateCache("cartView");
                app.clearTemplateCache("menuList");
                app.templates["cart/view"]();
            }

        },{
             id_prefix: "menuAdd_",
 
             //before_submit : function (formData,cb) { cb(); },
            
 
              after_submit: function() {
                 app.clearTemplateCache("cartView");
                 app.clearTemplateCache("menuList");
                 app.templates["cart/view"]();
             }
 
         },
         { 
             id_prefix : "menuEdit_",
             before_submit : function (formData,cb) {
                 app.templates["menu/edit"](formData);
             },
             //after_submit : function (user) {}
         },
         
         {
              id_prefix : "menuListDelete_",
              before_submit : function (formData,cb) {
                 app.templates["menu/list"](formData);
              }
         },
         
         {
             id : "menuAddItem",
             before_submit : function (formData,cb) {
                 app.templates["menu/create"](formData);
             },
         }], 
         
        
    };
    
    return page;
    
};