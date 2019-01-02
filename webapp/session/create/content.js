module.exports = function(app,handlers){
    
    var page = {
        
        // before navigating to session/create, in response to user clicking on the menu
        // before_template() is called, in the browser context
        // note that this DOES NOT GET CALLED if the user navigates to session/create in the nav bar
        // before_template() will however be called when a page is displayed using app.template()
        before_template : function (cb) { cb(); },
        
        // htmlOptions is used when rendering html from content.html
        htmlOptions : {
            variables : { 
                'head.title'       : 'Login to your account.',
                'head.description' : 'Please enter your email and password to access your account.',
                'body.class'       : 'sessionCreate'
            }
        },
        
        // template() is invoked in node in response to GET /session/create
        // used to serve pre-populated html to the html
        template : function(params,cb) {
           
             params.htmlOptions = page.htmlOptions;
             return handlers.html.template(params,cb);
        },
        
    
        // browser_variables is invoked in browser context 
        // used to filter variables prior to local rendering of html content
        browser_variables : function (vars,cb){ 
                             
               // merge users current data in with global vars from server
               
               // merge sessionToken email in with global vars from server
               if (app.config.sessionToken && app.config.sessionToken.email) {
                   vars.email = app.config.sessionToken.email;
               }
       
               return cb(vars);
               
         },
         
         // after the html has been rendered and displayed, after_template() is called
         after_template : function () {
             
         },
         
         
         forms : [{
             // when a user initiates a form submit on one of the forms defined in content.html
             // before_submit will be called. if you want to abort the submit, don't call cb()
             // this can therefore be user to update UI and or validate form input
             before_submit : function (cb) {
                 cb();
             },
             
             // it is expected the form will use one of the api functions, and return a value
             
        
            // once submitted to server, returned content is passed to after_submit
            after_submit : function (token) {
                // store the token
                app.setToken(token,function(){
                   // display the full menu 
                    app.templates["menu/list"]();
                });
            }
        }]
        
    };
    
    return page;
    
};