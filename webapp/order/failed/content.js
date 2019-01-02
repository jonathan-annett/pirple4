module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
             variables : { 
                 'head.title'   : 'Payment Failed',
                 'body.class'   : 'orderFailed'
             },
             dataSources : {
                 cart : true
             }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             
             return handlers.html.template(params,cb);
        },

        //browser_variables : function (vars,cb){ cb(vars); }

        //after_template : function () { },
         
        forms : [{ 
         
            //before_submit : function (cb) { cb(); },
             
            after_submit : function (user) {
                
                
            }
        }]
        
    };
    
    return page;
    
};