var nreplClient = require('./index');
var async = require("async");
var port = 7888, connections = [], timeoutDelay = 5*1000, timeout;

// to clean up...
var connect = nreplClient.connect;
nreplClient.connect = function() {
    var con = connect.apply(nreplClient, arguments);
    connections.push(con);
    return con;
};

function createTimeout(test) {
    return timeout = setTimeout(function() {
        test.ok(false, 'timeout');
        test.done();
    }, timeoutDelay);
}

var tests = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        while (connections.length) connections.shift().end();
        clearTimeout(timeout);
        callback();
    },
    testSimpleEval: function (test) {
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
