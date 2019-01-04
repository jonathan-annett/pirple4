/* global app */

app.helpers.validate.default_image_url = "/public/default.png";

app.helpers.flatten = function (array,key) {
    var db = {};
    array.forEach(function(el){ db[ el[key] ] = el; });
    return db;
};

app.helpers.formatDate = function(date) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return day + ' ' + monthNames[monthIndex] + ' ' + year;
};

 
app.helpers.resolve_uri=function(url){
    if (url.substr(0,document.baseURI.length)===document.baseURI) {
        return url.substr(document.baseURI.length);         
    } else {
        return url;
    }
};
 
app.helpers.parse_url=function(url){
    
    var uri = app.helpers.resolve_uri (url);
    var path=uri;
    var params = {};
    var query = "";
    var i = uri.indexOf("?");
    if (i>=0) {
        query = uri.substr(i+1);
        path  = uri.substr(0,i);
        query.split("&").forEach(function(kv_pair){
            var p = kv_pair.split("=");
            var key = p.shift();
            var value = p.join("=");
            params[key]=value;
        });
    }
    
    if (path.charAt(0)==="/") path = path.substr(1);
    return {
        uri   : uri,
        path  : path,
        query : query,
        queryParams : params
    };
};

app.helpers.build_uri = function(path,queryParams,cb){
    var uri = Object.keys(queryParams).reduce(function(uri,key,index){
        return uri+(index===0?'?':'&')+key+'='+encodeURIComponent(queryParams[key]);
    },typeof path==='string'? "api/"+path : 'api/error');
    return cb ? cb(uri) : uri; 
};

// create an XMLHttpRequest with prevalidated uri,METHOD,headers and cb
app.helpers.xhr = function (uri,METHOD,headers,cb) {
    var xhr = new XMLHttpRequest();
    xhr.open(METHOD, uri, true);
    app.getTokenId(function(tok){if (tok) headers.token=tok;});
    Object.keys(headers).forEach(function(key) {
        xhr.setRequestHeader(key, headers[key]);
    });
    
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE) {
          var statusCode = xhr.status;
          var responseReturned = xhr.responseText;
            try{
              cb(statusCode,JSON.parse(responseReturned));
            } catch(e){
              cb(statusCode,false);
            }
  
        }
    };
  
    cb(undefined,undefined,xhr);
    
};

