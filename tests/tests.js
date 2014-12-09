/*global console,require,module,setTimeout,clearTimeout*/

var nreplClient = require('../src/nrepl-client');
var nreplServer = require('../src/nrepl-server');
var async = require("async");

var exec = require("child_process").exec;

var serverOpts = {port: 7889, verbose: true, startTimeout: 20*1000},
    timeoutDelay = 10*1000,
    timeoutProc, client, server;

function createTimeout(test) {
    return timeoutProc = setTimeout(function() {
        test.ok(false, 'timeout');
        test.done();
    }, timeoutDelay);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var tests = {

    setUp: function (callback) {
        async.waterfall([
            function(next) { nreplServer.start(serverOpts, next); },
            function(serverState, next) {
                server = serverState;
                client = nreplClient.connect({
                    port: serverState.port,
                    verbose: true
                });
                console.log("client connecting");
                client.once('connect', function() {
                    console.log("client connected");
                    next();
                });
            }
        ], callback);
    },

    tearDown: function (callback) {
        // exec("bash -c 'ps aux | grep \":port 7889\" | grep -v grep | awk \"{ print $2 }\" | xargs kill -9'");
        if (!client) {
            console.error("client undefined in tearDown?!");
            callback(); return;
        }
        client.once('close', function() {
            clearTimeout(timeoutProc);
            nreplServer.stop(server, callback);
        });
        client.end();
    },

    testSimpleEval: function (test) {
        test.expect(3); createTimeout(test);
        client.eval('(+ 3 4)', function(err, messages) {
            console.log("in simple eval");
            console.log(messages);
            test.ok(!err, 'Got errors: ' + err);
            test.equal(messages[0].value, '7');
            test.deepEqual(messages[1].status, ['done']);
            test.done();
        });
    }
};

module.exports = tests;
