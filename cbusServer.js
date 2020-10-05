'use strict';

const net = require('net');
const jsonfile = require('jsonfile')
const serialport = require('serialport');
const parsers = serialport.parsers;
const config = jsonfile.readFileSync('./config.json')
const USB_PORT = config.usb4.port;
const NET_PORT = config.server.port;
const NET_ADDRESS = config.server.address;
const DECIMALEVENTS = config.console.decimaleventparse;

var clients = [];

const parser = new parsers.Readline({
    delimiter: ';'
})

const serialPort = new serialport(USB_PORT, {
    baudRate: 115200,
    dataBits: 8,
    parity: 'none',
    stopBits: 1
});

function addZero(x, n) {
    while (x.toString().length < n) {
        x = "0" + x;
    }
    return x;
}

function relativeTime() {
    var d = new Date();
    var h = addZero(d.getHours(), 2);
    var m = addZero(d.getMinutes(), 2);
    var s = addZero(d.getSeconds(), 2);
    var ms = addZero(d.getMilliseconds(), 3);
    return h + ":" + m + ":" + s + ":" + ms + " ";
}

function displayDataString(data) {
    var dataAsString = data.toString();
    var dataarray = dataAsString.split(";"); // get data string into array of can messages in case of multiple buffered messages in 1 string
    // console.log(" data array is : " + dataarray)

    var x;
    for (x in dataarray) { // loop through array of can frames
        var frame = (dataarray[x]);
        while (frame.charAt(0) === ':') {
            frame = frame.substr(1);
        }

        while (frame.charAt(frame.length - 1) === ";") {
            frame = frame.slice(0, -1);
        }

        if (frame.length > 0) {
            var newOutPut = frame + "  opc: " + parseInt(opc, 16) + " ";
            var opc = frame.substr(6, 2);
            if (opc == 98 || opc == 99 || opc == 90 || opc == 91) { // hex opc values
                if (opc == 98) {
                    newOutPut += "Short Event On "
                }
                if (opc == 99) {
                    newOutPut += "Short Event Off "
                }
                if (opc == 90) {
                    newOutPut += "Long Event On "
                }
                if (opc == 91) {
                    newOutPut += "Long Event Off "
                }

                newOutPut += " Node: " + parseInt(frame.substr(8, 4), 16);
                newOutPut += " Event: " + parseInt(frame.substr(12), 16);
            }

            if (opc == 23) { // hex value
                newOutPut += "Keepalive Session " + parseInt(frame.substr(8, 2), 16);
            }

            console.log(newOutPut);
        } // ends check for > 0 frame
    } // finish multiple can message in big frame string loop

    console.log("_______________________________________________________");
    return;
}


console.log(relativeTime() + "Starting MERG CBUS Server");

if (DECIMALEVENTS == 1) {
    console.log("On / Off events in Decimal format");
}


serialPort.pipe(parser);

var client = new net.Socket();


client.connect(NET_PORT, NET_ADDRESS, function () {
    console.log(relativeTime() + 'USB4 Client Connected on ' + USB_PORT);
});


client.on('data', function (data) {
    var outMsg = data.toString().split(";")
    for (var i = 0; i < outMsg.length - 1; i++) {
        serialPort.write(outMsg[i].toString()+';');
        if (DECIMALEVENTS == 1) {
            console.log(relativeTime() + USB_PORT + ' USB4 Received: ' + outMsg[i]);
            displayDataString(outMsg[i]);
        } else {
            console.log(USB_PORT + ' USB4 Received: ' + outMsg[i]);
        }
    }
});


serialPort.on("open", function () {
    console.log(relativeTime() + 'Serial Port ' + USB_PORT + ' Open');
});


parser.on('data', function (data) {
    client.write(data.toString() + ";")
    if (DECIMALEVENTS == 1) {
        console.log(relativeTime() + 'USB Received (Parsed) ' + data.toString());
        displayDataString(data);
    } else {
        console.log('USB Received (Parsed) ' + data.toString() + ";")
    }
})

serialPort.on("error", function (err) {
    console.log(relativeTime() + 'Serial port error: ' + err.message);
});

var server = net.createServer(function (socket) {
    socket.setKeepAlive(true, 60000);
    clients.push(socket);
    console.log(relativeTime() + 'Client Connected to Server: ' + socket.remoteFamily + " " + socket.localAddress + ' Port: ' + socket.localPort);

    socket.on('data', function (data) {
        let outMsg = data.toString().split(";");
        for (let i = 0; i < outMsg.length - 1; i++) {
            broadcast(outMsg[i].toString()+';', socket);

            if (DECIMALEVENTS == 1) {
                console.log(relativeTime() + socket.localAddress + " " + outMsg[i].toString());
                displayDataString(outMsg[i]);
            } else {
                console.log('Server : ' + outMsg[i].toString());
            }
        }
    });

    socket.on('end', function () {
        clients.splice(clients.indexOf(socket), 1);
        console.log(relativeTime() + 'Client Disconnected');
    });

    socket.on("error", function (err) {
        clients.splice(clients.indexOf(socket), 1);
        console.log(relativeTime() + "Caught flash policy server socket error: ");
        console.log(err.stack);
    });

    function broadcast(data, sender) {
        clients.forEach(function (client) {
            // Don't want to send it to sender
            if (client === sender)
                return;
            client.write(data);
        });
    }
    ;
});

server.listen(NET_PORT);
