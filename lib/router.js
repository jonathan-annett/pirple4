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
    user  : handlers.user.post,
    token : handlers.token.post,
    cart  : handlers.cart.post,
    menu  : handlers.menu.post,    // requires permisions.edit_menu in user's profile
    order : handlers.order.post
    };


router.get = {
    user : handlers.user.get,
    token : handlers.token.get,
    cart  : handlers.cart.get,
    menu  : handlers.menu.get,
    order : handlers.order.get
};

router.put = {
    user : handlers.user.put,
    token : handlers.token.put,
    cart  : handlers.cart.put,
    menu  : handlers.menu.put      // requires permisions.edit_menu in user's profile
    //order - can't be put
};

router.delete = {
    user : handlers.user.delete,
    token : handlers.token.delete,
    cart  : handlers.cart.delete,
    menu  : handlers.menu.delete    // requires permisions.edit_menu in user's profile
    //order - can't be deleted
};


// generic method handler in here need to check method to determine what they are actually doing.
router.ALL = {
    echo : handlers.echo
};

