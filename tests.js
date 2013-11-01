var nreplClient = require('./index');
var nreplServer = require('./nrepl-server');
var async = require("async");
var path = require("path");
var exec = require("child_process").exec;
var port = 7888, connections = [], timeoutDelay = 5*1000, timeout;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// to clean up...
var connect = nreplClient.connect;
nreplClient.connect = function() {
    var con = connect.apply(nreplClient, arguments);
    con.on('close', function() {
        console.log('nREPL client connection closed');
    })
    connections.push(con);
    return con;
};

function createTimeout(test) {
    return timeout = setTimeout(function() {
        test.ok(false, 'timeout');
        test.done();
    }, timeoutDelay);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var tests = {
    setUp: function (callback) {
        nreplServer.startServer(port, callback)
    },
    tearDown: function (callback) {
        async.forEach(connections, function(con, next) {
            con.once('close', next);
            con.end();
        }, function() {
            clearTimeout(timeout);
            nreplServer.stopServer(port, callback);
        });
    },
    testSimpleEval: function (test) {
        test.expect(2);
        createTimeout(test);
        var con = nreplClient.connect({port: port});
        async.waterfall([
            con.once.bind(con, 'connect'),
            con.eval.bind(con, '(+ 3 4)'),
            function(result, next) { test.equal(result, '7'); next(); }
        ], function(err, arg) {
            test.ok(!err, 'Got errors: ' + err);
            test.done();
        });
    }
};

module.exports = tests;
