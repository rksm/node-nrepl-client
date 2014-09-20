/*global console,require,module,process,__dirname,setTimeout,clearTimeout*/

/*
 * Depending on how you start the clojure nREPL server you don't need this.
 * This will start a minimal nrepl via `lein repl :headless` to which the node
 * client will connect.
 *
 */

var path = require("path");
var ps = require("child_process");
var util = require("util");
var merge = util._extend;

// note, the JVM will stick around when we just kill the spawning process
// so we have to do a tree kill for the process. unfortunately the "tree-kill"
// lib is currently not working on Mac OS, so we need this little hack:
var kill = (process.platform === 'darwin') ?
    function(pid, signal) {
        ps.exec(util.format("ps a -o pid -o ppid |"
                          + "grep %s | awk '{ print $1 }' |"
                          + "xargs kill -s %s", pid, signal || 'SIGTERM'));
    } : require('tree-kill');


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Server start implementation. Tries to detect timeouts
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function startSentinel(options, serverState, thenDo) {
    var proc = serverState.proc,
        thenDoCalled = false;

    if (options.verbose) {
        proc.on('close', function(code) { console.log("nREPL server stopped with code %s: %s", code); });
        proc.on('error', function(error) { console.log("nREPL server error %s", error); });
        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stdout);
    }

    proc.on('close', function(_) { serverState.exited = true; });
    checkOutputForServerStart('nREPL server started on');

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // helper

    function serverStartDance(serverOutput) {
        grabHostnameAndPortFromOutput(serverOutput);
        serverState.started = true;
        thenDoCalled = true;
        options.verbose && console.log('nREPL server started');
        thenDo && thenDo(null, serverState);
    }

    function timeout() {
        if (thenDoCalled) return;
        thenDoCalled = true;
        thenDo && thenDo(new Error("nrepl server start timeout"), null);
    }

    function checkOutputForServerStart(expectedOutput) {
        var timeoutProc = setTimeout(timeout, options.startTimeout),
            outListener = gatherOut("stdout", check),
            errListener = gatherOut("stderr", check);
        proc.stdout.on('data', outListener);
        proc.stderr.on('data', errListener);

        function check(string) {
            if (string.indexOf(expectedOutput) === -1) return;
            proc.stdout.removeListener('data', outListener);
            proc.stderr.removeListener('data', errListener);
            clearTimeout(timeoutProc);
            serverStartDance(string);
        }
    }

    function gatherOut(type, subscriber) {
        return function(data) {
            serverState[type] = Buffer.concat([serverState[type], data]);
            subscriber(String(serverState[type]));
        }
    }

    function grabHostnameAndPortFromOutput(output) {
        if (!output) return
        var match = output.match("on port ([0-9]+) on host ([^\s]+)");
        if (!match) return;
        if (match[1]) serverState.port = parseInt(match[1]);
        if (match[2]) serverState.hostname = match[2];
    }

}

function startServer(hostname, port, projectPath, thenDo) {
    try {
        var procArgs = ["repl", ":headless"];
        if (hostname) procArgs = procArgs.concat([':host', hostname]);
        if (port) procArgs = procArgs.concat([':port', port]);
        var proc = ps.spawn('lein', procArgs, {cwd: projectPath});
    } catch (e) { thenDo(e, null); return; }
    thenDo(null, {
        proc: proc,
        stdout: new Buffer(""),
        stderr: new Buffer(""),
        hostname: undefined, port: undefined, // set when started
        started: false,
        exited: false,
        timedout: undefined
    });
}


// -=-=-=-=-=-=-=-=-=-=-
// the actual interface
// -=-=-=-=-=-=-=-=-=-=-

var defaultOptions = {
    startTimeout: 10*1000, // milliseconds
    verbose: false,
    projectPath: process.cwd(),
    // if host / port stay undefined they are choosen by leiningen
    hostname: undefined,
    port: undefined
}

function start(options, thenDo) {
    options = merge(merge({}, defaultOptions), options);
    startServer(options.hostname, options.port,
                options.projectPath, function(err, serverState) {
                    if (err) thenDo(err, null);
                    else startSentinel(options, serverState, thenDo);
                });
}

function stop(serverState, thenDo) {
    if (serverState.exited) { thenDo(null); return; }
    // FIXME what if when kill doesn't work? At least attach to `close` and
    // throw a time out error...
    kill(serverState.proc.pid, 'SIGTERM');
    serverState.proc.once('close', function() {
        console.log("Stopped nREPL server with pid %s", serverState.proc.pid);
        thenDo && thenDo(null);
    });
}

module.exports = {start: start, stop: stop};
