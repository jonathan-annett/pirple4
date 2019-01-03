module.exports = function(app,handlers){
    
    var page = {
        
        path_alias : "",
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
             variables : { 
                 'head.title'   : 'Pizza to Go!',
                 'body.class'   : 'homeIndex'
             }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             
             return handlers.html.template(params,cb);
        },

        //browser_variables : function (vars,cb){ cb(vars); }

        //after_template : function () { },
         
        //forms : []

        
    };
    
    return page;
    
};