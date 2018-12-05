/*
  File: order.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handlers for completed orders (items shopping carts after checkout become orders)
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


var _data = require('../data');
var helpers = require('../helpers');
var validate = helpers.validate;

// constants to ensure conistent filename spelling throughout
const CART = "cart";
const USER = "user";
const ORDER = "order";

module.exports = function(handlers) {
    
    var codes = handlers.codes;
    
    handlers.order = {};
    
    handlers.order.basedir = _data.join(ORDER);
    
    /* handlers.order.post = take shopping cart through checkout to create an order
       
       params.headers.token contains key to session and it's shopping cart 
       post data: (in JSON format)
       {
           "source" : "tok_visa", 
           "amount" : 38.98  // amount must match the amount in the shopping cart.
       }
       
       
       
       returned data (in JSON format)
       {
           items : {
               "PiBhPQWNNSek0U41aO2E" : {
                   quantity : 2,
                   price : 19.99,
                   subtotal : 38.98,
                   description: "Desert Pizza",
                   "image_url":"https://i.imgur.com/WFqSUbe.jpg"
               }
           },
           total : 38.98,
           stripe  : {
                       "id": "ch_1De8rJGD93mPalQAqhY9SX2X",
                       "object": "charge",
                       "amount": 100,
                       "amount_refunded": 0,
                       "application": null,
                       "application_fee": null,
                       "balance_transaction": "txn_1De8rJ2xToAoV8ch85lhpj9O",
                       "captured": false,
                       "created": 1544048925,
                       "currency": "aud",
                       "customer": null,
                       "description": "My First Test Charge (created for API docs)",
                       "destination": null,
                       "dispute": null,
                       "failure_code": null,
                       "failure_message": null,
                       "fraud_details": {
                       },
                       "invoice": null,
                       "livemode": false,
                       "metadata": {
                       },
                       "on_behalf_of": null,
                       "order": null,
                       "outcome": null,
                       "paid": true,
                       "payment_intent": null,
                       "receipt_email": null,
                       "receipt_number": null,
                       "refunded": false,
                       "refunds": {
                         "object": "list",
                         "data": [
                     
                         ],
                         "has_more": false,
                         "total_count": 0,
                         "url": "/v1/charges/ch_1De8rJGD93mPalQAqhY9SX2X/refunds"
                       },
                       "review": null,
                       "shipping": null,
                       "source": {
                         "id": "card_1De7sAGD93mPalQAzUGdvEWM",
                         "object": "card",
                         "address_city": null,
                         "address_country": null,
                         "address_line1": null,
                         "address_line1_check": null,
                         "address_line2": null,
                         "address_state": null,
                         "address_zip": null,
                         "address_zip_check": null,
                         "brand": "Visa",
                         "country": "US",
                         "customer": null,
                         "cvc_check": null,
                         "dynamic_last4": null,
                         "exp_month": 8,
                         "exp_year": 2019,
                         "fingerprint": "3brGbV1fTjRivna7",
                         "funding": "credit",
                         "last4": "4242",
                         "metadata": {
                         },
                         "name": "Jenny Rosen",
                         "tokenization_method": null
                       },
                       "source_transfer": null,
                       "statement_descriptor": null,
                       "status": "succeeded",
                       "transfer_group": null
                     }
       }
    
    */
    handlers.cart.post = function(params, cb) {
        
        //without a valid "email_from_token" we can't proceed
        handlers.token.authentication.email(params,function(email_from_token){
            
            if (!email_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            } 
            
            var cart_id  = params.headers.token;
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
                    _data.read(CART,cart_id, function( err,cart){
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
                            _data[WRITE](CART,cart_id, cart, function( err){
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
    
        get the shopping cart for the current user
        user must be logged (ie the header "token" must contain a valid session token)
        
    */
    handlers.cart.get = function(params, cb) {

         handlers.token.authentication.email(params,function(email_from_token){
            
            //without a valid "email_from_token" we can't proceed
            if (!email_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            } 
            
            var cart_id = params.headers.token;
            
            _data.read(CART,cart_id, function( err,cart){
                
                if (err){
                    // there was a problem reading the file
                    return cb(codes.not_found_404,err);
                }   
                
                return cb(codes.success_200,cart);
            });
            
         
        });
        

    };

  

    /* handlers.cart.put = adjust an existing shopping cart item quantity
       user must be logged (ie the header "token" must contain a valid session token)
       
       put data: (in JSON format)
       {
           id : "PiBhPQWNNSek0U41aO2E", 
           quantity : 1
       }
       returned data (in JSON format)
       {
           items : {
               "PiBhPQWNNSek0U41aO2E" : {
                   quantity : 1,
                   price : 19.99,
                   subtotal : 19.99,
                   description: "Desert Pizza",
                   "image_url":"https://i.imgur.com/WFqSUbe.jpg"
               }
           },
           total : 19.99
       }
    
    */
    handlers.cart.put = function(params, cb) {
        
        //without a valid "email_from_token" we can't proceed
        handlers.token.authentication.email(params,function(email_from_token){
            
            if (!email_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            } 
            
            var cart_id  = params.headers.token;
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
                    _data.read(CART,cart_id, function( err,cart){
                        
                        if (err){
                            // there was a problem reading the file
                           return cb(codes.not_found_404,err);
                        }   
                        
                        // read the menu file for the supplied item to look up the price &
                        // and validate the menu item id
                        _data.read(MENU,item_id, function( err,menu){
                            
                            if (err) {
                                return cb(codes.internal_server_error_500, err);
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
                            _data.update(CART,cart_id, cart, function( err){
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

    /* handlers.cart.delete = delete existing cart item
       user must be logged (ie the header "token" must contain a valid session token)
       
       delete data: (in JSON format)
       {
           id : "PiBhPQWNNSek0U41aO2E"
      }
       returned data (in JSON format)
       {
           items : {
               "PiBhPQWNNSek0U41aO2E" : {
                   quantity : 1,
                   price : 19.99,
                   subtotal : 19.99,
                   description: "Desert Pizza",
                   "image_url":"https://i.imgur.com/WFqSUbe.jpg"
               }
           },
           total : 19.99
       }
    
    */
    handlers.cart.delete = function(params, cb) {

        //without a valid "email_from_token" we can't proceed
        handlers.token.authentication.email(params,function(email_from_token){
            
            if (!email_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            } 
            
            var cart_id  = params.headers.token;
            var postData = params.payloadIn;
            // validate the menu item id as per the validation rules
            validate.id (postData,function(item_id){
                
                if (item_id===false) {
                    return cb(codes.bad_request_400);
                }

                // try and read the previous cart file for this session 
                _data.read(CART,cart_id, function( err,cart){
                    
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
                    _data.update(CART,cart_id, cart, function( err){
                        return cb(codes.success_200,cart);
                    });
                    
                });                    
            });
        });
    };


};