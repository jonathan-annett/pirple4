module.exports = function(app,handlers){
    
    var page = {
        
        // before navigating to /account/edit, in response to user clicking on the menu
        // before_template() is called, in the browser context
        // note that this DOES NOT GET CALLED if the user navigates to account/edit in the nav bar
        // before_template() will however be called when a page is displayed using app.template()
        before_template : function (cb) {
            app.clearTemplateCache("accountEdit");
            cb();
        },
        
        // htmlOptions is used when rendering html from content.html
        htmlOptions : {

            variables : { 
                'head.title'       : 'Edit Account Details',
                'body.class'       : 'accountEdit',
                'meta.handler'     : 'user.html.edit'
            },
            
            // specifying dataSources in htmlOptions mandates that this
            // page can only be viewed by an authenticated user
            // this implicitly makes the user record for the current user available, along with any other
            // dataSources defined in here
            dataSources : { }
            
        },
        
        // template() is invoked in node in response to GET /account/create
        // used to serve pre-populated html to the html
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             
             return handlers.html.template(params,cb);
        },
        
    
        // browser_variables is invoked in browser context 
        // used to filter variables prior to local rendering of html content
        browser_variables : function (vars,cb){ 
                             
               // merge users current data in with global vars from server
               
               app.api.user.get(function(code,user){
                   if (code===200) {
                       var user_keys = Object.keys(user);
                       for(var i = 0; i < user_keys.length; i++) {
                           var user_key = user_keys[i];
                           vars["user."+user_key] = user[user_key];
                       }
                   }
                
                   return cb(vars);
               });
         },
         
         // after the html has been rendered and displayed, after_template() is called
         after_template : function () {
             
         },
         
         
         
         // when a user initiates a form submit on one of the forms defined in content.html
         // before_submit will be called. if you want to abort the submit, don't call cb()
         // this can therefore be user to update UI and or validate form input
         before_submit : function (cb) {
             cb();
         },
         
         // it is expected the form will use one of the api functions, and return a value
         
    
        // once submitted to server, returned content is passed to after_submit
        after_submit : function (user) {
            app.clearTemplateCache("accountEdit");
        }

        
    };
    
    return page;
    
};