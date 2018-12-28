
# helpers

**lib/helpers** contains **javascript** files that are normally loaded by **lib/helper.js**, using a require clause, using whatever convention is appropriate.

*examples of loading submodules*   

```javascript

// load the valiate sub library
lib.validate = require('./helpers/validate.js');

// merge the stripe sub library
require('./helpers/stripe.js')(lib,url,https,path,querystring,config);


```

**shared browser shared helper modules**

if a javascript file is crafted using this specific format:

```javascript

module.exports = function (helpers) {


}
```

it can be loaded into public/app.js for use in the browser using a line like this:


```javascript
([[["lib/helpers/html_merge.js"]]])(app.helpers);
```

which will expand to 

```javascript

(function (helpers) {


})(app.helpers);

```
in the browser 

(simple string substition happens in node before the file is first served, and cached for subsequent servings.)

obviously this file can also be loaded in node using the same method:


```javascript
require("./validate_forms")(helpers);
```

(note that this path is relative to the parent include file - since this example is being loaded by lib/helpers/validate.js, there is no need to specify a path other than ".", as it's stored in the same folder)
