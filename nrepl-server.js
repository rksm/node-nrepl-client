/*global console,require,module*/

/*
 * Depending on how you start the clojure nREPL server you don't need this.
 * This will start the minimal clojure example server from examples/nrepl-server/
 * Mainly used to testing.
 */

var path = require("path");
var spawn = require("child_process").spawn;
var kill = require('tree-kill');


var serverProc;
function startServer(port, thenDo, pathToProject) {
    pathToProject = pathToProject || path.join(__dirname, 'examples', 'nrepl-server');
    serverProc = spawn('lein', ['repl', ':headless', ':port', port], {cwd: pathToProject});

    // serverProc.on('exit', function(code) {
    var expectedOutput = 'nREPL server started on port ' + port;
    var output = "";
    serverProc.on('close', function(code) {
        console.log("nREPL server stopped with code %s: %s", code, output);
        serverProc = null;
    });

    serverProc.on('error', function(error) {
        console.log("nREPL server error %s", error);
    });

    // wait until the server produces output...
    function gatherOut(data) {
        output += data.toString();
        if (output.indexOf(expectedOutput) !== -1) {
            console.log('nREPL server started');
            thenDo && thenDo(null, serverProc);
        }
    }

    serverProc.stdout.on('data', gatherOut);
    serverProc.stderr.on('data', gatherOut);
    serverProc.stdout.pipe(process.stdout);
    serverProc.stderr.pipe(process.stdout);
}

function stopServer(port, thenDo) {
    if (!serverProc) {
        console.log("nREPL server shutdown");
        thenDo(null); return; }
    console.log("Stopping nREPL server with pid %s", serverProc.pid);
    kill(serverProc.pid, 'SIGKILL');
    thenDo(null);
}

module.exports = {
    startServer: startServer,
    stopServer: stopServer
};
