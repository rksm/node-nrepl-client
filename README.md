# node.js nREPL client [![Build Status](https://travis-ci.org/rksm/node-nrepl-client.png?branch=master)](https://travis-ci.org/rksm/node-nrepl-client)

Connects node.js to a [Clojure nrepl server](https://github.com/clojure/tools.nrepl).

## Usage

To connect to a running nREPL server and send and receive an eval request do:

```js
var nreplClient = require('nrepl-client'),
    con = nreplClient.connect({port: 7888});
con.once('connect', function() {
    con.eval('(+ 3 4)', function(err, result) {
        console.log('%s -> %s', expr, err || result);
        con.end();
    });    
});
```

To also start an nREPL server from node do:

```js
var nreplClient = require('nrepl-client');
var nreplServer = require('nrepl-client/nrepl-server');
var async = require("async");
var port = 7888;

async.series([
    function(next) { nreplServer.startServer(port, next); },
    function(next) {
        var con = nreplClient.connect({port: port});
        con.once('connect', function() {
            con.eval('(+ 3 4)', function(err, result) {
                console.log('eval result = %s', result);
                con.end(); next();
            });    
        });
    },
    function(next) { nreplServer.stopServer(port, next); }
], function() { console.log('Done'); });
```

## API

### `nrepl-client`

* `connect(options)`
  * Creates a [`net.Socket`](http://nodejs.org/api/net.html#net_class_net_socket)
    connection to an nREPL server
  * `options`: options from the [`net.connect`](http://nodejs.org/api/net.html#net_net_connect_options_connectionlistener)
    call.
  * returns a `net.Socket` clojure connection

* clojure connection
  * Wraps [nREPL messages](https://github.com/clojure/tools.nrepl#messages).
  * `eval(code, callback)`

### `nrepl-client/nrepl-server`

* `startServer(port, callback)`
  * `port` the port the nREPL server should be started on
  * `callback(err, server)` function called when the server is started

* `stopServer(port, callback)`
  * `port` port of nREPL server that should be stopped
  * `callback(err)` function called when the server is stopped
