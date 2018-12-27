/*
  File: router.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: routes methods to handlers
  Used By: helpers
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var router = module.exports = {};
    //this file has some app dependancies
var handlers = require('./handlers');



// define router.method.pathname to define specfic method handlers
// generic method handlers can be created using router.ALL.pathname 

router.post = {
    'api/user'  : handlers.user.post,    // create a new user account
    'api/token' : handlers.token.post,   // create a new session token (login)
    'api/cart'  : handlers.cart.post,    // add item to cart
    'api/menu'  : handlers.menu.post,    // requires permisions.edit_menu in user's profile
    'api/order' : handlers.order.post,   // create an order by paying for contents of cart
    "api/html"  : handlers.html.post     // post variables from clientside, get back rendered html & template
    };

router.get = {
    "api/user"  : handlers.user.get,
    "api/token" : handlers.token.get,
    "api/cart"  : handlers.cart.get,
    "api/menu"  : handlers.menu.get,
    "api/order" : handlers.order.get,
    
    
    ""        : handlers.home.html.index,

    "public/*": function(params,cb) {
       return handlers.static.get(params,cb);
    },
    
    "home/index"      : handlers.home.html.index,

    
    "account/create"  : handlers.user.html.create,
    
    "account/edit"    : handlers.user.html.create,
    
    "account/deleted" : handlers.user.html.deleted,
    
    "session/create"  : handlers.token.html.create,
    
    "session/deleted" : handlers.token.html.deleted,
    
    // show list of menu items, possibly filtered
    "menu/list"       : handlers.menu.html.list,
    
    // view a specific menu item, "fullscreen"
    "menu/view" : handlers.menu.html.view,
    
    // create a new menu item
    "menu/create" : handlers.menu.html.create,
     
    // edit an existing menu item
    "menu/edit" : handlers.menu.html.edit,
    
    // view the shopping cart
    "cart/view" : handlers.cart.html.view,
    
    // enter card details to make payment
    "cart/checkout" : handlers.cart.html.checkout,
    
    
    // order complete - payment suceeded
    "order/complete" : handlers.order.html.complete,
    
    // order failed - payment failed
    "order/failed" : handlers.order.html.failed,
    
    // display summary of previous orders
    "order/list" : handlers.order.html.list,
    
    // view details of a previous order
    "order/view" : handlers.order.html.view


};

// invoke factory function to return a generic get_() data store
// we end up with a function that first checks router.get then scans for wildcards
    
router.get_ = (function() {
    
    var partials = {};// partial keys (ie wildcards) will end up in here
    
    // move any keys ending in "/*"  from router.get to partials 
    Object.keys(router.get).forEach(function(key){
       var partial = key.split("/");
       if (partial.pop() === "*") {
           partials[partial.join("/")] = router.get[key];
           delete router.get[key];
       }
    });
    
    
    // for quick future iteration, save the partial keynames as an array
    var partial_keys = Object.keys(partials);
    
    // return a composite function that first checks router.get then scans partials
    return function(path) {
       var result = router.get[path];
       if (result) {
           return result;
       }
       
       // exact match not found - time to scan wildcard paths
       
       for(var i = 0; i < partial_keys.length; i++) {
           var partial_key = partial_keys[i];
            if (partial_key===path.substr(0,partial_key.length)) {
               // eureeka
               return partials[partial_key];
           }
       }
       
       
       return undefined;
       
    };
    
})();

router.put = {
    'api/user' : handlers.user.put,
    'api/token' : handlers.token.put,
    'api/cart'  : handlers.cart.put,
    'api/menu'  : handlers.menu.put      // requires permisions.edit_menu in user's profile
    //order - can't be put
};

router.delete = {
    'api/user' : handlers.user.delete,
    'api/token' : handlers.token.delete,
    'api/cart'  : handlers.cart.delete,
    'api/menu'  : handlers.menu.delete    // requires permisions.edit_menu in user's profile
    //order - can't be deleted
};


// generic method handler in here need to check method to determine what they are actually doing.
router.ALL = {
    echo : handlers.echo
};

