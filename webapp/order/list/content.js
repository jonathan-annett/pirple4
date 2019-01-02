module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
             variables : { 
                 'head.title'   : 'View Previous Orders',
                 'body.class'   : 'orderList',
                 'meta.handler' : 'order.html.list'
             },
             dataSources : {
                 order : {list:{preload:true,flatten:true}}
             }
        },
        
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             
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