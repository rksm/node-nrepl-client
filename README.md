# node.js nREPL client [![Build Status](https://travis-ci.org/rksm/node-nrepl-client.png?branch=master)](https://travis-ci.org/rksm/node-nrepl-client)

Connects node.js as a nrepl client to a [Clojure nrepl server](https://github.com/clojure/tools.nrepl).

This is different from [cljs-noderepl](https://github.com/bodil/cljs-noderepl)
and similar projects as it *does not connect node.js as the repl "target"* (so
that a nrepl Clojure client can eval code in a JS context) *but the other way
around* ;)


## Usage

To connect to a running nREPL server and send and receive an eval request do:

```js
var client = require('nrepl-client').connect({port: 7888});
client.once('connect', function() {
    var expr = '(+ 3 4)';
    client.eval(expr, function(err, result) {
        console.log('%s -> %s', expr, err || result);
        client.end();
    });
});
```

To also start an nREPL server via `lein repl :headless` from node do:

```js
nreplServer.start({port: 7888}, function(err, serverState) {
    // server started!
    // Do stuff here..., e.g. nreplClient.connect(...)
    // When you are done:
     nreplServer.stop(serverState); 
});
```

## API

### `nrepl-client`

* `connect(options)`
  * Creates a [`net.Socket`](http://nodejs.org/api/net.html#net_class_net_socket)
    connection to an nREPL server
  * `options`: options from the [`net.connect`](http://nodejs.org/api/net.html#net_net_connect_options_connectionlistener) call.
  * returns a `net.Socket` clojure connection

* clojure connection
  * Wraps [nREPL messages](https://github.com/clojure/tools.nrepl#messages).
  * `eval(code, callback)`

### `nrepl-client/nrepl-server`

* `start(options, callback)`
  * `options` options for configuring the nREPL server. Optional. `options == {startTimeout: NUMBER, verbose: BOOL, projectPath: STRING, hostname: STRING, port: NUMBER}`. See [nrepl-server.js](src/nrepl-server.js) for defaults.
  * `callback(err, serverState)` function called when the server is started. `serverState == {proc: PROCESS, hostname: STRING, port: NUMBER, started: BOOL, exited: BOOL, timedout: BOOL}`

* `stop(serverState, callback)`
  * `serverState` serverState returned from start
  * `callback(err)` function called when the server is stopped
