module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
             variables : { 
                 'head.title'   : 'Previous Order',
                 'body.class'   : 'orderView'
             },
             dataSources : {
                 order : "tba"
             }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             page.htmlOptions.dataSources.order = params.queryParams.id;
             return handlers.html.template(params,cb);
        },

        //browser_variables : function (vars,cb){ cb(vars); }

        //after_template : function () { },
         
         
        forms : [{ 
            
            //before_submit : function (formData,cb) { cb(); },
            
             
            after_submit : function (user) {
                
                
            }
            
        }]

        
    };
    
    return page;
    
};