/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  sessionToken : false,
  appState : false
};

[[["public/app/app.api.js"]]];
[[["public/app/app.forms.js"]]];

app.helpers={};
([[["lib/helpers/html_merge.js"]]])(app.helpers);
([[["lib/helpers/validate_forms.js"]]])(app.helpers);
[[["public/app/app.helpers.js"]]];

[[["public/app/app.sessions.js"]]];
[[["virtual/app/app.templates.js"]]];

[[["public/app/app.init.js"]]];

app.logout = function(template,cb){
    // determine what template to load after logging out
    var next_template = app.templates.token.deleted;
    if (typeof template==='function') {
        cb = template;
    } else {
        next_template = app.template_links[template]||next_template;
    }
    
    // determine current login status
    app.getToken(function(tok){
        
        if (tok) {
            // user has logged in at least once
            if (tok.id) {
                // and is probably still logged in
                app.api.token.delete({token:tok.id},function(){
                   
                   tok.id=false;       
                   app.setToken(tok,function(){
                      // display logged out page
                      next_template(cb);
                   });
                   
                });
                
            } else {
                // user is currently logged out
                next_template(cb);
            }
            
        } else {
           // never has logged in - show signup page 
           app.templates.user.create(cb); 
        }
        
    });
};

window.onload=app.init;