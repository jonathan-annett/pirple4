/*
  File: cli.js
  Project: Asignment 4 https://github.com/jonathan-annett/pirple4
  Synopsis: command line interface
  Used By: index
*/

/*
Copyright 2018 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var lib = module.exports = {};

// Dependancies

var fs = require('fs');
var readline = require('readline');
var util = require('util');
var debug = util.debuglog('cli');
var repl = require('repl');
var events = require('events');
class _events extends events{}
var e = new _events();

// Project Dependancies
var _data    = require('./data');
var config = require('./config');
var helpers = require('./helpers');
var handlers = require('./handlers');

const USER  = "user";
const ORDER = "order";
const MENU  = "menu";

lib.horizontalLine = function (width,char){
   width = typeof width === 'number' && width > 0 ? width : process.stdout.columns;
   console.log(Array(width+1).join('-'||char));
};

lib.colors = {
    normal : "\x1b[0m",
    black : "\x1b[30m",
    red : "\x1b[31m",
    green : "\x1b[32m",
    yellow : "\x1b[33m",
    blue : "\x1b[34m",
    magenta : "\x1b[35m",
    cyan : "\x1b[36m",
    white : "\x1b[37m"
};


lib.colors.args = lib.colors.yellow;
lib.colors.error = lib.colors.red;
lib.colors.keyword = lib.colors.green;

lib.skipLines = function(count){
    count = typeof count === 'number' && count > 0 ? count : 1;
    console.log(Array(count).join('\n'));
};
lib.skipLine=lib.skipLines;

lib.centeredText = function (text,width,colour) {
   text  = typeof(text) == 'string' && text.trim().length > 0 ? text.trim() : '';
   width = typeof width === 'number' && width > 0 ? width : process.stdout.columns;
   var prefix = colour === undefined ? '' : lib.colour[colour];
   var suffix = colour === undefined ? '' : lib.colour.normal;
   var pad = Math.floor( (width/2)- (text.length/2) );
   console.log(Array(pad+1).join(' ')+prefix+text+suffix);
};

lib.getTableSizes = function(table,cb) {
    var maxColumnWidths = [];
    var rows = [];
    var rowWidths = [];
    
    
   
    table.rows.forEach(function(columns){
        
        var cols = [], lens = [];
        var colIndex = 0;
        for(var i = 0; i < columns.length; i++) {
            var column = columns[i], length = column;
            if (typeof length==='number') {
                column = columns[++i];
            } else {
                length = column.length;
            }
            
            if ( (typeof maxColumnWidths [colIndex] !=='number') || (length > maxColumnWidths [colIndex]) ) {
                 maxColumnWidths [colIndex] = length;
            }
            lens.push(length);
            cols.push(column);
            colIndex++;
        }
        
        rows.push(cols);
        rowWidths.push(lens);
    });
    
    cb(rows,rowWidths,maxColumnWidths);
};

lib.displayTable = function (table) {

   lib.getTableSizes(table,function(rows,rowWidths,maxColumnWidths){
        lib.skipLine();
        lib.horizontalLine();  
        lib.centeredText(table.title);
        lib.horizontalLine(); 
        
        lib.skipLine();

        rows.forEach(function(cols,rowIndex){
            
            var pad,lineText = "  ";
            var colWidths=rowWidths[rowIndex];
            if (table.colors) {
                
                cols.forEach(function(col,colIndex){
                     lineText += lib.colors[ table.colors[colIndex] ] + col + lib.colors.normal;
                     if (colIndex<cols.length-1) {
                         pad = maxColumnWidths[ colIndex ] - colWidths[ colIndex ];
                         lineText += Array( pad + 3).join(" ");
                     }
                });
                
            } else {
                
                cols.forEach(function(col,colIndex){
                     lineText += col;
                     if (colIndex<cols.length-1){
                         pad = maxColumnWidths[ colIndex ] - colWidths[ colIndex ];
                         lineText += Array( pad + 3).join(" ");
                     }
                });
                
            }
            console.log(lineText);
            
        });  
        
        lib.skipLine();
        lib.horizontalLine();
   });

};

lib.displayRecord = function (title,record,caption){
    lib.skipLine();
    lib.horizontalLine();  
    lib.centeredText(title);
    lib.horizontalLine(); 
    
    lib.skipLine();
    var dump = record;
    if (caption) {
        dump = {};
        dump[caption] = record; 
    }
    
    console.dir(dump,{colors:true,depth:null});
    
    lib.skipLine();
    lib.horizontalLine();

};

lib.commandHelp = {
    title : "Command Help",
    colors : ["white","cyan"],
    rows   : false
};

lib.commands = {};

lib.commands.help = function () {
    
    var getHelp = function (keys,i,cmds,text) {
        
        if (i<keys.length) {
            var key = keys [i];
            var link = cmds[key];
            if (typeof link === 'object') {
                if (link.constructor===Array) {
                    
                    var column2Text = link[1];
                    var column1Arg  = link[2];
                    var column1Text = (text+" "+key).trim() ;
                    if (column1Arg) {
                        var colourArg = lib.colors.args + column1Arg + lib.colors.normal;
                        var col1Width = column1Text.length + 1 + column1Arg.length; 
                        
                        column1Text += ' ' + colourArg; 
                        var col2Width = column2Text.length;
                        column2Text = column2Text.split(column1Arg).join(colourArg);
                        lib.commandHelp.rows.push([col1Width,column1Text,col2Width,column2Text]); 
                    } else {
                        lib.commandHelp.rows.push([column1Text,column2Text]);
                    }
                    
                    getHelp(keys,++i,cmds,text);
                    
                    return false;
                    
                } else {
                    
                    
                    getHelp(Object.keys(link),0,link,text+" "+key);
                    getHelp(keys,++i,cmds,text);
                    
                    return false;
                }
            } 
        } else {
            return true;
        }
    };
    
    if (lib.commandHelp.rows===false) {
        // on first call, build the table structure
        lib.commandHelp.rows = [];
        getHelp(Object.keys(lib.commandIndex),0,lib.commandIndex,"");
    }
    
    lib.displayTable(lib.commandHelp);
    
};

lib.commands.exit = function () {
    process.exit(0);
};

lib.commands.listUsers = function () {
    _data.list(USER,{preload:true,flatten:true},function(err,list){
        
        
        lib.displayTable(
            {
                title : "All Users",
                colors : ["white","magenta"],
                rows :  list.map(
                    function(user_data){
                        return [ user_data.email, user_data.name ];
                    })
            }
        );
        
    });
};

lib.commands.listUserOrders = function (email) {
    _data.read(USER,email, function( err,user){
        
        if (err || !user){
            // there was a problem reading the file
            return console.log("Can't find user "+lib.colors.green+email+lib.colors.normal);
        } 
        
        var user_orders = [];
        var loop = function (i) {
            
            if (i>= user.orders.length) {
                
                return lib.displayTable(
                    {
                        title   : "Showing orders for user "+email,
                        colors  : ["white","magenta","magenta","blue"],
                        rows    : user_orders
                    }
                );
                
            } else {
                
                var order_id = user.orders[i];
                _data.read(ORDER,order_id, function( err,order){
                    
                    if (err || !order) {
                        // there was a problem reading the file
                        return console.log("Can't find order "+lib.colors.green+order_id+lib.colors.normal);
                    } 

                    var d = new Date(order.when);
                    user_orders.push([ 
                        order.order_id,
                        helpers.formatDate(d),
                        d.toTimeString().substr(0,5),
                        lib.globals.currencySymbol+order.total 
                    ]);
                    
                    loop(++i);
                });
                
            }
        };
        loop(0);
        
    });
    
    
};

lib.commands.listRecentUsers = function (hours) {
    hours = hours && (isNaN(Number(hours))===false) && Number(hours)>0 ?  Number(hours) : 24;
    var epoch = Date.now() - (hours * 60 * 60 * 1000);
    _data.list(USER,{preload:true,flatten:true},function(err,list){
        
        lib.displayTable(
            {   
                title : "Users signed up in last "+hours.toString()+" hours",
                colors : ["white","yellow","blue","white"],
                rows :  
                
                    list.filter(function(user_data){
                        return user_data.join_date > epoch ; 
                    }).map(
                        function(user_data){
                            var d = new Date(user_data.join_date);
                            return [ 
                                user_data.email,
                                helpers.formatDate(d), 
                                d.toTimeString().substr(0,5),
                                user_data.name 
                            ];
                        }
                    )
            }
        );
        
    });    
};

lib.commands.listMenu = function () {
    _data.list(MENU,{preload:true,flatten:true},function(err,list){
        
        
        lib.displayTable(
            {
                title : "Menu Items",
                colors : ["white","magenta","blue"],
                rows :  list.map(
                    function(menu_data){
                        return [ 
                            menu_data.id, 
                            menu_data.description, 
                            lib.globals.currencySymbol+menu_data.price ];
                    })
            }
        );
        
    });
};

lib.commands.listOrders = function () {
    _data.list(ORDER,{preload:true,flatten:true},function(err,list){
        
        
        lib.displayTable(
            {
                title : "All Orders",
                colors : ["white","magenta","blue"],
                rows :  list.map(
                    function(order_data){
                        return [ 
                            order_data.order_id,
                            helpers.formatDate(new Date(order_data.when)),
                            lib.globals.currencySymbol+order_data.total 
                        ];
                    })
            }
        );
        
    });
};

lib.commands.listRecentOrders = function (hours) {
    hours = hours && (isNaN(Number(hours))===false) && Number(hours)>0 ?  Number(hours) : 24;
    var epoch = Date.now() - (hours * 60 * 60 * 1000);
    _data.list(ORDER,{preload:true,flatten:true},function(err,list){
        
        
        lib.displayTable(
            {
                title : "Orders made in last "+hours.toString()+" hours",
                colors : ["white","magenta","magenta","blue"],
                rows :  
                
                    list.filter(function(order_data){
                        return order_data.when > epoch ; 
                    }).map(
                        function(order_data){
                            var d = new Date(order_data.when);
                            return [ 
                                order_data.order_id,
                                helpers.formatDate(d),
                                d.toTimeString().substr(0,5),
                                lib.globals.currencySymbol+order_data.total 
                            ];
                        })
            }
        );
        
    });    
};

lib.commands.inspectUser = function (email) {
    _data.read(USER,email, function( err,user){
        
        if (err || !user){
            // there was a problem reading the file
            return console.log("Can't find user "+lib.colors.green+email+lib.colors.normal);
        }   
        delete user.password;
        delete user.salt;
        
        lib.displayRecord("Inspecting user:"+user.email,user,"user");

    });
};

lib.commands.inspectOrder = function (order_id) {
    _data.read(ORDER,order_id, function( err,order){
        
        if (err || !order){
            // there was a problem reading the file
            return console.log("Can't find order "+lib.colors.green+order_id+lib.colors.normal);
        }   
 
        lib.displayRecord("Inspecting order:"+order_id,order,"order");

        
    });
};

lib.commands.inspectLastUserOrder = function (email) {
    _data.read(USER,email, function( err,user){
        
        if (err || !user){
            // there was a problem reading the file
            return console.log("Can't find user "+lib.colors.green+email+lib.colors.normal);
        } 
        
        if (user.orders.length>0) {
            lib.commands.inspectOrder(user.orders.pop());
        } else {
            return console.log("user "+lib.colors.green+email+lib.colors.normal+" has no order history");
        }
        

    });
    
    
};

lib.commands.inspectLastOrder = function () {
    var order_id = handlers.order.last_order_id;
    if (order_id) {
        lib.commands.inspectOrder(order_id);
    } else {
        return console.log("There have been no recent orders");
    }
};

lib.commands.inspectMenu = function (menu_id) {
    _data.read(MENU,menu_id, function( err,menu){
        
        if (err || !menu){
            // there was a problem reading the file
            return console.log("Can't find menu item "+lib.colors.green+menu_id+lib.colors.normal);
        }   
 
        console.dir(menu,{colors:true,depth:null});
        
        lib.displayRecord("Inspecting menu item:"+menu_id,menu,"menu");
        
    });
};

lib.commands.setUserPermission = function (email,perm) {
        
        _data.read(USER,email, function( err,user){
            var perm_color  = lib.colors.yellow+perm+lib.colors.normal;
            var email_color = lib.colors.green+email+lib.colors.normal;
            if (err || !user){
                // there was a problem reading the file
                return console.log("Can't find user "+email_color);
            }   
            
            if (user.permissions) {
                if (user.permissions[perm]===true) {
                    return console.log(
                        "user "+email_color+" already has "+perm_color+" permission."
                    );
                }
                
                
            } else {
                user.permissions={};
            }
            user.permissions[perm]=true;
            _data.update(USER,email,user, function( err ){
                
                  if (err || !user){
                      // there was a problem reading the file
                      return console.log("Can't update user "+email_color);
                  } 
                  
                  return console.log("Added "+perm_color+" permission to user "+email_color);

            });
            
        });
};

lib.commands.setUserAdminPermission = function (email) {
   return lib.commands.setUserPermission(email,"admin");  
};

lib.commands.setUserEditMenuPermission = function (email) {
   return lib.commands.setUserPermission(email,"edit_menu");  
};

lib.commands.repl = function () {
    
    var initializeContext = function (context) {
      context.globals = lib.globals;
    };
    
    lib._interface.removeListener('close', lib.commands.exit);
    lib._interface.on('close', function (){
        
        console.log("Node.js REPL started");
        var replInstance = repl.start({
            
              prompt: '(Node.js - use '+
                lib.colors.keyword+'.exit'+lib.colors.normal+' to exit) '+
                lib.colors.yellow+'> '+lib.colors.normal,
                
              input: process.stdin,
              output: process.stdout,
              useColors : true,
              useGlobal : true,
              ignoreUndefined : true,
              replMode : repl.REPL_MODE_SLOPPY,
        });
    
        initializeContext(replInstance.context);
        
        replInstance.on('reset', initializeContext);
        
        replInstance.defineCommand('exit', function () {
             console.log('Exiting Node.js REPL...');
             this.close();
        });
        
        replInstance.on('close', function (){
            console.log("Node.js REPL exited");
            lib.start_interface();
        });
        
        
    });
    lib._interface.close();
    
    
    
};

lib.commandIndex = {
    
  exit : [ lib.commands.exit, "Exit server application." ],
  
  man  : [ lib.commands.help, "Display this help menu." ],
  
  help : [ lib.commands.help, "Display this help menu. (Alias for 'man' command)" ],
  
  repl : [ lib.commands.repl, "Start the node REPL." ],
  
  list : {
      users  : [ lib.commands.listUsers,  "Display the list of users"    ],
      orders : [ lib.commands.listOrders, "Display a list of all orders" ],
      menu   : [ lib.commands.listMenu,   "Display all menu items"       ],
      
      recent : {
          users  : [ lib.commands.listRecentUsers,  "Display users who have signed up in last 24 hours"  ],
          orders : [ lib.commands.listRecentOrders, "Display orders made in last 24 hours"               ],
      },
      
      user : {
          orders : [ lib.commands.listUserOrders, "Display the orders for user {email}", "{email}"  ],
      }
  },
  
  inspect : {
          user   : [ lib.commands.inspectUser,  "Display detailed information for user {email}", "{email}" ],
          order  : [ lib.commands.inspectOrder, "Display detailed information for order {order_id}", "{order_id}" ],
          menu   : [ lib.commands.inspectMenu,  "Display detailed information for menu item {menu_id}", "{menu_id}" ],
          last : {
              user : {
                  order : [ lib.commands.inspectLastUserOrder,  "Display last order for user {email}", "{email}" ],
              },
              order : [ lib.commands.inspectLastOrder,  "Display last order"],
          }
 },
 
  add : {
      user : {
          permission : {
              admin     : [ 
                  lib.commands.setUserAdminPermission, 
                      "Enable " + lib.colors.yellow + 
                      "admin" + lib.colors.normal + 
                      " permission for user {email}",
                      "{email}"
                ],
              edit_menu : [ 
                 lib.commands.setUserEditMenuPermission, 
                    "Enable " + lib.colors.yellow + 
                    "edit_menu" +  lib.colors.normal + 
                    " permission for user {email}",
                    "{email}"
                ],
          }
      },
  },
  
  remove : {
      user : {
          permission : {
              admin     : [ 
                  lib.commands.setUserAdminPermission, 
                      "Disable " + lib.colors.yellow + 
                      "admin" + lib.colors.normal + 
                      " permission for user {email}",
                      "{email}"
                ],
              edit_menu : [ 
                 lib.commands.setUserEditMenuPermission, 
                    "Disable " + lib.colors.yellow + 
                    "edit_menu" +  lib.colors.normal + 
                    " permission for user {email}",
                    "{email}"
                ],
          }
      },
  },
};

lib.processInput= function (str){
  str = typeof str==='string' ? str.trim() : false;
  if (str && str.length>0) {
     
     var words = str.split(' ')
           .map(function(w){return w.trim();})
             .filter(function(w){return w.length>0;});
     
     var parse = function (seek,i){
         
         if (i<words.length) {
            var term = words[i++].toLowerCase();
            var lookup=seek[term];
            if (typeof lookup==='object') {
                if (lookup.constructor===Array) {
                    var cmd = lookup[0];
                    if (typeof cmd==='function') {
                        var args = i < words.length ? words.slice(i) : [];
                        if (lookup[2]) {
                           if (args.length===0) {
                               
                               console.log (
                                   
                                   lib.colors.error   + "usage" + lib.colors.normal +" : " +
                                   lib.colors.keyword + words.join(" ") + lib.colors.normal + " "+
                                   lib.colors.args    + lookup[2] + lib.colors.normal
                                   
                                );
                                   
                               return ;
                           }
                           cmd.apply(null,args);
                        } else {
                           cmd();
                        }
                        
                    } else {
                        console.log(lib.colors.error+"I don't know how to [ "+
                        lib.colors.keyword + str + lib.colors.error+ " ]"+ lib.colors.normal);
                    }
                    
                } else {
                    parse(lookup,i);
                }
            } else {
                lib.horizontalLine();
                console.log(lib.colors.error+"I don't know how to [ "+
                lib.colors.keyword + str + lib.colors.error+ " ]"+ lib.colors.normal);
                lib.horizontalLine();
            }
         } else {
             lib.horizontalLine();
             console.log(lib.colors.error + "Incomplete command. possible options are:"+ lib.colors.normal);
             
             Object.keys(seek).forEach(function(key){
                 var arg = '';
                 if ( seek[key].constructor===Array ) {
                    if (seek[key].length===3) {
                        arg = ' '+lib.colors.args+seek[key][2]+ lib.colors.normal;
                    }
                 } else {
                     arg = lib.colors.magenta+' <more>'+lib.colors.normal;
                 }
                 console.log(lib.colors.keyword+ str + lib.colors.normal + " "+ key + arg );
             });
             lib.horizontalLine();
             
         }
     }; 
     
     parse(lib.commandIndex,0);
      
  }
};

lib.start_interface = function (cb) {
    // Start the interface
    console.log('The CLI is running');
    
    lib._interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: lib.colors.yellow+'> '+lib.colors.normal
    });
  
    // Create an initial prompt
    lib._interface.prompt();
  
    // Handle each line of input separately
    lib._interface.on('line', function(str){
        
      lib.globals = process.mainModule.app.config.globals;
  
      // Send to the input processor
      lib.processInput(str);
  
      // Re-initialize the prompt afterwards
      lib._interface.prompt();
    });
  
    // If the user stops the CLI, kill the associated process
    lib._interface.on('close', lib.commands.exit);
    
    
    
    if (typeof cb === 'function') {
        cb();
    }
};

lib.start = function (cb) {
    // Send to console, in dark blue
    
    var most_recent = 0;
    
    if (handlers.order.last_order_id===undefined) {
        _data.list(
            ORDER,{
                preload:true,
                callback:function(filename,order_data){
                    if (order_data.when > most_recent) {
                        most_recent = order_data.when;
                        handlers.order.last_order_id = order_data.order_id;
                    }
                }
            },
            function (){
                console.log("Last Order #:"+handlers.order.last_order_id);
                return lib.start_interface(cb);
            }
        );

    } else {
        return lib.start_interface(cb);
    }

};