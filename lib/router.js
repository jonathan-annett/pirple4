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
// all method handlers can be created using router.ALL.pathname 

router.post = {
    // When someone posts anything to the route /hello, you should return a welcome message, in JSON format. 
    // This message can be anything you want. 
    hello : handlers.hello
};


router.get = {
    // instructions were to only send the welcome message to routes that POST to /hello
    // so just bounce back a get request to hello.
    hello : handlers.echo
};

// generic method handler in here need to check method to determine what they are actually doing.
router.ALL = {
    echo : handlers.echo
};

