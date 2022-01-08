const net = require('net')
const jsonfile = require('jsonfile')
const winston = require('./config/winston.js')
//const cbus = require('./mergCbus.js');
const config = jsonfile.readFileSync('./config/config.json')

let fs = require("fs")
//let nodeConfig = fs.readFileSync("opcodes.json")
//let config = JSON.parse(nodeConfig)
const opcodesConfig = jsonfile.readFileSync("opcodes.json")
const opcodes = opcodesConfig['opcodes']

const JSON_SERVER_PORT = config.jsonServerPort
const CBUS_SERVER_ADDRESS = config.serverAddress
const CBUS_SERVER_PORT = config.cbusServerPort
const CBUS_MESSAGE_HEADER =":SB020N"
const CBUS_EVENT_MESSAGES = ["90","91"]

function decToHex(num, len) {
    return parseInt(num).toString(16).toUpperCase().padStart(len, '0')
}

exports.jsonServer = function () {

    let clients = [];

    let cbusClient = new net.Socket();

    cbusClient.connect(CBUS_SERVER_PORT, CBUS_SERVER_ADDRESS, function () {
        //console.log('Cbus Client Connected to ' + CBUS_SERVER_ADDRESS + ' on ' + CBUS_SERVER_PORT);
        winston.info({message: `JsonServer Connected to ${CBUS_SERVER_ADDRESS} on ${CBUS_SERVER_PORT}`})
    });

    cbusClient.on('data', function (data) {
        cbusClient.setKeepAlive(true, 60000);
        let outMsg = data.toString().split(";");
        for (let i = 0; i < outMsg.length - 1; i++) {
            //jsonClient.write(outMsg[i]+';');
            let jsonMsg = cbusFrame(outMsg[i]);
            //let cbusMsg = jsonMessage(jsonMsg)
            let output = JSON.stringify(jsonMsg)
            //console.log(`${outMsg[i]} ==> ${JSON.stringify(jsonMsg)} ==> ${cbusMsg}`);
            winston.info({message: `JsonServer Recived from Cbus to ${outMsg[i]} sent ${output} : `})
            //console.log('Clients : ' + clients.length);
            clients.forEach(function (client) {
                //console.log('Output to Client : ' + cbusFrame(outMsg[i]);
                client.write(output)
            });
        }
    });

    var server = net.createServer(function (socket) {
        socket.setKeepAlive(true, 60000);
        clients.push(socket);
        console.log('Client Connected to JSON Server');

        socket.on('data', function (data) {
            winston.info({message: `JsonServer Recived from JSON ${(data)} `})
            let indata = data.toString().replace(/}{/g,"};{")
            const outMsg = indata.toString().split(";")
            for (let i = 0; i < outMsg.length; i++) {
                //let outMsg = data.toString().split(";") //Sometimes multiple events appear in a single network package.
                //for (let i = 0; i < outMsg.length; i++) { //loop through each event.
                broadcast(outMsg[i], socket)
            }
            //}
        })

        socket.on('end', function () {
            clients.splice(clients.indexOf(socket), 1);
            console.log('Client Disconnected from Server');
        });

        socket.on("error", function (err) {
            clients.splice(clients.indexOf(socket), 1);
            console.log("JsonServer : Caught flash policy server socket error: ");
            console.log(err.stack);
        });

        function broadcast(data, sender) {
            let cbusMsg = jsonMessage(data)
            winston.info({message: `JsonServer : Broadcast ${data} sent ${cbusMsg}`})
            clients.forEach(function (client) {
                // Don't want to send it to sender
                if (client === sender)
                    return;
                client.write(cbusMsg);
            });
            cbusClient.write(cbusMsg);
        }
    })

    getOpcode = function (frame) {
        //return parseInt(frame.toString().substr(7,2), 16);
        return frame.toString().substr(7, 2);
    }

    function cbusFrame(msg) {
        let message = {}
        //let opcode = config.opcodes.filter(function (item) {
        //    return (item.id == getOpcode(msg));
        //});
        if (getOpcode(msg) in opcodes) {
            for (let i in opcodes[getOpcode(msg)].fields) {
                let field = opcodes[getOpcode(msg)].fields[i];
                //console.log(`Message ${JSON.stringify(field)}`)
                if (field.type == "num") {
                    message[field.name] = parseInt(msg.toString().substr(field.start, field.length), 16);
                } else {
                    message[field.name] = msg.toString().substr(field.start, field.length);
                }
                //message[field.name] = value;
            }
            message["mnemonic"] = opcodes[getOpcode(msg)].mnemonic;
            message["opcode"] = getOpcode(msg)
            if (CBUS_EVENT_MESSAGES.includes(getOpcode(msg))) {
                message["msgId"] = msg.toString().substr(9, 8)
            }
            if (getOpcode(msg) == "B6"){
                message["type"] = msg.toString().substr(13, 2) + msg.toString().substr(15, 2)
            }
            return message;
        } else {
            return `cbusFrame : ${getOpcode(msg)} Opcode not found`
            //console.log(`Unknown opcode : ${getOpcode(msg)}`)
        }
    }

    function jsonMessage(msg) {
        //var opcode = config.opcodes.filter(function (item) {
        //    return (item.mnemonic == json_msg.opcode);
        //});
        winston.info({message: `JsonServer jsonMessage Recived1 ${msg} `})
        let json_msg = JSON.parse(msg)
        //winston.info({message: `JsonServer jsonMessage Recived2 ${JSON.stringify(opcodes[json_msg.opcode])} `})
        if (json_msg.opcode in opcodes) {
            //winston.info({message: `JsonServer jsonMessage Recived3 ${JSON.stringify(opcodes[json_msg.opcode].fields)} `})
            //return opcode[0].id;
            let output = "";
            //json_msg.opcode = opcode[0].id;
            for (let i in opcodes[json_msg.opcode].fields) {
                let field = opcodes[json_msg.opcode].fields[i];
                //winston.info({message: `JsonServer jsonMessage Recived4 ${JSON.stringify(field)} `})
                if (field.type == "char") {
                    output += eval("json_msg." + field.name);
                } else {
                    let padded = "00000000" + eval("json_msg." + field.name).toString(16);
                    output += padded.substr(-field.length).toUpperCase();
                }
                //output += field.name;
            }
            return CBUS_MESSAGE_HEADER + output +";";
        } else {
            return `JsonServer jsonMessage : Opcode ${json_msg.opcode} not found`
            //console.log("Not Identified!")
        }
    }

    server.listen(JSON_SERVER_PORT)

}
