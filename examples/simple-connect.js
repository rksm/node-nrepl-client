/*global console,require*/

/*
 * This is an example of how to use nrepl-client. Running it with the command
 * below will also start an nrepl server via leiningen. This is not necessary if
 * you want to connect to an existing Clojure process. To see the details about
 * the server open src/nrepl-server.js
 *
 * Usage like
 *   node -e "require('../src/nrepl-server').start({port: 7889}, function() { require('./simple-connect'); });"
 */

var nreplClient = require('../src/nrepl-client');
var util = require("util");
var port = 7889;
var con = nreplClient.connect({port: port});

con.on("error", function(err) {
    console.error("error in nREPL client connection: ", err);
});

function cljEval(next) {
    var expr = '(+ 3 4)';
    con.eval(expr, function(err, result) {
        var value = result.reduce(function(result, msg) {
            return msg.value ? result + msg.value : result; }, "");
        console.log('%s => %s', expr, value);
        next();
    });
}

con.once('connect', function() {
    console.log('Connected! Going to evaluate expression...');
    cljEval(function() {
        console.log('... evaluating expression done!');
        con.end();
    });
});
