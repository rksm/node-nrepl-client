/*global console,require*/

/*
 * This is an example of how to use nrepl-client. Before running this code it
 * is necessary to start a nREPL server, see examples/minimal-nrepl-server/
 *
 * Usage like
 *   node -e "require('../nrepl-server').startServer(7888, function() { require('./simple-connect'); });"
 */

var nreplClient = require('../index');
var util = require("util");
var port = 7888;
var con = nreplClient.connect({port: port});

function cljEval(next) {
    var expr = '(+ 3 4)';
    con.eval(expr, function(err, result) {
        console.log('%s => %s', expr, result);
        next();
    });
}

function cljInspect(next) {
    con.describe(true, function(err, result) {
        console.log(util.inspect(result, {depth: 1}));
        next();
    });
}

con.once('connect', function() {
    console.log('Connected!');
    cljInspect(function() {
        cljEval(function() {
            console.log('Done!');
            con.end();
        });
    });
});
