/* global app */

app.helpers.setInput = {
  text     : function(el,value) { el.value = value; },
  checkbox : function(el,value) { if (value) el.checked=true; else el.checked=false;}
};
app.helpers.setInput.password=app.helpers.setInput.text;
app.helpers.setInput.hidden=app.helpers.setInput.text;

app.helpers.getInput = {
  text     : function(db,key,el) { db[key] = el.value; },
  checkbox : function(db,key,el) { db[key] = el.checked; },
  password : function(db,key,el) { if (el.value.length>0) db[key] = el.value; }
};
app.helpers.getInput.hidden=app.helpers.getInput.text;

app.helpers.setFormData = function(frmId,data){

    var elements=document.getElementById(frmId).elements;
    
    Object.keys(elements).forEach(function(i){
       var fn,el = elements[i],value;
       if (el.name && (value=data[el.name]) && (fn = app.helpers.setInput[el.type])) fn(el,value);
    });
    
};

app.helpers.getFormData = function (frmId) {
    var elements=document.getElementById(frmId).elements,result={};

    Object.keys(elements).forEach(function(i){
      var fn,el = elements[i];
      if (el.name && typeof (fn = app.helpers.getInput[el.type])==='function') fn(result,el.name,el);
    });
    return result;
};


app.submitFormData = function (frmId,path,method,cb){
    
    var 
    
    payload = app.helpers.getFormData(frmId),
    
    error_message=function(code,message) {
       if (typeof cb==='function') {
          cb(code,{Error:message},payload);// note extra parameter for payload
       }
    };
    
    if (payload._method) {
        method = payload._method.toLowerCase();
        delete payload._method;
    }
 
    
    if (typeof payload!=='object') {
        return error_message(500,"could not get valid payload for " + frmId + " in submitFormData(" + frmId + ")" );
    }
    
    if (typeof app.api[path]!=='object') {
        return error_message(500,path+" is not a valid path for the API" );
    }
    
    var fn=app.api[path][method];
    if (typeof fn==='function') {
        
       fn(payload,function(code,responsePayload){
          if (typeof cb==='function') {
            cb(code,responsePayload,payload);// note extra param for submitted payload.
          }  
       });
       
    } else {
        
       if (typeof cb==='function') {
           return error_message(500,method+" is not a valid method for " + path + " in app.submitFormData(" + frmId + ")");
       }
       
    }
 
};