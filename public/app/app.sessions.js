/* global app */

app.getTokenId=function(cb){
    var token = (typeof app.config.sessionToken === 'object' && app.config.sessionToken.id) ? app.config.sessionToken.id : false;
    return typeof cb==='function' ? cb(token) : token;
};

app.getToken=function(cb){
    var token = (typeof app.config.sessionToken === 'object' && app.config.sessionToken.id) ? app.config.sessionToken : false;
    return typeof cb==='function' ? cb(token) : token;
};

app.setToken=function(token,cb){
    
    app.config.sessionToken = token;
    var tokenString = JSON.stringify(token);
    localStorage.setItem('token',tokenString);
    
    if(typeof(token) == 'object'){
      
      
      app.setLoggedInClass(true);
      var permissions = token.permissions || {};
      delete token.permissions;
      if (permissions) {
          app.permission_keys.forEach(function(k){
              app.setPermissionClass(k, permissions[k]===true);
          });
      }
      
      
    } else {
      
      
      app.setLoggedInClass(false);
      app.permission_keys.forEach(function(k){
          app.setPermissionClass(k, false);
      });
      
      
    }
    
    return app.getToken(cb);
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  if(add){
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Set (or remove) the loggedIn class from the body
app.setPermissionClass = function(perm,add){
  var target = document.querySelector("body");
  if(add){
    target.classList.add("permissions_"+perm);
  } else {
    target.classList.remove("permissions_"+perm);
  }
};

app.showCartButtons = function (disp) {
    app.shoppingCartButton.style.display = ( app.cartCheckoutButton.style.display = disp);
};
