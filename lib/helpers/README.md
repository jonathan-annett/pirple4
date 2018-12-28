
# helpers

lib/helpers contains javascript files that are normally loaded by lib/helper.js

these files contain helper functions that are either more substantial than a simple function, or are designated as common code that can be used inside the browser

to make a lib/helpers/whaterver.js file accessible from node, it needs to export a function that is called once by helpers.js at startup with a single paramter, which is the helpers library itself.

this means functions inside whatever.js has access to other helpers functions if it needs them, and should export functions it needs to be available as a helper by assigning it to a helpers.xxxx key

eg 


```javascript

module.exports = function (helpers) {
  
  
  helpers.whatever = function () {
    return helpers.something()+" whatever";
  }
  
}
```

to make these available in the browser, it's important that the first line of the file have no comments before `module.exports = `

in public/app.js if you include the line

```javascript
([[["lib/helpers/whatever.js"]]])(app.helpers);
```
it will be injected into app.js as follows 


```javascript
(function (helpers) {
  
  
  helpers.whatever = function () {
    return helpers.something()+" whatever";
  }
  

})(app.helpers);
```

alternatively, if you want to just load whatever is exported by whatever.js, this will work too

```javascript
var whatever = [[["lib/helpers/whatever.js"]]];

```
it will be injected into app.js as follows 

```javascript
var whatever = function (helpers) {
  
  
  helpers.whatever = function () {
    return helpers.something()+" whatever";
  }
  

};
```

This merge happens when any .js file is served for the first time by handler/static.js in the handlers.static.get.js() function
subsequent fetches are cached internally, unless they are changed on disk in the meantime.
