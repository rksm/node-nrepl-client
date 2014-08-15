/*global console,require*/

var bencode = require('bencode'),
    net = require('net'),
    stream = require('stream'),
    events = require("events");;

function uuid() { // helper
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, replacer).toUpperCase();

    function replacer(c) {
        var r = Math.random()*16|0,
            v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    }
}

// id -> send data mapping
// send data: {callback: FUNCTION}
var sendsInProgress = {};

function createMessageStream(socket) {
    var messageStream = new stream.Transform();
    messageStream._writableState.objectMode = false;
    messageStream._readableState.objectMode = true;
    messageStream._bytesLeft = 0;
    messageStream._messageCache = [];

    messageStream._transform = function(chunk, encoding, callback) {
console.log("Client got " + chunk);
        this._bytesLeft += chunk.length;
        var messages = [];
        try {
            while (this._bytesLeft > 0) {
                var response = bencode.decode(chunk, 'utf8');
                var encodedResponseLength = bencode.encode(response, 'utf8').length;
                this._bytesLeft -= encodedResponseLength;
                this.push(response);
                this._messageCache.push(response);
                chunk = chunk.slice(encodedResponseLength);
            }
            if (response.status && response.status[0] === 'done') {
                this.emit("messageSequence", this._messageCache);
                this._messageCache = [];
            }
        } catch (e) {
            this.emit('error', e);
            console.error('nrepl message receive error: ', e.stack || e);
        }
        callback();
    };

    return socket.pipe(messageStream);
}

function nreplSend(socket, messageStream, msg, callback) {
    var id = msg.id || (msg.id = uuid()), errors = [];
    socket.write(bencode.encode(msg), 'binary');

    function errHandler(err) { errors.push(err); }
    messageStream.on('error', errHandler);
    messageStream.once('messageSequence', function(messages) {
        socket.removeListener('error', errHandler);
        callback && callback(errors.length > 0 ? errors : null, messages);
    });
}

function cljEval(socket, messageStream, code, callback) {
    nreplSend(socket, messageStream, {op: 'eval', "code": code}, function(err, result) {
        callback && callback(err,
            result && result.length && result[0].value ?
                result[0].value : null);
    });
}

function describe(socket, messageStream, verbose, callback) {
    nreplSend(socket, messageStream, {op: 'describe', 'verbose?': verbose ? 'true' : undefined}, function(err, result) {
        callback && callback(err, result && result.length ? result[0] : null);
    });
}

function connect(options) {
console.log("connect", options);
    var con = net.connect(options);
    var messageStream = createMessageStream(con);
    if (options.verbose) {
        messageStream.on("data", function(message) { console.log("nREPL message: ", message); });
    }
    con.eval = cljEval.bind(null, con, messageStream);
    con.describe = describe.bind(null, con, messageStream);
    con.messageStream = messageStream;
    return con;
}

module.exports = {
    connect: connect
}
