module.exports = function(app,handlers){
    
    var page = {
        
        // before_template : function (cb) {cb();},
        
        htmlOptions : {
            variables : { 
                'head.title'       : 'Create an Account',
                'head.description' : 'Signup is quick, and is happening right now...',
                'body.class'       : 'accountCreate'            
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
                // store the token
                app.setToken(user.token,function(){
                   // display the full menu 
                   app.template_links["menu/list"]();
                });
            }
        }]
            
    };
    
    return page;
    
};