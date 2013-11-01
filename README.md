## node.js nREPL client [![Build Status](https://travis-ci.org/rksm/node-nrepl-client.png?branch=master)](https://travis-ci.org/rksm/node-nrepl-client)

Connects node.js to a [Clojure nrepl server](https://github.com/clojure/tools.nrepl).

## Usage

```js
var nreplClient = require('../index');
var con = nreplClient.connect({port: 7888});
con.once('connect', function() {
    con.eval('(+ 3 4)', function(err, result) {
        console.log('%s -> %s', expr, result);
        con.end();
    });    
});
```