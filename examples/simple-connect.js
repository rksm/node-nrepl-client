/*
 * This is an example of how to use nrepl-client. Before running this code it
 * is necessary to start a nREPL server, see examples/minimal-nrepl-server/
 *
 */

var nreplClient = require('../index');
var async = require("async");
var util = require("util");
var port = 7888;
var con = nreplClient.connect({port: port});

function cljEval(next) {
    var expr = '(+ 3 4)';
    con.eval(expr, function(err, result) {
        console.log('%s -> %s', expr, result);
        next();
    });    
}

function cljInspect(next) {
    con.describe(true, function(err, result) {
        console.log(util.inspect(result, {depth: 5}));
        next();
    });
}

con.once('connect', function() {
    console.log('Connected!');
    async.series([cljEval, cljEval], function(err) {
        console.log('Done!');
        con.end();
    })
});
