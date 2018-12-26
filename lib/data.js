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

lib.join = function (objclass,objname) {
    return objname ? path.join(lib.basedir,objclass,objname) : objclass ? path.join(lib.basedir,objclass) : path.join(lib.basedir,objclass);
};

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


/*

return list of files under ./.data/objclass
options can be one of 
{preload : false} | {} | undefined  === return list of filenames only
{preload : true}                    === return [ {path:'fn1.json',data :{JSON1} },{path:'fn2.json',data :{JSON2} }  ]
{preload : true, flatten : true}    === return [ {JSON1},{JSON2},{JSON3} ...]
{preload : true, hashmap : true}    === return {'fn1': {JSON1},'fn2' :{JSON2} ....}


example (5 ways of getting username (aka email) and userdata from each user

   
   // don't preload, load each file syncronously inside a foreach loop
   lib.list("user",function(err,list){
       list.forEach(function(item)){
           var username = item.path.substring(0,item.path.lastIndexOf("."));
           var userdata = JSON.parse(fs.readFileSync(path.join(lib.basedir,"user",item.path)));
       }); 
   });
   
   // don't preload, load each file asyncronously inside a foreach loop
   lib.list("user",function(err,list){
       list.forEach(function(item)){
           fs.readFile(path.join(lib.basedir,"user",item.path),function(err,data){
               var username = item.path.substring(0,item.path.lastIndexOf("."));
               var userdata = JSON.parse(data);
           });
       }); 
   });

   
   // preload data asyncronously and interpolate username from file path inside array
   lib.list("user",{preload:true},function(err,list){
       list.forEach(function(item)){
           var username = item.path.substring(0,item.path.lastIndexOf("."));
           var userdata = item.data;
       }); 
   });
   
   
   // preload data as a flat array, pull username from user record
   lib.list("user",{preload:true,flatten:true},function(err,list){
       list.forEach(function(userdata)){
           var username = userdata.email;
       }); 
   });
   
   
   // preload data as a hashmap, use Object.keys to get usernames
   lib.list("user",{preload:true,hashmap:true},function(err,list){
   
       Object.keys(list).forEach(function(username){
           var userdata = list[username]; 
       });
       
   });
   
   // preload data and pass to callback per file
   lib.list("user",{preload:true,callback:function(filename,userdata,count,raw){
       var username = userdata.email;
   }});

*/

lib.list = function (objclass,options,cb){
    
    if (typeof options==='function') {
        cb=options;
        options={};
    }
    
    fs.readdir(
        path.join(lib.basedir,objclass),
        function(err,filenames){
            
                if (err) {
                    // callback is optional
                    return (typeof cb==='function') ? cb (err) : undefined;
                }
                var result = filenames.map(function(fn){ return {path: fn};});                
                
                if (options.preload) {
                    
                    // async preload and parse each file
                    var processNextResult = function(i) {
                        
                        // infinite recursion stopper - when i is past end of result array
                        if (i>=result.length) {
                            
                            if (typeof cb==='function') {
                                
                                if (options.flatten) {
                                    // return [ {JSON1},{JSON2},{JSON3} ]
                                    return cb(undefined,result.map(function(x){ return x.data;}));
                                } else {
                                    
                                    if (options.hashmap) {
                                       // return {'fn1': {JSON1},'fn2' :{JSON2} }
                                       var res = {};
                                       result.forEach(function(x){
                                           var fn = x.path;
                                           res[fn.substring(0,fn.lastIndexOf("."))] = x.data ;
                                       });
                                       return cb(undefined,res);
                                   
                                    } else {
                                       // return [ {path:'fn1',data :{JSON1} },{path:'fn2',data :{JSON2} }  ]
                                       return cb(undefined,result);
                                    }
                                }
                                
                            } else {
                                // need to provide for no callback as it might have been
                                // specified inside options for callback per list item
                                return ;
                            }
                        }
                        
                        // read next file (result[i].path) and parse as JSON into result[i].data
                        fs.readFile(
                            
                            path.join(lib.basedir,objclass,result[i].path),
                            
                            function(err,buf){
                                
                                if (err) {
                                    return cb(err);
                                }
                                try {
                                    result[i].data = JSON.parse(buf);
                                    if (typeof options.callback === 'function') {
                                        options.callback(result[i].path,result[i].data,i,buf);
                                    }
                                    processNextResult(i+1);
                                } catch (ex) {
                                    cb (ex);                                
                                }
                                
                            }
                        );
                    };
                    
                    
                    processNextResult(0);

                } else {
                    // callback is optional
                    return (typeof cb==='function') ? cb (undefined,result) : undefined;
                }

        }
    );
    
};

 