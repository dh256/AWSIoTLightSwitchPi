/*
** Switches red/amber/green LED on/off from commands sent from an AWS IoT topic.
** David Hanley, June 2017
**
** Packages:
**   npm install wiringpi-node
**   npm intsall aws-iot-device-sdk
**
** AWS sample message:
{
  "light": "RED", 
  "state": 0
}
*/
const wpi=require("wiringpi-node");
const awsIot=require('aws-iot-device-sdk');

// lights

// pin numbers - use the WPI standards
const pin_amber = 2;
const pin_red = 3;
const pin_green = 0;

// red, amber, green lights
var redLight = new light("RED", pin_red, 1);
var amberlight = new light("AMBER", pin_amber, 0);
var greenLight = new light("GREEN", pin_green, 0);
var lights = [redLight, amberlight, greenLight];

// initialise lights (WPI)
setUpLights();

// AWS IoT
const privateKeyPath = '/home/pi/awsKeys/03783ab63f-private.pem.key';
const certPath = '/home/pi/awsKeys/03783ab63f-certificate.pem.crt';
const rootCAPath = '/home/pi/awsKeys/RootCA.crt';
const clientId = '03783ab63f';        // must be unique for each client
const awsRegion = 'us-east-1';

var device = awsIot.device({
   keyPath: privateKeyPath,
  certPath: certPath,
    caPath: rootCAPath,
  clientId: clientId,
    region: awsRegion 
});

// listen for connection
device.on('connect', function() {
    console.log('Connected to AWS IoT');
    device.subscribe('lightCommands');
    console.log('Subscribed to topic'); 
});

device.on('message', function(topic, payload) {
    //console.log('Message Received: ' + payload);
    var message = JSON.parse(payload);
    changeLight(message.light, message.state);
});

device.on('offline', function() {
    console.log('Device has gone offline');
});

device.on('reconnect', function() {
    console.log('Device has reconnected');
});

device.on('error', function(error) {
    console.error('Error: ' + error.toString());
});

function light(name, pin, state) {
    this.name = name;
    this.pin = pin;
    this.state = state;
}

function setUpLights() {
    wpi.setup('wpi');
    for (i = 0; i < lights.length; i++) {
        var light = lights[i];
        wpi.pinMode(light.pin, wpi.OUTPUT);
        wpi.digitalWrite(light.pin, light.state);
    }
}

function checkLightName(light) {
    return this == light.name;
}

function changeLight(name, state) {
    var light = lights.find(checkLightName,name);
    if(light != undefined) {
        wpi.digitalWrite(light.pin, state);
        light.state = state;
    }
}

// test purposes - useful for testing lights
function testLights() {
    changeLight(wpi, lights[0], 1);
    wpi.delay(1000);
    changeLight(wpi, lights[1], 1);
    wpi.delay(1000);
    changeLight(wpi, lights[2], 1);
    wpi.delay(1000);
    changeLight(wpi, lights[2], 0);
    wpi.delay(1000);
    changeLight(wpi, lights[1], 0);
    wpi.delay(1000);
    changeLight(wpi, lights[0], 0);
    wpi.delay(1000);
}