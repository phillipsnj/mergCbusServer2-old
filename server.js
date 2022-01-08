//const net = require('net')
//const jsonfile = require('jsonfile')
//const serialport = require('serialport')
//const winston = require('./config/winston.js')
//const parsers = serialport.parsers
const cbusServer = require('./cbusServer')
const jsonServer = require('./jsonServer')
const socketServer = require('./socketServer')

//const config = jsonfile.readFileSync('./config/config.json')

//const USB_PORT = config.usb4.port
//const NET_PORT = config.server.port
//const NET_ADDRESS = config.server.address

cbusServer.cbusServer()
jsonServer.jsonServer()
socketServer.socketServer()

