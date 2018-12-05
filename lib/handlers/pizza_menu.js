/*
  File: pizza_menu.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: REST handlers for pizza menu
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
const MENU = "menu";

module.exports = function(handlers) {
    
    var codes = handlers.codes;
    
    handlers.menu = {};
    
    handlers.menu.basedir = _data.join(MENU);
    
    /*
    
     handlers.menu.get - return array of menu items in JSON format
    
     GET /menu
     
     returns all menu items in the format [{ id, description, price, image_url }, ...]
     
     GET /menu?id=123456
     
     returns menu item 123456 in the format [{ id, description, price, image_url } ]
     
     GET /menu?description=mozerella
     
     returns all menu items containing the word "mozerella" in the description, 
             in the format [{ id, description, price, image_url }, ... ]
     
     
    */
    handlers.menu.get = function(params, cb) {

        var getData = params.queryParams;

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

                validate.description(getData, function(description) {

                    if (description) {
                        // apply a filter based on a simple substring search
                        description = description.toLowerCase().trim();
                        items = items.filter(function(x) {
                            return x.description.toLowerCase().indexOf(description) >= 0;
                        });

                    }

                    return cb(codes.success_200, items);

                });

            });
            
        }

    };

    // handlers.menu.post = create NEW menu item
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
                    item.id = helpers.randomString(validate.id_length,handlers.menu.basedir);
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

    handlers.menu.put = function(params, cb) {

        handlers.token.authentication.permissions(params, function(permissions) {

            if (!permissions || !permissions.edit_menu) {
                return cb(codes.unauthorized_401);
            }

            var putData = params.payloadIn;

            if (!putData.id) {
                return cb(codes.bad_request_400);
            }


            // see if a file exists for this menu item id
            _data.read(MENU, putData.id, function(err, item) {

                if (err) {
                    // there was a problem reading the file
                    return cb(codes.not_found_404, err);
                }

                // now check update is valid as per rules laid out in validate helper
                validate.update_menu_item(putData, item, function(updated) {

                    if (updated) {
                        // update file and notify caller
                        _data.update(MENU, item.id, updated, function() {
                            cb(codes.success_200, updated);
                        });

                    } else {
                        return cb(codes.internal_server_error_500, err);
                    }

                });

            });

        });

    };

    // handlers.menu.delete = delete existing menu item by menu id
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

                _data.delete(MENU, item.id, function(err, user) {

                    if (err) {
                        return cb(codes.internal_server_error_500, err);
                    }

                    return cb(codes.success_204);
                });

            });
        });
    };


};