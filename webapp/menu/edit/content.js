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
             page.htmlOptions.dataSources.menu = params.payloadIn.id;
             return handlers.html.template(params,cb);
        },

        browser_variables : function (vars,cb){ 
            app.browser_variables["menu/view"](vars,cb) ;
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