/*
  File: data.js
  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
  Synopsis: json file system interface
  Used By: 
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


var lib  = module.exports = {};
var fs   = require('fs');
var path = require('path');


lib.basedir = path.join(__dirname,'..','.data');

if (!fs.existsSync(lib.basedir)) {
    fs.mkdirSync(lib.basedir) ;
}

// read an object
lib.read = function(objclass,objname,cb){
    fs.readFile(path.join(lib.basedir,objclass,objname+".json"),function(err,buffer){
       if (err) return cb("could not read file:"+path.join(objclass,objname+".json"));
       if (!buffer) return cb (new Error("buffer expected in fs.readFile callback"));
       try {
         cb(undefined,JSON.parse(buffer));       
       } catch (err) {
         cb(err,buffer);
       }
    });
};

lib.valid_paths = {
    
};

// force directory creation, caching for next call
lib.make_path = function (objclass,cb) {
   if (lib.valid_paths[objclass]) return cb();
   fs.mkdir(path.join(lib.basedir,objclass),function(/*ignore error*/){
      lib.valid_paths[objclass]=true;
      cb();
   });
};

// low level wrapper to write object to file
// don't call directly; use lib.create or lib.update instead 
lib.write= function(objclass,objname,obj,opts,cb){
    lib.make_path(objclass,function(){
        fs.writeFile(
            path.join(lib.basedir,objclass,objname+".json"),
            JSON.stringify(obj),
            opts,
            function(err){
               cb(err ? "could not "+opts.operation+" file:"+path.join(objclass,objname+".json") : undefined);
            }
        );    
    });
};


// write object to file failing if path already exists
lib.create= function(objclass,objname,obj,cb){
    lib.write(objclass,objname,obj,{flag:"wx", operation : "create" },cb);
};

// write object to file failing if path does not exist
lib.update= function(objclass,objname,obj,cb){
    lib.write(objclass,objname,obj,{flag:fs.constants.O_RDWR | fs.constants.O_TRUNC, operation : "update" },cb);
};

// delete (unlink) file 
lib.delete= function(objclass,objname,cb){
    fs.unlink(
        path.join(lib.basedir,objclass,objname+".json"),
        function(err){
           cb(err?"could not delete file:"+path.join(objclass,objname+".json"):undefined);
        }
    );
};


if (process.mainModule===module) {
    
    //this code only executes if started on the command line
    lib.create("testcase","hello",{hello:"world"},function(err){
       if (err) return console.log({err:err}); 
       lib.read("testcase","hello",function(err,data){
            if (err) return console.log({err:err}); 
            console.log({read_after_create:data});
            lib.update("testcase","hello",{hello:"universe"},function(err){
                if (err) return console.log({err:err}); 
                lib.read("testcase","hello",function(err,data){
                    if (err) return console.log({err:err});
                    console.log({read_after_update:data});
                    lib.delete("testcase","hello",function(err){
                        if (err) return console.log({err:err});
                        console.log({deleted:true});
                    });
                });    
            });
       });
    });
    
}