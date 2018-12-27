/*
  File: static.js
  Project: Asignment 3 https://github.com/jonathan-annett/pirple2
  Synopsis: static file handler
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


var _data    = require('../data');
var helpers  = require('../helpers');
var config = require('../config');
var validate = helpers.validate;
var path = require('path');
var fs = require('fs');

var rootdir = path.join(__dirname,'..','..');


helpers.chain=typeof setImmediate==='function' ? setImmediate : function(fn,x){setTimeout(fn,0,x);};

    
module.exports=function(handlers){
    var codes = handlers.codes;
    var history={};
    
    handlers.home={};
    
    /***********************************/
    /*** HTML HANDLERS FOR /cart      **/
    /***********************************/
  
    handlers.home.html = {};
    
    // handler for /
    handlers.home.html.index = function(params,cb) {
        
        
        // check the email address given in the params object
        // matches the one in the token file. if not this request can't be authorized
        handlers.token.authentication.check(params,function(email_from_token){
            
            if (!email_from_token) {
                // the token is invalid, or is for another user, or it has expired
                params.htmlOptions = {
                     source : ["templates/_header.html","templates/index.html","templates/_footer.html"],
                     variables : { 
                         'head.title'   : 'Pizza to Go!',
                         'body.class'   : 'cartView',
                         'meta.handler' : 'home.html.index'
                     },
                     dataSources : {
                         cart : true
                     }
                };
                
                return handlers.html.template(params,cb);
                
            } else {
                
                return handlers.menu.html.list(params,cb);
                
            }
        });

    
    };
    
    
};

