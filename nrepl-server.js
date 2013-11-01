/*
 * Depending on how you start the clojure nREPL server you don't need this.
 * This will start the minimal clojure example server from examples/nrepl-server/
 * Mainly used to testing.
 */

var async = require("async");
var path = require("path");
var exec = require("child_process").exec;

var serverProc;
function startServer(port, thenDo) {
    serverProc = exec('lein run', {cwd: path.join(__dirname, 'examples/nrepl-server')});
    serverProc.on('exit', function(code) {
        console.log("nREPL server stopped with code %s: %s", code, output);
        serverProc = null;
    });
    // wait until the server produces output...
    var expectedOutput = "#'lively-connect.core/server";
    var output = "";
    function gatherOut(data) {
        output += data.toString();
        if (output.indexOf(expectedOutput) !== -1) {
            console.log('nREPL server started');
            thenDo(null, serverProc);
        }
    }
    serverProc.stdout.on('data', gatherOut);
    serverProc.stderr.on('data', gatherOut);
}

function stopServer(port, thenDo) {
    if (!serverProc) {
        console.log("nREPL server shutdown");
        thenDo(null); return; }
    exec('/bin/bash -c "kill -9 `lsof -i tcp:' + port + ' -t`"', thenDo);
}

module.exports = {
    startServer: startServer,
    stopServer: stopServer
}