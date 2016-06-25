var net = require('net');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

var fs = require("fs");
var contents = fs.readFileSync("config.json");
var config = JSON.parse(contents);

var USB_PORT = config.usb4.port;
var NET_PORT = config.server.port;
var NET_ADDRESS = config.server.address;

var clients = [];

var serialPort = new SerialPort(USB_PORT, {
    baudrate: 115200,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    parser: serialport.parsers.readline(";")
});

var client = new net.Socket();

client.connect(NET_PORT, NET_ADDRESS, function () {
    console.log('Client Connected'+USB_PORT);
});

client.on('data', function (data) {
    console.log(USB_PORT+' USB4 Received: ' + data);
    serialPort.write(data.toString());
});

serialPort.on("open", function () {
    console.log('Serial Port '+USB_PORT+' Open');
    serialPort.on('data', function (data) {
        console.log('USB Sent' + data.toString() + ";");
        client.write(data.toString() + ";");
    });
});

var server = net.createServer(function (socket) {
    socket.setKeepAlive(true,60000);
    clients.push(socket);
    console.log('Client Connected to Server');
    socket.on('data', function (data) {
        broadcast(data.toString(), socket);
        console.log('Server : ' + data.toString());
    });

    socket.on('end', function () {
        clients.splice(clients.indexOf(socket), 1);
        console.log('Client Disconnected');
    });

    socket.on("error", function(err) {
        clients.splice(clients.indexOf(socket), 1);
        console.log("Caught flash policy server socket error: ");
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
