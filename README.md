
# mergCbusServer
This is a nodejs program to allow multiple network connections to a MERG canusb4.

This program requires [nodejs.org](https://nodejs.org)

Once nodejs has been installed create a new directory and download the files.

Install the required node modules `npm install`

Attach the canusb4 to the computer and run `node listports.js` to identify the name of the port for the canusb4.

Edit the file config.json with the correct com port. 

The system can now be started using `node cbusServer.js`


