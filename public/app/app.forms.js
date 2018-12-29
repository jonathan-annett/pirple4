/* global app */

app.helpers.setInput = {
  text     : function(el,value) { el.value = value; },
  checkbox : function(el,value) { if (value) el.checked=true; else el.checked=false;}
};

app.helpers.setInput.password=app.helpers.setInput.text;

app.helpers.getInput = {
  text     : function(db,key,el) { db[key] = el.value; },
  checkbox : function(db,key,el) { db[key] = el.checked; },
  password : function(db,key,el) { if (el.value.length>0) db[key] = el.value; }
};

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
