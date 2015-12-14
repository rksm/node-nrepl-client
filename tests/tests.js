/*global console,require,module,setTimeout,clearTimeout*/

var Promise = require('bluebird');
var nreplClient = require('../src/nrepl-client');
var nreplServer = Promise.promisifyAll(require('../src/nrepl-server'));

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
        nreplServer.startAsync(serverOpts).then(function (serverState) {
            server = serverState;
            client = Promise.promisifyAll(nreplClient.connect({
                port: serverState.port,
                verbose: true
            }));
            console.log("client connecting");
            return client.onceAsync('connect');
        }).then(function () {
            console.log("client connected");
            callback();
        });
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

    testEval: function (test) {
        createTimeout(test);
        client.evalAsync('(+ 3 4)').then(function(messages) {
            test.equal(messages[0].value, '7');
            test.deepEqual(messages[1].status, ['done']);
            return client.evalAsync('(throw (RuntimeException. "foo"))');
        }).then(function (messages) {
            test.equal(messages.length, 3);
            test.equal(messages[0].ex, 'class java.lang.RuntimeException');
            test.deepEqual(messages[0].status, ['eval-error']);
            test.ok(/^RuntimeException foo/.test(messages[1].err));
            test.deepEqual(messages[2].status, ['done']);
        }).catch(function (err) {
            test.ok(!err, 'Got errors: ' + err);
        }).finally(function () {
            test.done();
        });
    }
};

module.exports = tests;
