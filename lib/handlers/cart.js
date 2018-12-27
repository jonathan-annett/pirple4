/*
  File: cart.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handlers for shopping cart
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
and associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


var _data = require('../data');
var helpers = require('../helpers');
var validate = helpers.validate;

// constants to ensure conistent filename spelling throughout
const CART = "cart";
const USER = "user";
const MENU = "menu";

module.exports = function(handlers) {
    
    var codes = handlers.codes;
    
    handlers.cart = {};
    
    handlers.cart.basedir = _data.join(CART);
    
    /**********************************/
    /*** REST API HANDLERS FOR /cart **/
    /**********************************/
    
    
    

    /*
      Common Name:      Get Shopping Cart
      Specification:    "A logged-in user should be able to fill a SHOPPING CART with menu items."
      Code:             handlers.cart.get() in cart.js      
      Endpoint:         GET /cart
      Http Headers:     token: current-token-id
      Responses:
                        200, { items : { <id> : {quantity,price,subtotal,description,image_url}}, total  } 
                        401 - user is not logged in. 
    */
    handlers.cart.get = function(params, cb) {

         handlers.token.authentication.email_and_cart(params,function(email_from_token,cart_id_from_token){
            
            //without a valid "email_from_token" we can't proceed
            if (!email_from_token || !cart_id_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            } 
            
             _data.read(CART,cart_id_from_token, function( err,cart){
                
                if (err){
                    // there was a problem reading the file
                    return cb(codes.not_found_404,err);
                }   
                
                return cb(codes.success_200,cart);
            });
            
         
        });
        

    };


    /*
      Common Name:      Add Menu Item to shopping cart
      Specification:    "A logged-in user should be able to FILL a shopping cart with menu items."
      Code:             handlers.cart.post() in cart.js      
      Endpoint:         POST /cart
      JSON Payload:     { "id" : "PiBhPQWNNSek0U41aO2E" }
                        { "id" : "PiBhPQWNNSek0U41aO2E", "quantity" : 2}
      Http Headers:     token: current-token-id
      Responses:
                        200, { items : { <id> : {quantity,price,subtotal,description,image_url}}, total  } 
                        400 - missing/invalid id, or invalid quantity
                        401 - user is not logged in. 
                        500 - problem reading menu item or writing cart item to disk
    */
    handlers.cart.post = function(params, cb) {
        
        //without a valid "email_from_token" we can't proceed
        handlers.token.authentication.email_and_cart(params,function(email_from_token,cart_id_from_token){
            
            if (!email_from_token|| !cart_id_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            } 
            
            var postData = params.payloadIn;
            // validate the menu item id as per the validation rules
            validate.id (postData,function(item_id){
                
                if (!item_id) {
                    return cb(codes.bad_request_400);
                }
                
                
                // validate the quantity as per the validation rules
                validate.quantity (postData,function(quantity){
                    
                    if (!quantity) {
                        // default quantity is 1 item
                        quantity=1;
                    }
                   
                    // try and read the previous cart file for this session 
                    _data.read(CART,cart_id_from_token, function( err,cart){
                        var WRITE="update";
                        if (err){
                            // there was a problem reading the file, make a new one
                            cart = { items : {}, total : 0 };
                            WRITE="create";
                        }   
                        
                        // read the menu file for the supplied item to look up the price &
                        // and validate the menu item id
                        _data.read(MENU,item_id, function( err,menu){
                            
                            if (err) {
                                return cb(codes.internal_server_error_500, err);
                            }
                            
                            // update/add the menu item to the cart, incrementing the quantity
                            var item = cart.items[item_id] || { quantity : 0 };
                            item.price = menu.price;
                            item.description = menu.description;
                            item.quantity += quantity;
                            item.image_url = menu.image_url;
                            cart.items[item_id]=item;
                            
                            // add up the cart total 
                            cart.total = 0;
                            Object.keys(cart.items).forEach(function(key){
                                var item = cart.items[key];
                                item.subtotal = item.price * item.quantity;
                                cart.total += item.subtotal;
                            });
                            
                            // update the data file for this cart / token
                            _data[WRITE](CART,cart_id_from_token, cart, function( err){
                                if (err) {
                                    return cb(codes.internal_server_error_500, err);
                                }  
                                return cb(codes.success_200,cart);
                            });
                            
                        });

                        
                    });                    
                    
                });  
            });

        });
        

    };


    
    /*
      Common Name:      Update quantity of an item in shopping cart (explicity set quantity rather than just add)
      Specification:    "A logged-in user should be able to FILL a shopping cart with menu items."
      Code:             handlers.cart.post() in cart.js      
      Endpoint:         PUT /cart
      JSON Payload:     { "id" : "PiBhPQWNNSek0U41aO2E", "quantity" : 1}
      Http Headers:     token: current-token-id
      Responses:
                        200, { items : { <id> : {quantity,price,subtotal,description,image_url}}, total  } 
                        400 - missing/invalid id or quantity
                        401 - user is not logged in. 
                        404 - item with that id not in shopping cart
                        500 - problem reading menu item or writing cart item to disk
    */
    handlers.cart.put = function(params, cb) {
        
        //without a valid "email_from_token" we can't proceed
        handlers.token.authentication.email_and_cart(params,function(email_from_token,cart_id_from_token){
            
            if (!email_from_token|| !cart_id_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            } 
            
            var postData = params.payloadIn;
            // validate the menu item id as per the validation rules
            validate.id (postData,function(item_id){
                
                if (item_id===false) {
                    return cb(codes.bad_request_400);
                }
                // validate the quantity as per the validation rules
                validate.quantity (postData,function(quantity){
                    
                    if (!quantity) {
                        // quantity is required for PUT request
                        return cb(codes.bad_request_400);
                    }
                   
                    // try and read the previous cart file for this session 
                    _data.read(CART,cart_id_from_token, function( err,cart){
                        
                        if (err){
                            // there was a problem reading the file
                            return cb(codes.internal_server_error_500, err);
                        }   
                        
                        // read the menu file for the supplied item to look up the price &
                        // and validate the menu item id
                        _data.read(MENU,item_id, function( err,menu){
                            
                            if (err) {
                               return cb(codes.not_found_404,err); 
                            }
                            
                            // retreive the item from the cart
                            var item = cart.items[item_id];
                            
                            if (!item) {
                               return cb(codes.not_found_404,err); 
                            }
                            
                            if (quantity===0) {
                                // delete cart item 
                                delete cart.items[item_id];
                            } else {
                                // update the item quantity 
                                item.quantity = quantity;
                            }
                            
                            // add up the cart total
                            cart.total = 0;
                            Object.keys(cart.items).forEach(function(key){
                                var item = cart.items[key];
                                item.subtotal = item.price * item.quantity;
                                cart.total += item.subtotal;
                            });
                            
                            // update the data file for this cart / token
                            _data.update(CART,cart_id_from_token, cart, function( err){
                                if (err) {
                                    return cb(codes.internal_server_error_500, err);
                                }
                                return cb(codes.success_200,cart);
                            });
                            
                        });

                        
                    });                    
                    
                });  
            });

            
            
         
        });
        

    };

    /*
      Common Name:      Delete Cart Item
      Specification:    "A logged-in user should be able to FILL a shopping cart with menu items."
      Code:             handlers.cart.delete() in cart.js      
      Endpoint:         DELETE /cart?id=PiBhPQWNNSek0U41aO2E
      Http Headers:     token: current-token-id
      Responses:
                        200, { items : { <id> : {quantity,price,subtotal,description,image_url}}, total  } 
                        400 - missing/invalid id
                        401 - user is not logged in. 
                        404 - item with that id not in shopping cart
                        500 - problem reading menu item or writing cart item to disk
    */
    handlers.cart.delete = function(params, cb) {

        //without a valid "email_from_token" we can't proceed
        handlers.token.authentication.email_and_cart(params,function(email_from_token,cart_id_from_token){
            
            if (!email_from_token || !cart_id_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            } 
            
            
            var postData = params.payloadIn;
            // validate the menu item id as per the validation rules
            validate.id (postData,function(item_id){
                
                if (item_id===false) {
                    return cb(codes.bad_request_400);
                }

                // try and read the previous cart file for this session 
                _data.read(CART,cart_id_from_token, function( err,cart){
                    
                    if (err){
                        // there was a problem reading the file
                       return cb(codes.not_found_404,err);
                    }   
                    
                    // retreive the item from the cart
                    var item = cart.items[item_id];
                    
                    if (!item) {
                       return cb(codes.not_found_404,err); 
                    }
                    
                    delete cart.items[item_id];
                   
                    // add up the cart total
                    cart.total = 0;
                    Object.keys(cart.items).forEach(function(key){
                        var item = cart.items[key];
                        item.subtotal = item.price * item.quantity;
                        cart.total += item.subtotal;
                    });
                    
                    // update the data file for this cart / token
                    _data.update(CART,cart_id_from_token, cart, function( err){
                        if (err) {
                            return cb(codes.internal_server_error_500, err);
                        }
                        return cb(codes.success_200,cart);
                    });
                    
                });                    
            });
        });
    };
    
    /***********************************/
    /*** HTML HANDLERS FOR /cart      **/
    /***********************************/
  
    handlers.cart.html = {};
    
    // handler for /cart/view
    handlers.cart.html.view = function(params,cb) {
        
        params.htmlOptions = {
             source : ["templates/_header.html","templates/cartView.html","templates/_footer.html"],
             variables : { 
                 'head.title'   : 'Shopping Cart',
                 'body.class'   : 'cartView',
                 'meta.handler' : 'cart.html.view'
             },
             dataSources : {
                 cart : true
             }
        };

        return handlers.html.template(params,cb);
    
    };
    
    // handler for /cart/checkout
    handlers.cart.html.view = function(params,cb) {
        
        params.htmlOptions = {
             source : ["templates/_header.html","templates/cartCheckout.html","templates/_footer.html"],
             variables : { 
                 'head.title'   : 'Shopping Cart Checkout',
                 'body.class'   : 'cartCheckout',
                 'meta.handler' : 'cart.html.checkout'
             },
             dataSources : {
                 cart : true
             }
        };

        return handlers.html.template(params,cb);
    
    };


};