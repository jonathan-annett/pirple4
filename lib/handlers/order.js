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
var config = require('./config');
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
           "stripe" : "tok_visa", 
       }
       
       OR
       
       {
             "stripe" : {
                number : "4242424242424242", 
                exp_month : "12", 
                exp_year : "2021", 
                cvc : 123 }
             
       }

       returned data (in JSON format)
       {
           order : {
               when : 1544321722771,
               order_id : "abc12345678987654",
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
                           "amount": 3898,
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
           },
           token : {
               id      : "aNewToken234234"
           }
       }
       
       (after successfully placing an order, the existing session token is invalid, 
       and a new session and shopping cart is created)
    
    */
    handlers.order.post = function(params, cb) {
        
        //without a valid "email_from_token" we can't proceed
        handlers.token.authentication.email(params,function(email_from_token){
            
            if (!email_from_token) {
                // the token is invalid, or is for another user, or it has expired
                return cb(codes.unauthorized_401);
            } 
            
            var postData = params.payloadIn;
            
            // if a session has a shopping cart, it's id will be the same as the token
            var cart_id  = params.headers.token;
            _data.read(CART,cart_id, function( err,cart){
                
                if (err){
                    // there was a problem reading the cart data file
                    return cb(codes.not_found_404,err);
                } 
                
                if ( (cart.amount===0) || (cart.items.length===0) ) {
                    // there doesn't appear to be anything in the shopping cart
                    return cb(codes.not_found_404,err);
                }
                
                var stripe_amount = Math.floor(cart.total * config.stripe.currency_multiplier);
                    
                
                // now we have a shopping cart
                // validate the payment method data type using the validation rules
                // (note, does not "validate" the actual payment method, just the data type)
                validate.stripe (postData,function(stripe){
                    
                    if (!stripe) {
                        return cb(codes.bad_request_400);
                    }
                    
                    
                    helpers.stripe.payment(stripe_amount,config.stripe.currency,stripe,function(err,stripe_charge){
                         
                         if (err) {
                             return cb(codes.not_acceptable_406,err);
                         }
                         
                         if (!stripe_charge) {
                            
                            return cb(codes.internal_server_error_500);
                         }
                         
                         // construct the object to save to disk, and return in callback
                         var order = {
                             // create an order id for this (sucessful) order
                             order_id  : helpers.randomString(validate.order_id_length,handlers.order.basedir),
                             // save the returned stripe info into the order.basedir,
                             items  : cart.items,
                             total  : cart.total,
                             stripe : stripe_charge
                         };
                         
                         // write the data to disk
                         _data.create(ORDER, order.order_id, order, function(err) {
                             if (err) {
                                 return cb(codes.internal_server_error_500, err);
                             }
                             
                             
                             
                             return cb(codes.success_200, order);
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
    handlers.order.get = function(params, cb) {

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

  
};