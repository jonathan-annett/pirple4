/* global app */

app.make_templates= function (make_template) {
    
    make_template("user", "create", "account");
    
    make_template("user", "edit",   "account", function (vars,cb){ 
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
    });
    
    make_template("user", "deleted", "account");
    
    make_template("token", "create", "session", function (vars,cb){ 
        
        if (app.config.sessionToken && app.config.sessionToken. email) {
            vars.email = app.config.sessionToken.email;
        }
        
        return cb(vars);
    });
    
    make_template("token", "deleted", "session");
    
    make_template("menu", "list", undefined, function (vars,cb){ 
         app.api.menu.get(function(code,array){
             if (code===200) {
                 vars.menu=array;
             }
             return cb(vars);
         });
    });
     
    make_template("menu", "view");
    make_template("menu", "create");
    make_template("menu", "edit");
    
    make_template("cart", "view", undefined, function (vars,cb){ 
        
        vars["cart.total"] = vars.cart.total;
        var item_keys = Object.keys(vars.cart.items);
        var flat=vars["cart[]"]=[];
        for(var i = 0; i < item_keys.length; i++) {
            var item_key = item_keys[i];
            flat.push(vars.cart.items[item_key]);
        }
        delete vars.cart;

        console.log({vars:vars});
        cb(vars);
        
    });
    make_template("cart", "checkout");
    
    make_template("order", "complete");
    
    make_template("order", "failed");
    make_template("order", "list", undefined);
    make_template("order", "view");

};


/*

  form button click callbacks

*/


app.buttons = {};

// invoked after the account/create page has been loaded dynamically into the contents div
app.buttons["account/create"] = function(){
   console.log(arguments);
};

// invoked after the session/create page has been loaded dynamically into the contents div
app.buttons["session/create"] = function(){
    console.log(arguments);
};

// invoked after the menu/list page has been loaded dynamically into the contents div
app.buttons["menu/list"] = function(){
    console.log(arguments);
};

// invoked after the cart/view page has been loaded dynamically into the contents div
app.buttons["cart/view"] = function(){
    console.log(arguments);
};

// invoked after the account/edit page has been loaded dynamically into the contents div
app.buttons["account/edit"] = function(){
    console.log(arguments);
};

app.buttons.logoutButton = function(){
    app.logout ();
};

/*

  form after_submit callbacks

*/

app.after_submit={};
app.after_submit._generic = function (responsePayload , payload, formId) {
    if (typeof formId==='string'&&formId.substr(0,8)==="cartAdd_") {
        return app.template_links["cart/view"]();
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
