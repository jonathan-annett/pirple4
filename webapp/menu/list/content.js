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
            if (app.config.searchResults) {
                vars.menu = app.config.searchResults;
                delete app.config.searchResults;
                return cb(vars);
            }
            app.api.menu.get(function(code,array){
                if (code===200) {
                    vars.menu=array;
                }
               
                return cb(vars);
            });
        },

        //after_template : function () { },
         
         forms : [
             {
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

        }
        
        ,
        
        {
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
              after_submit : function (formData,cb) {
                 app.templates["menu/list"](formData);
              }
         },
         
         {
             id : "menuAddItem",
             before_submit : function (formData,cb) {
                 app.templates["menu/create"](formData);
             }
         },
         
         {
             id : "menuSearch",
             
             on_input : function (formData,element) {
                 
                 if (app.config.searchTimer) {
                     clearTimeout(app.config.searchTimer);
                 }
                 app.config.searchTimer = setTimeout(function(){
                     delete app.config.searchTimer;
                     app.api.menu.get({description:formData.description},function(code,array){
                         var ids = []; 
                         if (array) {
                            array.forEach(function(el){ids.push(el.id)});
                         }
                         var rows = document.getElementById("menuListTable").rows;
                         for(var i = 2; i <rows.childElementCount; i++) {
                             rows[i].hidden = array && ids.indexOf(rows[i].dataset.menuId)<0;
                         }
                         
                     });
                 },500);
             }
             
             
         }
         ], 
         
        
    };
    
    return page;
    
};