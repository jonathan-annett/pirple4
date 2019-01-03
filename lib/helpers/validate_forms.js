module.exports = function(helpers) {
    var validate = helpers.validate = {};
    
    const alphas_lower = 'qwertyuiopasdfghjklzxcvbnm';
    const alphas_upper = 'QWERTYUIOPASDFGHJKLZXCVBNM';
    const alphas = alphas_lower + alphas_upper;
    const numerics = '0123456789';
    const numerics2 = '-0123456789.';
    const symbolics = "~!@#$%^&*(){}[]/\\ ";
    const alphanumerics = alphas + numerics;
    const passwordchars = alphanumerics + symbolics;
    const min_passlen = 8;

    const token_length = 20;
    const menu_id_length = 20;
    const order_id_length = 20;
    const description_length = 512; // maximum menu description length
    const stripe_token_length = 64; // maximum stripe token string length

    // in - obj containing email field to validate
    // does:calls cb with eiher false, or the validated email address
    validate.email = function(obj, cb) {
        if (typeof obj === 'object') {

            if (typeof obj.email === 'string') {

                // use regex to see if email "looks ok"
                var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                if (re.test(obj.email)) {

                    var parts = obj.email.split('@');
                    if (parts.length == 2) {


                        return typeof cb === 'function' ? cb(obj.email) : obj.email;
                      
                    }
                }
            }
        }

        return typeof cb === 'function' ? cb(false) : false;

    };

    // returns true if every char of str is within inside
    validate._is_instr = function(str, inside, cb) {

        var result = typeof str === 'string' && typeof inside === 'string' && str.length > 0;

        if (result) {
            for (var i = 0; i < str.length; i++) {
                if (inside.indexOf(str.charAt(i)) < 0) {
                    result = false;
                    break;
                }
            }
        }

        return typeof cb === 'function' ? cb(result) : result;
    };

    // returns true if at least 1 char of str is within inside
    validate._is_instr2 = function(str, inside, cb) {

        var result = false;

        if (typeof str === 'string' && typeof inside === 'string' && str.length > 0) {
            for (var i = 0; i < str.length; i++) {
                if (inside.indexOf(str.charAt(i)) >= 0) {
                    result = true;
                    break;
                }
            }
        }

        return typeof cb === 'function' ? cb(result) : result;
    };

    // true if str is comprised of chars a-z or A-Z
    validate._alpha = function(str, cb) {
        return validate._is_instr(str, alphas, cb);
    };

    // true if str is comprised of chars from 0-9
    validate._numeric = function(str, cb) {
        return validate._is_instr(str, numerics2, cb);
    };

    // true if str is comprised of symbol chars from !@#$%^&*(){}[]/\
    validate._symbols = function(str, cb) {
        return validate._is_instr(str, symbolics, cb);
    };


    // true if str is comprized of 0-9, a-z or A-Z
    validate._alphanumeric = function(str, cb) {
        return validate._is_instr(str, alphanumerics, cb);
    };


    // in - obj containing password field to validate
    // does:calls cb with eiher false, or the validated password
    // valid if obj.password is a string that contains at least 1 lowercase, 1 uppercase, 1 digit and 1 symbol
    // and is at least min_passlen in length

    validate.password = function(obj, cb) {
        var result = false;

        if (typeof obj === 'object') {

            if (typeof obj.password === 'string') {

                if ((obj.password.length >= min_passlen) && validate._is_instr(obj.password, passwordchars) && validate._is_instr2(obj.password, alphas_lower) && validate._is_instr2(obj.password, alphas_upper) && validate._is_instr2(obj.password, numerics) && validate._is_instr2(obj.password, symbolics)) {
                    result = obj.password;
                }
            }
        }

        return (typeof cb === 'function') ? cb(result) : result;
    };

    // must be at least 2 space separated name parts (eg "John Smith" or "John David Smith")
    // first and last name part must be alpha
    // if more than 2 name parts are specified, last name part can be alphanumeric eg "Winston Davies the 3rd" or "John Smith 2"
    validate.name = function(obj, cb) {
        var result = false;

        if (typeof obj === 'object') {

            if (typeof obj.name === 'string') {

                // remove spaces at beginning and end
                var trimmed = obj.name.trim();

                if (trimmed.length > 0) {

                    // remove double spaces inside the name
                    while (trimmed.indexOf('  ') >= 0) {
                        trimmed = trimmed.split('  ').join(' ');
                    }

                    // separate each name
                    var names = trimmed.split(' ');

                    if (names.length == 2) {

                        if (validate._alpha(names[0]) && validate._alpha(names[1])) {
                            result = trimmed;
                        }

                        return typeof cb === 'function' ? cb(result) : result;
                    }

                    if (names.length > 2) {

                        result = trimmed;

                        for (var i = 0; i < names.length; i++) {
                            var nm = names[i];
                            if (!validate[i < names.length - 1 ? '_alpha' : '_alphanumeric'](nm)) {
                                result = false;
                                break;
                            }
                        }
                    }

                }
            }

        }

        return typeof cb === 'function' ? cb(result) : result;
    };

    // basic street address validation:
    // at least 3 terms
    // terms nust be alpha or numeric (not alpha numeric)
    // at least one of the terms must be numeric


    validate.street_address = function(obj, cb) {

        var result = false;

        if (typeof obj === 'object') {

            if (typeof obj.street_address === 'string') {

                // remove spaces at beginning and end
                var trimmed = obj.street_address.trim();

                if (trimmed.length > 0) {

                    // remove double spaces inside the name
                    while (trimmed.indexOf('  ') >= 0) {
                        trimmed = trimmed.split('  ').join(' ');
                    }

                    // separate each name
                    var words = trimmed.split(' ');

                    if (words.length > 2) {

                        for (var i = 0; i < words.length; i++) {
                            var word = words[i];

                            if (validate._numeric(word)) {
                                result = trimmed;
                                continue;
                            }

                            if (validate._alpha(word)) {
                                continue;
                            } else {
                                result = false;
                                break;
                            }
                        }


                    }
                }
            }

        }

        return typeof cb === 'function' ? cb(result) : result;

    };




    // obj = payload from upload request
    // validates name,street_addresss using validation rules
    // calls cb(false) if any aspect of required fields are missing or invalid
    // calls cb() with a new object of cleaned up user input (eg trimmed etc) with just the required fields
    // DOES NOT CHECK IF USER EXISTS IN FILE SYSTEM - caller must do this in the callback
    validate.new_user = function(obj, cb) {


        validate.email(obj, function(email) {

            if (!email) {
                return cb({Error: "invalid email"});
            }
            validate.street_address(obj, function(street_address) {

                if (!street_address) {
                    return cb({Error: "invalid street address"})
                }
                validate.name(obj, function(name) {

                    if (!name) {
                        return cb({Error: "invalid name"})
                    }
                    validate.password(obj, function(password) {

                        if (!password) {
                            return cb({Error: "invalid password"})
                        }
                        return cb(false,{
                            name: name,
                            email: email,
                            street_address: street_address,
                            password: password
                        });

                    });


                });
            });
        });
    };

    // assumes caller has prevalidated the email as belonging to an existing user
    // assumes update contains payload from update request
    // assumes user contains currently stored user data
    // validates that email address matches the existing user data
    // then validates name and street address according to validation rules
    // calls cb(false) if 
    // -- any of the above assumptions prove to be false
    // -- neither street_address or name are supplied in update
    // -- one or other of the required fields are invalid
    // otherwise, upates the user object and calls cb with it
    // DOES NOT INTERACT WITH FILE SYSTEM AT ALL. caller and cb must do that.
    validate.update_user = function(update, user, cb) {

        if (typeof update === 'object' && typeof user === 'object' && typeof update.email === 'string' && update.email === user.email && (update.street_address || update.name || update.password)

        ) {

            validate.street_address(update, function(street_address) {

                if (update.street_address && !street_address) {
                    return cb(false);
                }

                validate.name(update, function(name) {

                    if (update.name && !name) {
                        return cb(false);
                    }

                    validate.password(update, function(password) {

                        if (update.password && !password) {
                            return cb(false);
                        }

                        if (street_address) {
                            user.street_address = street_address;
                        }

                        if (name) {
                            user.name = name;
                        }


                        return cb(user);

                    });



                });

            });

        } else {
            return cb(false);
        }
    };


    validate.token_length = token_length;

    //
    validate.token = function(obj, cb) {

        var result = false;

        if (typeof obj === 'object') {

            if (typeof obj.token === 'string') {

                if (obj.token.length === token_length) {

                    result = obj.token;
                }
            }

        }

        return typeof cb === 'function' ? cb(result) : result;

    };



    // menu fields
    validate.menu_id_length = menu_id_length;
    validate.id = function(obj, cb) {

        var result = false;

        if (typeof obj === 'object') {

            if (typeof obj.id === 'string') {

                if (obj.id.length === menu_id_length) {

                    result = obj.id;
                }
            }

        }

        return typeof cb === 'function' ? cb(result) : result;

    };


    validate.description_length = description_length;
    validate.description = function(obj, cb) {

        var result = false;

        if (typeof obj === 'object') {

            if (typeof obj.description === 'string') {

                if (obj.description.length <= description_length) {

                    result = obj.description;
                }
            }

        }

        return typeof cb === 'function' ? cb(result) : result;

    };

    validate.price = function(obj, cb) {
        var result = false;
        if (typeof obj === 'object') {

            if (typeof obj.price === 'string') {

                var price = obj.price.trim();

                if (price.substring(0, 1) === '$') {
                    price = price.substring(1).trim();
                }

                if ((price.length > 0) && validate._is_instr(price, numerics+".")) {
                    result = Number(price);
                }

            } else {
                if (typeof obj.price === 'number') {
                    result = obj.price;
                }
            }
        }

        return typeof cb === 'function' ? cb(result) : result;

    };



    validate.image_url = function(obj, cb) {
        var result = false;

        if (typeof obj === 'object') {

            if (typeof obj.image_url === 'string') {

                if (obj.image_url.substring(0, 1) === "/") {
                    result = obj.image_url;
                } else {
                    if (obj.image_url.substring(0, 8) === "https://") {
                        result = obj.image_url;
                    } else {
                        if (obj.image_url.substring(0, 7) === "http://") {
                            result = obj.image_url;
                        }
                    }
                }
            }

        }

        return typeof cb === 'function' ? cb(result) : result;
    };


    // new menu items need:
    // description
    // image_url
    // price
    // note - does not validate or add an identifier, simply validates other required inputs
    validate.new_menu_item = function(obj, cb) {

        validate.description(obj, function(description) {

            if (!description) {
                console.log({
                    error: "invalid description",
                    obj: obj
                });
                return cb(false);
            }

            validate.image_url(obj, function(image_url) {

                if (!image_url) {
                    //console.log({error:"invalid image_url",obj:obj});
                    //return cb(false);
                    image_url = validate.default_image_url;
                }

                validate.price(obj, function(price) {

                    if (price === false) { // allow for 0.0 price
                        console.log({
                            error: "invalid price",
                            obj: obj
                        });
                        return cb(false);
                    }

                    cb({
                        description: description,
                        image_url: image_url,
                        price: price
                    });

                });

            });
        });
    };

    // assumes caller has prevalidated the id as belonging to an existing menu item
    // assumes update contains payload from update request
    // assumes menu contains currently stored menu data
    // validates that id matches the existing menu data
    // then validates description and price and image_url according to validation rules
    // calls cb(false) if 
    // -- any of the above assumptions prove to be false
    // -- neither description,price or image_url are supplied in update
    // -- one or other of the required fields are invalid
    // otherwise, upates the user object and calls cb with it
    // DOES NOT INTERACT WITH FILE SYSTEM AT ALL. caller and cb must do that.
    validate.update_menu_item = function(update, menu, cb) {

        if (typeof update === 'object' && typeof menu === 'object') {

            validate.id(update, function(id) {

                if (!id || (menu.id !== update.id)) {
                    // need the primary key to match
                    return cb(false);
                }

                // this gets set to true when a valid input is detected 
                var updated = false;

                validate.description(update, function(description) {

                    if (update.description) {
                        if (description) {
                            updated = true;
                        } else {
                            return cb(false);
                        }
                    }

                    validate.price(update, function(price) {

                        if ((typeof update.price !== 'undefined')) {
                            if (price !== false) {
                                updated = true;
                            } else {
                                return cb(false);
                            }
                        }


                        validate.image_url(update, function(image_url) {

                            if (update.image_url) {
                                if (image_url) {
                                    updated = true;
                                } else {
                                    return cb(false);
                                }
                            }

                            if (!updated) {
                                // no valid inputs were suppplied, abandon the update
                                return cb(false);
                            }

                            // update those inputs that were supplied
                            if (description) {
                                menu.description = description;
                            }

                            if (image_url) {
                                menu.image_url = image_url;
                            }

                            if (price !== false) { // allow a "falsy" price of zero
                                menu.price = price;
                            }

                            return cb(menu);

                        });

                    });

                });



            });

        } else {
            return cb(false);
        }

    };

    validate.quantity = function(obj, cb) {
        var result = false;
        if (typeof obj === 'object') {

            if (typeof obj.quantity === 'string') {

                var quantity = obj.quantity.trim();

                if ((quantity.length > 0) && validate._is_instr(quantity, numerics2)) {
                    result = Number(quantity);
                }

            } else {
                if (typeof obj.quantity === 'number') {
                    result = obj.quantity;
                }
            }
        }

        return typeof cb === 'function' ? cb(result) : result;

    };


    validate.card = function(obj, cb) {
        var number = validate.card.number(obj);
        var exp_month = validate.card.exp_month(obj);
        var exp_year = validate.card.exp_year(obj);
        var cvc = validate.card.cvc(obj);

        var result = (number && exp_month && exp_year && cvc) ? {
            number: number,
            exp_month: exp_month,
            exp_year: exp_year,
            cvc: cvc
        } : false;

        return typeof cb === 'function' ? cb(result) : result;
    };

    validate.card.number = function(obj, cb) {

        var result = false,
            number;
        if (typeof obj === 'object') {

            if (typeof obj.number === 'string') {

                number = obj.number.trim().replace(" ", "").replace("-", "");

                if ((number.length === 16) && validate._is_instr(number, numerics)) {
                    result = number;
                }

            } else {
                if (typeof obj.number === 'number') {
                    number = ('0000000000000000' + obj.number.toString()).substr(-16);
                    if (number.length === 16) {
                        result = number;
                    }
                }
            }
        }

        return typeof cb === 'function' ? cb(result) : result;

    };
    validate.card.exp_month = function(obj, cb) {
        var result = false;
        var months = [undefined, '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        if (typeof obj === 'object') {

            if (typeof obj.exp_month === 'string') {
                result = months[Number(obj.exp_month.trim())] || false; // will be false if outside of valid range
            } else {
                if (typeof obj.exp_month === 'number') {
                    result = months[obj.exp_month] || false; // will be false if outside of valid range
                }
            }
        }

        return typeof cb === 'function' ? cb(result) : result;
    };
    validate.card.exp_year = function(obj, cb) {
        var result = false;
        var check = function(exp_year) {
            var yyyy = (new Date()).getFullYear();
            switch (exp_year.length) {
                case 1:
                    {
                        if (Number(exp_year) >= (yyyy % 100)) {
                            return '0' + exp_year;
                        }
                        break;
                    }
                case 2:
                    {
                        if (Number(exp_year) >= (yyyy % 100)) {
                            return exp_year;
                        }
                        break;
                    }
                case 4:
                    {
                        if (Number(exp_year) >= yyyy) {
                            return exp_year;
                        }
                        break;
                    }
                default:
            }
            return false;
        };
        if (typeof obj === 'object') {

            if (typeof obj.exp_year === 'string') {
                var str = obj.exp_year.trim();
                if (validate._is_instr(str, numerics)) {
                    result = check(str);
                }
            } else {
                if (typeof obj.exp_year === 'number') {
                    result = check(obj.exp_year.toString());
                }
            }
        }

        return typeof cb === 'function' ? cb(result) : result;

    };
    validate.card.cvc = function(obj, cb) {

        var result = false;

        if (typeof obj === 'object') {
            if (typeof obj.cvc === 'string') {
                var str = obj.cvc.trim();
                if (validate._is_instr(str, numerics)) {
                    result = ('00' + str).substr(-3);
                }
            } else {
                if (typeof obj.cvc === 'number') {
                    result = ('00' + obj.cvc.toString()).substr(-3);
                }
            }
        }

        return typeof cb === 'function' ? cb(result) : result;
    };

    validate.stripe_token_length = stripe_token_length;
    validate.stripe = function(obj, cb) {
        var result = false;

        if (typeof obj === 'object') {

            if (typeof obj.stripe === 'string') {

                if (obj.stripe.length <= stripe_token_length) {
                    result = obj.stripe;
                }
            }

            if (typeof obj.stripe === 'object') {
                result = validate.card(obj.stripe);
            }

        }

        return typeof cb === 'function' ? cb(result) : result;
    };

    // order fields

    validate.order_id_length = order_id_length;
    validate.order_id = function(obj, cb) {

        var result = false;

        if (typeof obj === 'object') {

            if (typeof obj.order_id === 'string') {

                if (obj.order_id.length === order_id_length) {

                    result = obj.order_id;
                }
            }

        }

        return typeof cb === 'function' ? cb(result) : result;

    };


}