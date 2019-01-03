module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
             variables : { 
                 'head.title'   : 'Edit the menu item',
                 'body.class'   : 'menuEdit'
             },
             dataSources : {
                 menu : "tba"
             },
             requiredPermissions : {
                 edit_menu : true
             }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             page.htmlOptions.dataSources.menu = params.payloadIn.variables.id;
             return handlers.html.template(params,cb);
        },

        browser_variables : function (vars,cb){ 
            app.api.menu.get({id : vars.menu.id},function(code,array){
                
                if (code===200) {
                    var menu_keys = Object.keys(array[0]);
                    for(var i = 0; i < menu_keys.length; i++) {
                        var user_key = menu_keys[i];
                        vars["menu."+user_key] = array[0][user_key];
                    }
                    
                }
               
                return cb(vars);
            });
        },

        //after_template : function () { },
         
         
        forms : [{ 
            //before_submit : function (cb) { cb(); },
             
            after_submit : function () {
                app.clearTemplateCache("menuEdit");
            }
            
        }]
        
    };
    
    return page;
    
};