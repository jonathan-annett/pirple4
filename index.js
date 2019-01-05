/*
  File: index.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


var app = module.exports = {};

app.init = function () {
    
    ["config","servers","workers","cli"].forEach(function(mod){
        app[mod]  = app[mod]  || require('./lib/'+mod);
        app[mod].app = app;
    });


    app.servers.start();
    app.workers.start();
    app.cli.start();
};

if (process.execArgv.indexOf('--inspect')>=0) {
    // wait 5 seconds to allow opening of chrome://inspect browser window
    // to enable debugging of app.init()
    setTimeout(function(){
        debugger; 
        app.init();
    },5000);
} else {
    app.init();
}








