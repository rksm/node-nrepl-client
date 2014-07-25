/*
 * Depending on how you start the clojure nREPL server you don't need this.
 * This will start the minimal clojure example server from examples/nrepl-server/
 * Mainly used to testing.
 */

var async = require("async");
var path = require("path");
var exec = require("child_process").exec;
var spawn = require("child_process").spawn;
var kill = require('tree-kill');


var serverProc;
function startServer(port, thenDo, pathToProject) {
    pathToProject = pathToProject || path.join(__dirname, 'examples', 'nrepl-server');
    serverProc = spawn('lein', ['repl', ':headless', ':port', port], 
        {cwd: pathToProject});
    serverProc.on('exit', function(code) {
        console.log("nREPL server stopped with code %s: %s", code, output);
        serverProc = null;
    });
    // wait until the server produces output...
    var expectedOutput = 'nREPL server started on port ' + port;
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
    kill(serverProc.pid, 'SIGKILL');
    thenDo(null);
}

module.exports = {
    startServer: startServer,
    stopServer: stopServer
}