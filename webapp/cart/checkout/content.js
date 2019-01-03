module.exports = function(app, handlers) {

    var page = {

        // before_template : function (cb) {cb();},

        htmlOptions: {
            variables: {
                'head.title': 'Shopping Cart Checkout',
                'body.class': 'cartCheckout'
            },
            dataSources: {
                cart: true
            }
        },

        template: function(params, cb) {

            params.htmlOptions = page.htmlOptions;

            return handlers.html.template(params, cb);
        },

        browser_variables: function(vars, cb) {
            app.browser_variables["cart/view"](vars, cb);
        },

        //after_template : function () { },

        forms: [{
            id_prefix: "cartCheckoutDelete_",

            //before_submit : function (formData,cb) { cb(); },


            after_submit: function() {

                app.clearTemplateCache("cartCheckout");
                app.templates["cart/checkout"]();

            }

        }, {

            before_submit: function(formData, cb) {

                app.helpers.validate.card(formData, function(stripe) {
                    if (stripe) {
                        app.api.order.post({
                            stripe: stripe
                        }, function(code, order) {

                            if (code === 200) {
                                app.templates["order/completed"](order, function() {

                                });
                            } else {
                                app.templates["order/failed"](order, function() {

                                });
                            }

                        });
                    }
                });

            },

            //after_submit : function () {  }
        }]
    };

    return page;

};