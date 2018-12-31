/* global app */

app.make_templates= function (make_template) {
    
    // handler stubs - intentionally left "undefined"
    var before_template, browser_variables, after_template,  before_submit, after_submit;
    /*
    make_template("user", "create", "account");
    
    make_template(
        "user|account",    "edit",  
        
        before_template,
        /*browser_variables* / function (vars,cb){ 
            
              // merge users current data in with global vars from server
              
              app.api.user.get(function(code,user){
                  if (code===200) {
                      var user_keys = Object.keys(vars.user);
                      for(var i = 0; i < user_keys.length; i++) {
                          var user_key = user_keys[i];
                          vars["user."+user_key] = vars.user[user_key];
                      }
                  }
               
                  return cb(vars);
              });
        },
        after_template,  
        before_submit, 
        after_submit
    );*/
    
    make_template(
        "user|account", "deleted",
        
        before_template, 
        browser_variables, 
        after_template,  
        before_submit, 
        after_submit
    );
    /*
    make_template(
        "token|session", "create",
        
         before_template, 
         / *browser_variables* /function(vars, cb) {
    
            // merge sessionToken email in with global vars from server
            if (app.config.sessionToken && app.config.sessionToken.email) {
                vars.email = app.config.sessionToken.email;
            }
    
            return cb(vars);
         },
         after_template,  
         before_submit, 
         after_submit
    );
    */
    make_template(
          "token|session", "deleted",
          
          before_template, 
          browser_variables, 
          after_template,  
          before_submit, 
          after_submit);
    
    make_template(
        "menu", "list", 
        
        before_template, 
        /*browser_variables*/function (vars,cb){ 
            app.api.menu.get(function(code,array){
                if (code===200) {
                    vars.menu=array;
                }
               
                return cb(vars);
            });
        },
        after_template,  
        before_submit, 
        after_submit
    );
     
    make_template(
        "menu", "view",
        
        before_template, 
        browser_variables, 
        after_template,  
        before_submit, 
        after_submit);
        
    make_template(
        "menu", "create",
        
        before_template, 
        browser_variables, 
        after_template,  
        before_submit, 
        after_submit);
        
    make_template(
        "menu", "edit",
        
        before_template, 
        browser_variables, 
        after_template,  
        before_submit, 
        after_submit);
    
    make_template(
        "cart", "view", 
        
        // form variable filter (called prior to html render)
        before_template, 
        /*browser_variables*/function (vars,cb){ 
            
            //flatten the cart 
            vars["cart.total"] = vars.cart.total;
            var cart=[];
            
            var item_keys = Object.keys(vars.cart.items);
            for(var i = 0; i < item_keys.length; i++) {
                var item_key = item_keys[i];
                var item = vars.cart.items[item_key];
                item.id = item_key; 
                cart.push(item);
            }
            vars.cart = cart;
            
            cb(vars);
            
        },
        after_template,  
        before_submit, 
        after_submit
    );
    
    make_template(
        "cart", "checkout",
        
        before_template, 
        browser_variables, 
        after_template,  
        before_submit, 
        after_submit
    );
    
    make_template(
        "order", "complete",
        
        before_template, 
        browser_variables, 
        after_template,  
        before_submit, 
        after_submit);
    
    make_template(
        "order", "failed",
        
        before_template, 
        browser_variables, 
        after_template,  
        before_submit, 
        after_submit);
        
    make_template(
        "order", "list",
        
        before_template, 
        browser_variables, 
        after_template,  
        before_submit, 
        after_submit);
        
    make_template(
        "order", "view",
        
        before_template, 
        browser_variables, 
        after_template,  
        before_submit, 
        after_submit);

};


/*

  form button click callbacks

*/

app.after_submit={};

app.before_template={}; 
app.browser_variables={}; 
app.after_template={};  
app.before_submit={}; 
app.after_submit={};

app.buttons = {};

// invoked after the account/create page has been loaded dynamically into the contents div
/*
app.buttons["account/create"] = function(){
   console.log(arguments);
};
*/

// invoked after the session/create page has been loaded dynamically into the contents div
/*
app.buttons["session/create"] = function(){
    console.log(arguments);
};
*/

// invoked after the menu/list page has been loaded dynamically into the contents div
app.buttons["menu/list"] = function(){
    console.log(arguments);
};

// invoked after the cart/view page has been loaded dynamically into the contents div
app.buttons["cart/view"] = function(){
    app.clearTemplateCache("cartView");
};

// invoked after the account/edit page has been loaded dynamically into the contents div
/*
app.buttons["account/edit"] = function(){
    app.clearTemplateCache("accountEdit");
};
*/

app.buttons.logoutButton = function(){
    app.logout ();
};

/*

  form after_submit callbacks

*/


app.after_submit._generic = function (responsePayload , payload, formId) {
    
    var prefixRedirects = {
        "cartAdd_"      : "cart/view",
        "cartDelete_"   : "cart/view",
        "cartQuantity_" : "cart/view"
    };
    if (typeof formId==='string') {
        
        var frm_keys = Object.keys(prefixRedirects);
        for(var i = 0; i < frm_keys.length; i++) {
             var formPrefix = frm_keys[i];
             if (formId.substr(0,formPrefix.length)===formPrefix) {
                return app.template_links[prefixRedirects[formPrefix]]();
            }
        }
        
    }
    
    console.log({
        warning:{
            info:"unhandled app.after_submit",
            responsePayload:responsePayload , 
            payload:payload, 
            formId:formId
        }
    });
};

// invoked after sucessful submit to /account/create 
/*

app.after_submit.accountCreate = function(user) {
   // store the token
   app.setToken(user.token,function(){
      // display the full menu 
      app.template_links["menu/list"]();
   });
};

// invoked after sucessful submit to /session/create  
app.after_submit.sessionCreate = function(token) {
    // store the token
    app.setToken(token,function(){
       // display the full menu 
        app.template_links["menu/list"]();
    });
};

*/

