var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
 
// list serial ports:
serialport.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log("Com Name: " + port.comName);
    console.log("pnp ID: " + port.pnpId);
    console.log("Manufa: " + port.manufacturer);
    console.log("_____________________________________________________");
  });
});