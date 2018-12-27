module.exports = function(helpers){
    
    helpers.chain=typeof setImmediate==='function' ? setImmediate : function(fn,x){setTimeout(fn,0,x);};
    
    /*
      filterConditionals (
         raw - input text
         variables - object with keys
         spacer - optional - string to insert between conditional cuts 
      )
      
      looks for the following pattern in raw:
      
        {?:key} ..some text... {:?}
        
        or 
      
        {?:key} ..some text... {:else:} alternate {:?}  
        
        these markers are removed from raw
        if the key does not exist in variables, the text between the marker pairs is removed also 
    
    */    
    helpers.filterConditionals = function(raw,variables,spacer) {
         
        var conditionals = raw.split ("{?:");
        
        if (conditionals.length===1) {
            return raw;
        }
        spacer = spacer || "";
        var cooked = conditionals.shift();
        /*   
           raw          = "prefix{?:key}conditional {key} content{:?} intermediate {data} {?:key1}conditional content{:?} suffix"
           cooked       = "prefix"
           conditionals = ["key}conditional {key} content{:?} intermediate {data} ","key1}conditional content{:?} suffix"]
        */
        conditionals.forEach(function(chunk){
            /* chunk = "key}conditional {key} content{:?}intermediate {data} " */
            var split = chunk.split("{:?}");
            /* split = ["key}conditional {key} content","intermediate {data} "] */
            var key_content= split.shift().split("}");
            /* 
                key_content = ["key","conditional {key"," content"] 
                split       = ["intermediate {data} "]
            */
            var key = key_content.shift();
            var content=key_content.join("}"),altContent = "";
            /* 
               key         = "key"
               key_content = ["conditional {key"," content"]
               content     = "conditional {key} content"
               altContent  = ""
            */
    
            var content_altContent = content.split("{:else:}");
            /*
               content_altContent [""]
            */
            if (content_altContent.length==2) {
                /*  
                   content = "cond cont {:else:} alt cont" 
                   content_altContent = ["cond cont "," alt cont"] 
                */
                content = content_altContent[0];
                altContent = content_altContent[1] + spacer ;
                /*  
                   content = "cond cont " 
                   altContent = " alt cont "
                */
            }
            
            
            if (variables && typeof variables[key] !== 'undefined') {
                cooked += spacer+content+spacer+split.join("{:?}");
                /* cooked = "prefix conditional {key} content intermediate {data} " */
                /* cooked = "prefix cond cont intermediate {data} " */
                
            } else {
                cooked += spacer+altContent+split.join("{:?}");
                /* cooked = "prefix intermediate {data} " */
                /* cooked = "prefix alt cont intermediate {data} " */
            }
        });
        
        return cooked;
    };
    
    
    /*
    
      asyncronous function to process html templates.
       - replaces {key} with variables[key] in raw
       - if variables[key] is a function,  it is invoked as follows
            variables[key](context,key,return_handler)
            the function returns the string value by calling return_handler(value)
        - also replaces {[key]} with JSON.stringify(variables[key]) in raw
        
    */
    helpers.replaceVariables = function (raw,variables,cb) {
        if (!variables || !raw) {
            return cb(raw);
        }    
        var cooked = raw;
        
        var var_keys = Object.keys(variables);
        
        var find_jsons = function (i) {
            if (i>= var_keys.length) {
                cb(cooked);
            } else {
                var key = var_keys[i];
                var value = variables[key];
                
                var parts = cooked.split("{"+key+"}");
                if (parts.length>1) {
                    switch (typeof value) {
                        case "object"   : 
                        case "string"   : 
                        case "number"   : 
                            cooked=parts.join(JSON.stringify(value)); 
                            return helpers.chain(find_strings,++i);
                        case "function" : 
                            return value(key,function(strValue){
                                cooked=parts.join(JSON.stringify(strValue)); 
                                return find_jsons(++i);
                            });
                    }
                }
                find_jsons(++i);
            }
        };
    
        var find_strings = function (i) {
            if (i>= var_keys.length) {
                find_jsons(0);
            } else {
                var key = var_keys[i];
                var value = variables[key];
                
                var parts = cooked.split("{"+key+"}");
                if (parts.length>1) {
                    switch (typeof value) {
                        
                        case "number"   : 
                            cooked=parts.join(value.toString()); 
                            return helpers.chain(find_strings,++i);
                        case "string"   : 
                            cooked=parts.join(value); 
                            return helpers.chain(find_strings,++i);
                        case "function" : 
                            return value(key,function(strValue){
                                cooked=parts.join(strValue); 
                                return find_strings(++i);
                            });
                    }
                }
                find_strings(++i);
            }
        };
        
        find_strings(0);
    };
    
    
    /*
    
        mergeVariables - used to "preprocess" html, replacing {key} with variables[key]
        
        - filters out conditional wrappers marked with {?:key} some text {:?}
          (if key does not exist in variables, deletes " some text " from raw)
        
        - filters out conditional wrappers marked with {?:key} some text {:else:} some other text {:?}
          (if key does not exist in variables, " some other text " will remain in raw)
        
        once these replacements are made, asyncronous replacement takes place as follows
          (async only because functions may be needed)
        
        - replaces {key} with variables[key] in raw
        - if variables[key] is a function,  it is invoked as follows
             variables[key](context,key,return_handler)
             the function returns the string value by calling return_handler(value)
         - also replaces {[key]} with JSON.stringify(variables[key]) in raw
        
        mergeVariables (
           raw          - input text
           variables    - object with keys to values (either strings or functions that return a string)
           spacer       - optional - string to insert between conditional cuts 
           cb           - callback for resulting html
        )
        
    */
    helpers.mergeVariables  = function (raw,variables,spacer,cb){
        
        return helpers.replaceVariables(
            helpers.filterConditionals (raw,variables,spacer),
            variables,
            cb
        ); 
        
    };
    
    
    
    /*
    
     mergeVariableArray -
     
     return a large chunk of html using raw as template for each element in an array/keyed object
     templates can use {_meta.index} and {_meta.key} to diffentiate between elements and create ids etc
    
     array: [ { one: 1, a : 'a' }, { one: 100, a : 'z'} ]
         --> { one: 1, a : 'a', '_meta.index' : 0, '_meta.key' : '0' }
         --> { one: 100, a : 'z', '_meta.index' : 1, '_meta.key' : '1' }
    
     { "key1" : { one: 1, a : 'a' }, "key2" : { one: 100, a : 'z'} }
         --> { one: 1, a : 'a', '_meta.index' : 0, '_meta.key' : 'key1' }
         --> { one: 100, a : 'z', '_meta.index' : 1, '_meta.key' : 'key2' }
    */
    helpers.mergeVariableArray = function(raw,array,spacer,cb){
        var var_keys = Object.keys(array),html='',xspacer='';
        var loop = function (i) {
            if (i>= var_keys.length) {
                cb(html);
            } else {
                var key = var_keys[i],variables = array[key];
                variables["_meta.index"]=i;
                variables["_meta.key"]=key;
                helpers.mergeVariables(raw,variables,spacer,function(cooked) {
                    html += xspacer+cooked;
                    xspacer=spacer;
                    loop(++i);
                });
            }
        };
        loop(0);
    };
}
