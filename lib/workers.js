/*
  File: workers.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: background workers module
  Used By: index
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var lib = module.exports = {};
var helpers = require("./helpers");
var started=false;

var async_passthru = function(cb) {
    cb();
}
var ids = {};

lib._start=function(service,setup,loop,interval){
    
    setup = typeof setup==='function' ? setup : async_passthru;
    
    setup(function(){
        if (typeof loop==='function' && typeof interval==='number') {
            ids[service]=setInterval(loop,interval);
        }
    });
    
};

lib._stop=function(service){
    var id = ids[service];
    if (id) {
        clearInterval(id);
        delete ids[service];
    }
};
 
lib.console_clock = function() {
    console.log(new Date());
    
};

lib.console_clock.setup = function (cb) {
  
        
    console.log("started console clock");
    cb();
 
    
}

lib.start = function(cb) {
    if (!started) {
        lib._start('clock',lib.console_clock.setup,lib.console_clock,60*1000);
        started=true;
    }
    if (typeof cb === 'function') {
        cb();
    }
};

lib.stop = function() {
    if (started) {
        lib._stop('clock');
        started=false;
    }
};