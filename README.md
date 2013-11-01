## Connects node.js to a Clojure nrepl server

## Usage

```js
var nreplClient = require('../index');
var util = require("util");
var port = 7888;

var con = nreplClient.connect({port: port});
con.once('connect', function() {
    console.log('Connected!');
    var expr = '(+ 3 4)';
    con.eval(expr, function(err, result) {
        console.log('%s -> %s', expr, result);
        con.end();
    });    
});

var con = nreplClient.connect({port: port});
con.once('connect', function() {
    console.log('Connected!');
    con.describe(true, function(err, result) {
        console.log(util.inspect(result, {depth: 5}));
        con.end();
    });    
});
```