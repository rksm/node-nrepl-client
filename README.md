# node.js nREPL client [![Build Status](https://travis-ci.org/rksm/node-nrepl-client.png?branch=master)](https://travis-ci.org/rksm/node-nrepl-client)

Connects node.js as a nrepl client to a [Clojure nrepl server](https://github.com/clojure/tools.nrepl).

This is different from [cljs-noderepl](https://github.com/bodil/cljs-noderepl)
and similar projects as it *does not connect node.js as the repl "target"* (so
that a nrepl Clojure client can eval code in a JS context) *but the other way
around* ;)


## Usage

To connect to a running nREPL server and send and receive an eval request do:

```js
var nreplClient = require('nrepl-client');
nreplClient.connect({port: 7889}).once('connect', function() {
    var expr = '(+ 3 4)';
    client.eval(expr, function(err, result) {
        console.log('%s => ', expr, err || result);
        client.end();
    });
});
```

For a more detailed example and to use node.js also to start an nREPL Clojure
process see [examples/simple-connect.js]().
```

## API

### `nrepl-client`

* `connect(options)`
  * Creates a [`net.Socket`](http://nodejs.org/api/net.html#net_class_net_socket)
    connection to an nREPL server. The connection object itself will have added
    methods, see below.
  * `options`: options from the [`net.connect`](http://nodejs.org/api/net.html#net_net_connect_options_connectionlistener) call.
  * returns a `net.Socket` clojure connection

* clojure connection
  * Wraps [nREPL messages](https://github.com/clojure/tools.nrepl#messages).
  * `clone([session,] callback)
  * `close([session,] callback)
  * `describe([verbose,] callback)
  * `eval(code, [session, id, evalFunc,] callback)
  * `interrupt(session, id, callback)
  * `loadFile(fileContent, [fileName, filePath,] callback)
  * `lsSessions(callback)
  * `stdin(stdin, callback)
  * `send(msgObj, callback)` sends a custom message

### `nrepl-client/nrepl-server`

* `start(options, callback)`
  * `options` options for configuring the nREPL server. Optional. `options == {startTimeout: NUMBER, verbose: BOOL, projectPath: STRING, hostname: STRING, port: NUMBER}`. See [nrepl-server.js](src/nrepl-server.js) for defaults.
  * `callback(err, serverState)` function called when the server is started. `serverState == {proc: PROCESS, hostname: STRING, port: NUMBER, started: BOOL, exited: BOOL, timedout: BOOL}`

* `stop(serverState, callback)`
  * `serverState` serverState returned from start
  * `callback(err)` function called when the server is stopped
