const serialport = require('serialport');

// list serial ports:
serialport.list().then(ports => {
  ports.forEach(function(port) {
    console.log('PORT :'+port.path);
    console.log(port.pnpId);
    console.log(port.manufacturer);
    console.log(port.comName);
    console.log(port.vendorId);
    console.log(port.productId);
    console.log(port.serialNumber);
  });
});
