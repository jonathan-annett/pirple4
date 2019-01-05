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
var events = require('events');
class _events extends events{}
var e = new _events();

// Project Dependancies
var _data    = require('.
/data');
var config = require('./config');
var helpers = require('./helpers');
var handlers = require('./handlers');

const USER = "user";
const ORDER = "order";
const MENU = "menu";

lib.horizontalLine = function (width,char){
   width = typeof width === 'number' && width > 0 ? width : process.stdout.columns;
   console.log(Array(width+1).join('-'||char));
};

lib.colours = {
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

lib.colors=lib.colours;//damn those americans.

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
        
        lib.horizontalLine();  
        lib.centeredText(table.title);
        lib.horizontalLine(); 
        
        lib.skipLine();

        rows.forEach(function(cols,rowIndex){
            
            var pad,lineText = "  ";
            var colWidths=rowWidths[rowIndex];
            if (table.colours) {
                
                cols.forEach(function(col,colIndex){
                     lineText += lib.colours[ table.colours[colIndex] ] + col + lib.colours.normal;
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
    colours : ["white","cyan"],
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
                        var colourArg = lib.colours.yellow + column1Arg + lib.colours.normal;
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
                    
                    getHelp(keys,++i,cmds,text);
                    getHelp(Object.keys(link),0,link,text+" "+key);
                    
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
    process.exit();
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

lib.commands.listRecentUsers = function (hours) {
    hours = hours && (isNaN(Number(hours))===false) && Number(hours)>0 ?  Number(hours) : 24;
    var epoch = Date.now() - (hours * 60 * 60 * 1000);
    _data.list(USER,{preload:true,flatten:true},function(err,list){
        
        lib.displayTable(
            {   
                title : "Users signed up in last "+hours.toString()+" hours",
                colors : ["white","magenta"],
                rows :  
                
                    list.filter(function(user_data){
                        return user_data.join_date > epoch ; 
                    }).map(
                        function(user_data){
                            return [ user_data.email, user_data.name ];
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
                            config.globals.currencySymbol+menu_data.price ];
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
                            config.globals.currencySymbol+order_data.total 
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
                        return order_data.join_date > epoch ; 
                    }).map(
                        function(order_data){
                            var d = new Date(order_data.when);
                            return [ 
                                order_data.order_id,
                                helpers.formatDate(d),
                                d.toString().substr(0,5),
                                config.globals.currencySymbol+order_data.total 
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

lib.commandIndex = {
    
  exit : [ lib.commands.exit, "Exit server application." ],
  
  restart : [ lib.commands.restart, "Restart the server application." ],

  man  : [ lib.commands.help, "Display this help menu." ],
  
  help : [ lib.commands.help, "Display this help menu. (Alias for 'man' command)" ],
  
  list : {
      users : [ lib.commands.listUsers, "Display the list of users"  ],
      menu  : [ lib.commands.listMenu,  "Display all menu items"     ],
      recent : {
          users  : [ lib.commands.listRecentUsers,  "Display users who have signed up in last 24 hours"  ],
          orders : [ lib.commands.listRecentOrders, "Display orders made in last 24 hours"               ],
      },
      user : {
          orders : [ lib.commands.listUserOrders, "Display the orders for user {user_id}", "{user_id}"  ],
      }
  },
  
  inspect : {
          user   : [ lib.commands.inspectUser,  "Display detailed information for user by {email}",      "{email}"       ],
          order  : [ lib.commands.inspectOrder, "Display detailed information for order {order_id}",     "{order_id}"    ],
          menu   : [ lib.commands.inspectMenu,  "Display detailed information for menu item {menu_id}",  "{menu_id}"     ],
 }
 
};


lib.processInput= function (str){
  str = typeof str==='string' ? str.trim() : false;
  if (str && str.length>0) {
     
     var words = str.toLowerCase().split(' ')
           .map(function(w){return w.trim();})
             .filter(function(w){return w.length>0;});
     
     var parse = function (seek,i){
         
         if (i<words.length) {
            var term = words[i++];
            var lookup=seek[term];
            if (typeof lookup==='object') {
                if (lookup.constructor===Array) {
                    var cmd = lookup[0];
                    if (typeof cmd==='function') {
                        var args = i < words.length ? words.slice(i) : [];
                        cmd.apply(null,args);
                    }
                    
                } else {
                    parse(lookup,i);
                }
            }
         }
     }; 
     
     parse(lib.commandIndex,0);
      
  }
};

lib.start = function () {
    // Send to console, in dark blue
    console.log('The CLI is running');
  
    // Start the interface
    var _interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ''
    });
  
    // Create an initial prompt
    _interface.prompt();
  
    // Handle each line of input separately
    _interface.on('line', function(str){
  
      // Send to the input processor
      lib.processInput(str);
  
      // Re-initialize the prompt afterwards
      _interface.prompt();
    });
  
    // If the user stops the CLI, kill the associated process
    _interface.on('close', function(){
      process.exit(0);
    });
};