/*
  File: helpers/stripe.js
  Project: Asignment 3 https://github.com/jonathan-annett/pirple3
  Synopsis: stripe payment processor functions
  Used By:  
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

module.exports = function(lib,url,https,path,querystring,config) {


    lib.stripe = {};
    lib.stripe.charge={};
    
    lib.stripe.charge.list = function (cb) {
        
        /*
        
        curl https://api.stripe.com/v1/charges \
        -u sk_test_4eC39HqLyjWDarjtT1zdp7dc:
        
        */
        
        var url_parts = url.parse(config.stripe.base_url);
        
        var req = https.request({
              hostname: url_parts.hostname,
              port: url_parts.port || 443,
              path: path.posix.join(url_parts.path,'charges'),
              method: 'GET',
              auth : config.stripe.api_key+":"        
        },function(res){
            // Grab the status of the sent request
            var status =  res.statusCode;
            // Callback successfully if the request went through
            if(status == 200 || status == 201){
                lib.getJsonPayload(res,function(payload){
                    if (payload) {
                        //console.log({payload:payload});
                        cb(false,payload);
                    } else {
                        cb('did not get valid json');
                    }
                });
              
            } else {
              cb('Status code returned was '+status);
            }
        });
        
        // Bind to the error event so it doesn't get thrown
        req.on('error',function(e){
          cb(e);
        });
    
        // End the request
        req.end();
        
    }; 
    
    lib.stripe.charge.create = function (amount,currency,source,cb) {
      
      /*
    
      curl https://api.stripe.com/v1/charges \
      -u sk_test_4eC39HqLyjWDarjtT1zdp7dc: \
      -d amount=2000 \
      -d currency=aud \
      -d source=tok_amex \
      -d description="Charge for jenny.rosen@example.com"
      
      */
      
      var stringPayload = querystring.stringify({
         amount    : amount,
         currency  : currency,
         source    : source
      });
    
      var url_parts = url.parse(config.stripe.base_url);
      
      var req = https.request({
            hostname: url_parts.hostname,
            port: url_parts.port || 443,
            path: path.posix.join(url_parts.path,'charges'),
            method: 'POST',
            auth : config.stripe.api_key+":",
            
            headers : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
              }
          },function(res){
          // Grab the status of the sent request
          var status =  res.statusCode;
          // Callback successfully if the request went through
          if(status == 200 || status == 201){
              lib.getJsonPayload(res,function(payload){
                  if (payload) {
                      //console.log({payload:payload});
                      cb(false,payload);
                  } else {
                      cb('did not get valid json');
                  }
              });
            
          } else {
            cb('Status code returned was '+status);
          }
      });
      
      // Bind to the error event so it doesn't get thrown
      req.on('error',function(e){
        cb(e);
      });
    
      // Add the payload
      req.write(stringPayload);
    
      // End the request
      req.end();
        
    };
    
    lib.stripe.charge.retreive = function (charge_id,cb) {
        /*
        curl https://api.stripe.com/v1/charges/ch_1De8rJGD93mPalQAqhY9SX2X \
        -u sk_test_4eC39HqLyjWDarjtT1zdp7dc:
        */
        
        var url_parts = url.parse(config.stripe.base_url);
        
        var req = https.request({
              hostname: url_parts.hostname,
              port: url_parts.port || 443,
              path: path.posix.join(url_parts.path,'charges',charge_id),
              method: 'GET',
              auth : config.stripe.api_key+":"        
        },function(res){
            // Grab the status of the sent request
            var status =  res.statusCode;
            // Callback successfully if the request went through
            if(status == 200 || status == 201){
                lib.getJsonPayload(res,function(payload){
                    if (payload) {
                        //console.log({payload:payload});
                        cb(false,payload);
                    } else {
                        cb('did not get valid json');
                    }
                });
              
            } else {
              cb('Status code returned was '+status);
            }
        });
        
        // Bind to the error event so it doesn't get thrown
        req.on('error',function(e){
          cb(e);
        });
    
        // End the request
        req.end();
        
    }; 
    
    lib.stripe.token = {};
    
    lib.stripe.token.verify = function (token_id,cb) {
        /*
        
        curl https://api.stripe.com/v1/tokens/tok_visa \
        -u sk_test_4eC39HqLyjWDarjtT1zdp7dc:
        
        */
        
        var url_parts = url.parse(config.stripe.base_url);
        
        var req = https.request({
              hostname: url_parts.hostname,
              port: url_parts.port || 443,
              path: path.posix.join(url_parts.path,'tokens',token_id),
              method: 'GET',
              auth : config.stripe.api_key+":"        
        },function(res){
            // Grab the status of the sent request
            var status =  res.statusCode;
            // Callback successfully if the request went through
            if(status == 200 || status == 201){
                lib.getJsonPayload(res,function(payload){
                    if (payload) {
                        //console.log({payload:payload});
                        cb(false,payload);
                    } else {
                        cb('did not get valid json');
                    }
                });
              
            } else {
              cb('Status code returned was '+status);
            }
        });
        
        // Bind to the error event so it doesn't get thrown
        req.on('error',function(e){
          cb(e);
        });
    
        // End the request
        req.end();
    };
    
    lib.stripe.token.create = function (card,cb) {
        /*
        curl https://api.stripe.com/v1/tokens \
        -u sk_test_4eC39HqLyjWDarjtT1zdp7dc: \
        -d card[number]=4242424242424242 \
        -d card[exp_month]=12 \
        -d card[exp_year]=2019 \
        -d card[cvc]=123
        */
        
        // check the supplied card details are "approximately correct"
        // ie the feilds are all there and within sensible ranges
        lib.validate.card(card,function(valid_card){
            
            if (!valid_card) {
               return cb ("invalid card details");   
            }
            
            var stringPayload = /*decodeURIComponent(*/ querystring.stringify({
                "card[number]"     : valid_card.number,
                "card[exp_month]"  : valid_card.exp_month,
                "card[exp_year]"   : valid_card.exp_year,
                "card[cvc]"        : valid_card.cvc
            });
          
            var url_parts = url.parse(config.stripe.base_url);
            
            var req = https.request({
                  hostname: url_parts.hostname,
                  port    : url_parts.port || 443,
                  path    : path.posix.join(url_parts.path,'tokens'),
                  method  : 'POST',
                  auth    : config.stripe.api_key+":",
                  
                  headers : {
                      'Content-Type' : 'application/x-www-form-urlencoded',
                      'Content-Length': Buffer.byteLength(stringPayload)
                    }
                },function(res){
                // Grab the status of the sent request
                var status =  res.statusCode;
                // Callback successfully if the request went through
                if(status == 200 || status == 201){
                    lib.getJsonPayload(res,function(payload){
                        if (payload) {
                            //console.log({payload:payload});
                            cb(false,payload);
                        } else {
                            cb('did not get valid json');
                        }
                    });
                  
                } else {
                    //console.log({stringPayload:stringPayload});
                  cb('Status code returned was '+status);
                }
            });
            
            // Bind to the error event so it doesn't get thrown
            req.on('error',function(e){
              cb(e);
            });
          
            // Add the payload
            req.write(stringPayload);
          
            // End the request
            req.end();      
            
        });
        
        
    };
     
    
    lib.stripe.payment = function(amount,currency,source,cb) {
        
        // worker callback to generate user's cb
        var after_charge = function(err,charge){
          if (err) {
              return cb(err);
          }
          
          if (!charge) {
              return cb("stripe.create_charge returned no data");
          }
          
          if (charge.status==="succeeded") {
              return cb(false,charge); 
          }
          
          return cb ("stripe payment failed",charge);
          
        };
        
        if (typeof source ==='object') {
           // this is an object describing an actual card 
           lib.stripe.token.create(source,function(err,valid_token){
               
               if (err) {
                   return cb(err);
               }
               //console.log("got valid_token:",valid_token);
               
               if (!valid_token && valid_token.type!=='card') {
                   return cb("stripe could not verify token",valid_token);
               }
               
               return lib.stripe.charge.create(amount,currency,valid_token.id,after_charge);
           });
           
        }  else {
            if (typeof source ==='string') {
                // this is either a previously generated token, or a test token
                // run it through the stripe API to validate it's authenticity.
                lib.stripe.token.verify (source,function(err,valid_token){
                    
                   if (err) {
                       return cb(err);
                   }
                   if (!valid_token && valid_token.type!=='card') {
                       return cb("stripe could not verify token",valid_token);
                   }
                   
                   return lib.stripe.charge.create(amount,currency,source,after_charge);
                   
                });
            } else {
                return cb("unexpected source type:"+typeof source);
            }
            
        }
        
    };


};