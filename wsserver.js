const socketIO = require('socket.io');
const winston = require('winston');		// use config from root instance
const fs = require('fs');

const jsonfile = require('jsonfile')
const packageFile = jsonfile.readFileSync('./package.json')

const admin = require('./merg/mergAdminNode.js')


function wsserver(LAYOUT_NAME, httpserver, NET_ADDRESS,NET_PORT) {
    checkLayoutExists(LAYOUT_NAME)
    let layoutDetails = jsonfile.readFileSync('config/'+LAYOUT_NAME + "/layoutDetails.json")
    const io = socketIO(httpserver); 
    const programNode = require('./merg/programNode.js')(NET_ADDRESS, NET_PORT)
    let node = new admin.cbusAdmin(LAYOUT_NAME, NET_ADDRESS, NET_PORT);


    io.on('connection', function(socket){
		winston.debug({message: 'a user connected'});
        node.cbusSend(node.QNN())
        io.emit('layoutDetails', layoutDetails)
        socket.on('QUERY_ALL_NODES', function(){
			winston.debug({message: 'QUERY_ALL_NODES'});
            node.cbusSend(node.QNN())
        })
        socket.on('REQUEST_ALL_NODE_PARAMETERS', function(data){ //Request Node Parameter
			winston.debug({message: `REQUEST_ALL_NODE_PARAMETERS ${JSON.stringify(data)}`});
            if (data.delay === undefined) {
                data.delay = 100
            }
            for (let i = 0; i <= data.parameters; i++) {
                let time = i*data.delay
                setTimeout(function() {node.cbusSend(node.RQNPN(data.nodeId, i))},time)
            }
        })
        socket.on('RQNPN', function(data){ //Request Node Parameter
			winston.debug({message: `RQNPN ${JSON.stringify(data)}`});
            node.cbusSend(node.RQNPN(data.nodeId, data.parameter))
        })
        socket.on('REQUEST_ALL_NODE_VARIABLES', function(data){
			winston.debug({message: `REQUEST_ALL_NODE_VARIABLES ${JSON.stringify(data)}`});
            if (data.start === undefined) {
                data.start = 1
            }
            if (data.delay === undefined) {
                data.delay = 100
            }
            let finish = data.variables + data.start -1
            let increment = 1
            for (let i = data.start; i <= finish; i++) {
                let time = increment*data.delay
                setTimeout(function() {node.cbusSend(node.NVRD(data.nodeId, i))},time)
                increment +=1
            }
        })
        socket.on('REQUEST_NODE_VARIABLE', function(data){
			winston.debug({message: `REQUEST_NODE_VARIABLE ${JSON.stringify(data)}`});
            node.cbusSend(node.NVRD(data.nodeId, data.variableId))
        })
        socket.on('UPDATE_NODE_VARIABLE', function(data){
            node.cbusSend(node.NVSET(data.nodeId, data.variableId, data.variableValue))
			winston.debug({message: `UPDATE_NODE_VARIABLE ${JSON.stringify(data)}`});
            setTimeout(function() {node.cbusSend(node.NVRD(data.nodeId, data.variableId))},100)
        })
        socket.on('UPDATE_NODE_VARIABLE_IN_LEARN_MODE', function(data){
			winston.debug({message: `NVSET-learn ${JSON.stringify(data)}`});
            node.cbusSend(node.NNLRN(data.nodeId))
            node.cbusSend(node.NVSET(data.nodeId, data.variableId, data.variableValue))
            node.cbusSend(node.NNULN(data.nodeId))
            node.cbusSend(node.NVRD(data.nodeId, data.variableId))
            node.cbusSend(node.NNULN(data.nodeId))
        })
        socket.on('REQUEST_ALL_NODE_EVENTS', function(data){
			winston.debug({message: `REQUEST_ALL_NODE_EVENTS ${JSON.stringify(data)}`});
            node.cbusSend(node.NERD(data.nodeId))
        })
        socket.on('REQUEST_ALL_EVENT_VARIABLES', function(data){
			winston.debug({message: `REQUEST_ALL_EVENT_VARIABLE ${JSON.stringify(data)}`});
            if (data.delay === undefined) {
                data.delay = 100
            }
            for (let i = 0; i <= data.variables; i++) {
                let time = i*data.delay
                setTimeout(function() {node.cbusSend(node.REVAL(data.nodeId, data.eventIndex, i))},time)
            }
        })
        socket.on('REQUEST_EVENT_VARIABLE', function(data){
			winston.debug({message: `REQUEST_EVENT_VARIABLE ${JSON.stringify(data)}`});
            node.cbusSend(node.REVAL(data.nodeId, data.eventIndex, data.eventVariableId))
        })
        socket.on('UPDATE_EVENT_VARIABLE', function(data){
			winston.debug({message: `EVLRN ${JSON.stringify(data)}`});
            node.cbusSend(node.NNLRN(data.nodeId))
            node.cbusSend(node.EVLRN(data.eventName, data.eventVariableId, data.eventVariableValue))
            node.cbusSend(node.NNULN(data.nodeId))
            node.cbusSend(node.REVAL(data.nodeId, data.eventIndex, data.eventVariableId))
            node.cbusSend(node.NNULN(data.nodeId))
            node.cbusSend(node.NERD(data.nodeId))
            node.cbusSend(node.RQEVN(data.nodeId))
        })
        socket.on('ACCESSORY_LONG_ON', function(data){
			winston.debug({message: `ACCESSORY_LONG_ON ${JSON.stringify(data)}`});
            node.cbusSend(node.ACON(data.nodeId, data.eventId))
        })
        socket.on('ACCESSORY_LONG_OFF', function(data){
			winston.debug({message: `ACCESSORY_LONG_OFF ${JSON.stringify(data)}`});
            node.cbusSend(node.ACOF(data.nodeId, data.eventId))
        })
        socket.on('ACCESSORY_SHORT_OFF', function(data){
			winston.debug({message: `ACCESSORY_SHORT_OFF ${JSON.stringify(data)}`});
            node.cbusSend(node.ASOF(data.nodeId, data.deviceNumber))
        })
        socket.on('ACCESSORY_SHORT_ON', function(data){
			winston.debug({message: `ACCESSORY_SHORT_ON ${JSON.stringify(data)}`});
            node.cbusSend(node.ASON(data.nodeId, data.deviceNumber))
        })
        socket.on('TEACH_EVENT', function(data){
			winston.debug({message: `EVLRN ${JSON.stringify(data)}`});
            node.cbusSend(node.NNLRN(data.nodeId))
            node.cbusSend(node.EVLRN(data.eventName, data.eventId, data.eventVal))
            node.cbusSend(node.NNULN(data.nodeId))
            node.cbusSend(node.NNULN(data.nodeId))
            node.cbusSend(node.NERD(data.nodeId))
            node.cbusSend(node.RQEVN(data.nodeId))
        })
        socket.on('REMOVE_NODE', function(data){
            winston.debug({message: `REMOVE_NODE ${JSON.stringify(data)}`});
            node.removeNode(data.nodeId)
        })
        socket.on('REMOVE_EVENT', function(data){
			winston.debug({message: `REMOVE_EVENT ${JSON.stringify(data)}`});
            node.cbusSend(node.NNLRN(data.nodeId))
            node.cbusSend(node.EVULN(data.eventName))
            node.cbusSend(node.NNULN(data.nodeId))
            node.removeNodeEvents(data.nodeId)
            node.cbusSend(node.NERD(data.nodeId))
            node.cbusSend(node.RQEVN(data.nodeId))
        })
        socket.on('CLEAR_NODE_EVENTS', function(data){
			winston.debug({message: `CLEAR_NODE_EVENTS ${data.nodeId}`});
            node.removeNodeEvents(data.nodeId);
        })
        socket.on('REFRESH_EVENTS', function(){
			winston.debug({message: `REFRESH_EVENTS`});
            node.refreshEvents();
        })
        
        socket.on('UPDATE_LAYOUT_DETAILS', function(data){
			winston.debug({message: `UPDATE_LAYOUT_DETAILS ${JSON.stringify(data)}`});
            layoutDetails = data
            jsonfile.writeFileSync('config/'+ LAYOUT_NAME + '/layoutDetails.json', layoutDetails, {spaces: 2, EOL: '\r\n'})
            io.emit('layoutDetails', layoutDetails)
        })
        
        socket.on('CLEAR_CBUS_ERRORS', function(data){
			winston.debug({message: `CLEAR_CBUS_ERRORS`});
            node.clearCbusErrors()
        })
		
        socket.on('REQUEST_VERSION', function(){
			winston.debug({message: `REQUEST_VERSION ${JSON.stringify(packageFile)}`});
            const versionArray = packageFile.version.toString().split(".");
			let version = {
				'major': versionArray[0],
				'minor': versionArray[1],
				'patch': versionArray[2],
				}

            io.emit('VERSION', version)
        })

        socket.on('PROGRAM_NODE', function(data){
            let buff = Buffer.from(data.encodedIntelHex, 'base64');
            let intelhexString = buff.toString('ascii');
            winston.debug({message: `PROGRAM_NODE; intel hex ` + intelhexString});

            programNode.program(data.nodeNumber, data.cpuType, data.flags, intelhexString);
        })
		
        
        socket.on('PROGRAM_BOOT_MODE', function(data){
            let buff = Buffer.from(data.encodedIntelHex, 'base64');
            let intelhexString = buff.toString('ascii');
            winston.debug({message: `PROGRAM_BOOT_MODE; intel hex ` + intelhexString});

            programNode.programBootMode(data.cpuType, data.flags, intelhexString);
        })
		
    });


    node.on('events', function (events) {
		//winston.debug({message: `Events :${JSON.stringify(events)}`});
        io.emit('events', events);
    })

    node.on('nodes', function (nodes) {
		winston.debug({message: `Nodes Sent :${JSON.stringify(nodes)}`});
        io.emit('nodes', nodes);
    })

    node.on('cbusError', function (cbusErrors) {
		winston.debug({message: `CBUS - ERROR :${JSON.stringify(cbusErrors)}`});
        io.emit('cbusError', cbusErrors);
    })

    node.on('dccError', function (error) {
		winston.debug({message: `CBUS - ERROR :${JSON.stringify(error)}`});
        io.emit('dccError', error);
    })

    node.on('cbusNoSupport', function (cbusNoSupport) {
		winston.debug({message: `CBUS - Op Code Unknown : ${cbusNoSupport.opCode}`});
        io.emit('cbusNoSupport', cbusNoSupport);
    })

    node.on('dccSessions', function (dccSessions) {
        io.emit('dccSessions', dccSessions);
    })

    node.on('requestNodeNumber', function () {
        if (layoutDetails.layoutDetails.assignId) {
            const newNodeId = parseInt(layoutDetails.layoutDetails.nextNodeId)
            winston.debug({message: `requestNodeNumber : ${newNodeId}`});
            node.cbusSend(node.SNN(newNodeId))
            layoutDetails.layoutDetails.nextNodeId = newNodeId + 1
            jsonfile.writeFileSync('config/' + LAYOUT_NAME + '/layoutDetails.json', layoutDetails, {
                spaces: 2,
                EOL: '\r\n'
            })
            io.emit('layoutDetails', layoutDetails)
            node.cbusSend(node.QNN())
        }
    })

    node.on('cbusTraffic', function (data) {
		winston.debug({message: `cbusTraffic : ` + data.direction + " " + data.raw + " " + data.translated});
        io.emit('cbusTraffic', data);
    })

    programNode.on('programNode', function (data) {
		winston.info({message: `WSSERVER: 'programNode' : ` + data});
        io.emit('PROGRAM_NODE', data);
    })

}

function checkLayoutExists(layoutName) {
            var directory = "./config/" + layoutName + "/"
            
            // check if directory exists
            if (fs.existsSync(directory)) {
                winston.debug({message: `checkLayoutExists: ` + layoutName + ` Directory exists`});
            } else {
                winston.debug({message: `checkLayoutExists: ` + layoutName + ` Directory not found - creating new one`});
                fs.mkdir(directory, function(err) {
                  if (err) {
                    console.log(err)
                  } else {
                    console.log("New directory successfully created.")
                  }
                })            
            }
            
            // check if nodeConfig file exists
            if (fs.existsSync(directory + 'nodeConfig.json')) {
                winston.debug({message: `nodeConfig:  file exists`});
            } else {
                winston.debug({message: `nodeConfig: file not found - creating new one`});
                const nodeConfig = {"nodes": {}, 
                                    "events": {}}
                jsonfile.writeFileSync(directory + "nodeConfig.json", nodeConfig, {spaces: 2, EOL: '\r\n'})
            }
            
            // check if layoutDetails file exists
            if (fs.existsSync(directory + 'layoutDetails.json')) {
                winston.debug({message: `layoutDetails:  file exists`});
            } else {
                winston.debug({message: `layoutDetails: file not found - creating new one`});
                const layoutDetails = {
                    "layoutDetails": {  "title": "New Layout", 
                                        "subTitle": "Admin", 
                                        "nextNodeId": 800}, 
                    "nodeDetails": {}, 
                    "eventDetails": {}
                    }
                jsonfile.writeFileSync(directory + "layoutDetails.json", layoutDetails, {spaces: 2, EOL: '\r\n'})
            }
}









module.exports = wsserver;