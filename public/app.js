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
app.helpers={};

[[["public/app/app.api.js"]]];
[[["public/app/app.forms.js"]]];


([[["lib/helpers/html_merge.js"]]])(app.helpers);
([[["lib/helpers/validate_forms.js"]]])(app.helpers);
[[["public/app/app.helpers.js"]]];

[[["public/app/app.sessions.js"]]];
[[["virtual/app/app.templates.js"]]];

[[["public/app/app.init.js"]]];

app.logout = function(template,cb){
    // determine what template to load after logging out
    var next_template = app.templates["session/deleted"];
    if (typeof template==='function') {
        cb = template;
    } else {
        if (typeof template === 'string' && typeof app.templates[template] === 'function') {
            next_template = app.templates[template];
        }
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
                      app.setLoggedInClass(false);
                      next_template(cb);
                   });
                   
                });
                
            } else {
                // user is currently logged out
                app.setLoggedInClass(false);
                next_template(cb);
            }
            
        } else {
           // never has logged in - show signup page 
           app.setLoggedInClass(false);
           app.templates["account/create"](); 
        }
        
    });
};

app.buttons = {};

app.buttons.logoutButton = function (){
    app.logout();
};

/*
(function (global) { 

    if(typeof (global) === "undefined") {
        throw new Error("window is undefined");
    }

    var _hash = "!";
    var noBackPlease = function () {
        global.location.href += "#";

        // making sure we have the fruit available for juice (^__^)
        global.setTimeout(function () {
            global.location.href += "!";
        }, 50);
    };

    global.onhashchange = function () {
        if (global.location.hash !== _hash) {
            global.location.hash = _hash;
        }
    };

    global.onload = function () {            
        noBackPlease();

        // disables backspace on page except on input fields and textarea..
        document.body.onkeydown = function (e) {
            var elm = e.target.nodeName.toLowerCase();
            if (e.which === 8 && (elm !== 'input' && elm  !== 'textarea')) {
                e.preventDefault();
            }
            // stopping event bubbling up the DOM tree..
            e.stopPropagation();
        };  
        
        app.init();
    };

})(window);
*/
window.onload = app.init;
