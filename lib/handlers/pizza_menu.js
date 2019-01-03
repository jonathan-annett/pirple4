/*
  File: pizza_menu.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handlers for pizza menu
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
const MENU = "menu";
const HTML = "html";

module.exports = function(handlers) {
    
    var codes = handlers.codes;
    
    handlers.menu = {};
    
    handlers.menu.basedir = _data.join(MENU);
    
    
    /**********************************/
    /*** REST API HANDLERS FOR /menu **/
    /**********************************/
    
    
    

    /*
      Common Name:      Get Menu Items
      Specification:    "When a user is logged in, they should be able to GET all the possible menu items..."
      Code:             handlers.menu.get() in menu.js      
      Endpoint:         GET /menu
                        GET /menu?id=123456
                        GET /menu?description=mozerella
      Http Headers:     token: current-token-id
      Responses:
                        200, [{ id, description, price, image_url }, ... ] - list of one or more items
                        200, [] - an empty array can mean no menu items exist, or the search term was not found
                        404 - menu id does not correspond to a menu item file 
                        401 - user is not logged in. 
    */
    handlers.menu.get = function(params, cb) {
        var getData = params.queryParams;
        
        // user needs to be logged in. simplest way to confirm this is get the email and cart_id
        // using the token handler's authentication tools 
        handlers.token.authentication.email_and_cart(params,function(email_from_token,cart_id){
              
            if (!email_from_token || !cart_id) {
                return cb(codes.unauthorized_401);
            } 
            
            if (getData.id) {
    
                // see if a file exists for this menu item id
                _data.read(MENU, getData.id, function(err, item) {
    
                    if (err) {
                        // there was a problem reading the file
                        return cb(codes.not_found_404, err);
                    }
    
                    return cb(codes.success_200, [item]);
    
                });
    
            } else {
    
                _data.list(MENU, {
                    preload: true,
                    flatten: true
                }, function(err, items) {
    
                    if (err || !items) {
                        // there was a problem reading the file list
                        return cb(codes.not_found_404, err);
                    }
    
                    // test for presence of description search term 
                    validate.description(getData, function(description) {
    
                        if (description) {
                            // apply a filter based on a simple substring search of description field
                            description = description.toLowerCase().trim();
                            items = items.filter(function(x) {
                                return x.description.toLowerCase().indexOf(description) >= 0;
                            });
    
                        }
    
                        // return the filtered/unfiltered items array
                        return cb(codes.success_200, items);
    
                    });
    
                });
                
            }
       
       
        });

        

    };

    /*
      Common Name:      Create NEW menu item
      Specification:    *not specified in assignment, but deemed necessary to implement test data 
      Code:             handlers.menu.post() in menu.js      
      Endpoint:         POST /menu
      JSON Payload:     {description,image_url,price}
      Http Headers:     token: current-token-id of a user with edit_menu permission
      Responses:
                        200, { id, description, price, image_url }
                        400 - missing or invalid description, image_url, price
                        401 - user with edit_menu permissions is not logged in. 
                        500 - couldn't create the menu item
    */
    handlers.menu.post = function(params, cb) {

        // first check the current user has a valid permission token to edit the menu
        handlers.token.authentication.permissions(params, function(permissions) {

            if (!permissions || !permissions.edit_menu) {
                return cb(codes.unauthorized_401);
            }
            
            // now ensure the posted data contains valid menu items
            var postData = params.payloadIn;
            validate.new_menu_item(postData, function(item) {
                
                if (!item) {
                    
                    return cb(codes.bad_request_400, {
                        error:"could not save menu item"
                    });
                    
                }
                
                _data.make_path(MENU,function(){

                    // create a new id for this menu item
                    item.id = helpers.randomString(validate.menu_id_length,handlers.menu.basedir);
                    if (!item.id) {
                        
                        return cb(codes.internal_server_error_500, {
                            error:"could not generate id for menu item",
                            basedir : handlers.menu.basedir
                        });
                        
                    }
                    // write the new item to disk
                    _data.create(MENU, item.id, item, function(err) {
                        if (err) {
                            return cb(codes.internal_server_error_500, err);
                        }
                        return cb(codes.success_200, item);
                    });
                
                });


            });
            
        });

    };
    
    /*
      Common Name:      update menu item
      Specification:    *not specified in assignment, but deemed necessary to implement test data
      Code:             handlers.menu.post() in menu.js      
      Endpoint:         PUT /menu
      JSON Payload:     {id,description,image_url,price}
      Http Headers:     token: current-token-id of a user with edit_menu permission
      Responses:
                        200, { id, description, price, image_url }
                        400 - missing or invalid description, image_url, price
                        401 - user with edit_menu permissions is not logged in.
                        404 - menu item does not exist
                        500 - couldn't update the menu item
    */ 
    handlers.menu.put = function(params, cb) {

        handlers.token.authentication.permissions(params, function(permissions) {

            if (!permissions || !permissions.edit_menu) {
                return cb(codes.unauthorized_401);
            }

            var putData = params.payloadIn;

            if (!putData.id) {
                return cb(codes.bad_request_400,{Error : "Could not locate menu.id"});
            }


            // see if a file exists for this menu item id
            _data.read(MENU, putData.id, function(err, item) {

                if (err) {
                    // there was a problem reading the file
                    return cb(codes.not_found_404, err);
                }

                // now check update is valid as per rules laid out in validate helper
                validate.update_menu_item(putData, item, function(updated) {

                    if (!updated) {
                         return cb(codes.bad_request_400,{Error : "Could not update menu filw"});
                    }
                    
                    // update file and notify caller
                    _data.update(MENU, item.id, updated, function() {
                        return cb(codes.success_200, updated);
                    });

                     
                });

            });

        });

    };

    /*
      Common Name:      Delete Menu Item
      Specification:    *not specified in assignment, but deemed necessary to implement test data 
      Code:             handlers.menu.delete() in menu.js      
      Endpoint:         DELETE /menu?id=123456
      Http Headers:     token: current-token-id of a user with edit_menu permission
      Responses:
                        204 - item deleted 
                        404 - menu id does not correspond to a menu item file
                        400 - no id specified
                        401 - user with edit_menu permissions is not logged in.
    */
    handlers.menu.delete = function(params, cb) {

        // first check the current user has a valid permission token to edit the menu
        
        handlers.token.authentication.permissions(params, function(permissions) {

            if (!permissions || !permissions.edit_menu) {
                return cb(codes.unauthorized_401);
            }

            var deleteData = params.queryParams;

            if (!deleteData.id) {
                return cb(codes.bad_request_400);
            }

            // see if a file exists for this menu item id
            _data.read(MENU, deleteData.id, function(err, item) {

                if (err) {
                    // there was a problem reading the file
                    return cb(codes.not_found_404, err);
                }

                _data.delete(MENU, item.id, function(err) {

                    if (err) {
                        return cb(codes.internal_server_error_500, err);
                    }

                    return cb(codes.success_204);
                });

            });
        });
    };
    
    /***********************************/
    /*** HTML HANDLERS FOR /menu      **/
    /***********************************/
 /* 
    handlers.menu.html = {};
    
    // handler for /menu/list
    handlers.menu.html.list = function(params,cb) {
        
        params.htmlOptions = {
             source : ["templates/_header.html","templates/menuList.html","templates/_footer.html"],
             variables : { 
                 'head.title'   : 'Pizza Menu!',
                 'body.class'   : 'menuList',
                 'meta.handler' : 'menu.html.list'
             },
             dataSources : {
                 menu : {list:{preload:true,flatten:true}}
             }
         };

        return handlers.html.template(params,cb);
    
    };
    
    // handler for /menu/view
    handlers.menu.html.view = function(params,cb) {
        
        params.htmlOptions = {
             source : ["templates/_header.html","templates/menuView.html","templates/_footer.html"],
             variables : { 
                 'head.title'   : 'Pizza Menu!',
                 'body.class'   : 'menuView',
                 'meta.handler' : 'menu.html.view'
             },
             dataSources : {
                 menu : params.queryParams.id
             }
         };

        return handlers.html.template(params,cb);
    
    };
    
    // handler for /menu/create
    handlers.menu.html.create = function(params,cb) {
        
        params.htmlOptions = {
             source : ["templates/_header.html","templates/menuCreate.html","templates/_footer.html"],
             variables : { 
                 'head.title'   : 'Create a new menu item',
                 'body.class'   : 'menuCreate',
                 'meta.handler' : 'menu.html.create'
                
             },
             dataSources : {
             },
             requiredPermissions : {
                 edit_menu : true
             }
        };

        return handlers.html.template(params,cb);
    
    };
    
    // handler for /menu/edit
    handlers.menu.html.edit = function(params,cb) {
        
        params.htmlOptions = {
             source : ["templates/_header.html","templates/menuEdit.html","templates/_footer.html"],
             variables : { 
                 'head.title'   : 'Edit the menu item',
                 'body.class'   : 'menuEdit',
                 'meta.handler' : 'menu.html.edit'
             },
             dataSources : {
                 menu : params.queryParams.id
             },
             requiredPermissions : {
                 edit_menu : true
             }
        };

        return handlers.html.template(params,cb);
    
    };
    
  */  

};

