var bencode = require('bencode'),
    net = require('net'),
    async = require('async');

function uuid() { // helper
    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16); }).toUpperCase();
    return id;
}

// id -> send data mapping
// send data: {callback: FUNCTION}
var sendsInProgress = {};
function nreplSend(socket, msg, callback) {
    var id = msg.id || (msg.id = uuid()),
        sendData = sendsInProgress[msg.id] = {
            responses: [],
            errors: []
        };
    function dataHandler(data) {
        try {
            var bytesLeft = data.length;
            while (bytesLeft > 0) {
                var response = bencode.decode(data, 'utf8'),
                    encodedResponseLength = bencode.encode(response, 'utf8').length,
                    bytesLeft = data.length - encodedResponseLength;
                //console.log('raw ascii: ', data.toString('ascii'))
                //console.log('from clj: ', response);
                //console.log('received', data.length, 'decoded', encodedResponseLength, 'left', bytesLeft)
                sendData.responses.push(response);
                data = data.slice(encodedResponseLength);
            }
            if (response.status && response.status[0] === 'done') messageReceiveDone();
        } catch (e) {
            console.error('nrepl message receive error: ', e.stack || e);
            sendData.errors.push(e);
        }
    }
    function messageReceiveDone() {
        delete sendsInProgress[id];
        socket.removeListener('data', dataHandler);
        callback && callback(
            sendData.errors.length > 0 ? sendData.errors : null,
            sendData.responses);
    }
    socket.write(bencode.encode(msg), 'binary');
    socket.on('data', dataHandler);
}

function cljEval(socket, code, callback) {
    nreplSend(socket, {op: 'eval', "code": code}, function(err, result) {
        callback && callback(err,
            result && result.length && result[0].value ?
                result[0].value : null);
    });
}

function describe(socket, verbose, callback) {
    nreplSend(socket, {op: 'describe', 'verbose?': verbose ? 'true' : undefined}, function(err, result) {
        callback && callback(err, result && result.length ? result[0] : null);
    });
}

function connect(options) {
    var con = net.connect(options);
    con.eval = cljEval.bind(null, con);
    con.describe = describe.bind(null, con);
    return con;
}

// nreplSend(client, {op: 'describe', "verbose?": "true"})
// nreplSend(client, {op: 'eval', "code": "(+ 1 2)"})
// nreplSend(client, {op: 'describe'})

// client.write(enreplMsg.toString('ascii'), 'ascii')
// enreplMsg.toString('utf8')
// client.end()
// client

module.exports = {
    connect: connect
}
