/*
** Switches red/amber/green LED on/off from commands sent from an AWS IoT topic.
** David Hanley, June 2017
**
** Packages:
**   npm install wiringpi-node
**   npm intsall aws-iot-device-sdk  (2.0.0)
**
** AWS sample message:
{
  "name": "RED", 
  "state": 0
}
*/
const wpi=require("wiringpi-node");
const awsIot=require('aws-iot-device-sdk');
const os=require('os');

// light

// pin numbers - use the WPI standards
const pin_amber = 2;
const pin_red = 3;
const pin_green = 0;
const test_delay = 150;

// red, amber, green lights
var redLight = new light("RED", pin_red, 0);            // red light initially off
var amberlight = new light("AMBER", pin_amber, 0);      // amber light initially off
var greenLight = new light("GREEN", pin_green, 0);      // gree light initially off
var lights = [redLight, amberlight, greenLight];

// initialise lights (WPI) and run a quick test
setUpLights();
testLights(); 

// AWS IoT Settings - Modify to use your own values
const clientId = 'ae8639f4df';          // must be a unique value for each client
const privateKeyPath = `/home/pi/awsKeys/${clientId}-private.pem.key`;
const certPath = `/home/pi/awsKeys/${clientId}-certificate.pem.crt`;
const rootCAPath = '/home/pi/awsKeys/RootCA.crt';
const awsRegion = 'us-east-1';          // AWS region
const topicName = 'lightCommands';       // topic to subscribe to
const endpoint = 'a1a5vmkre2h9ju-ats.iot.us-east-1.amazonaws.com';   // endpoint - required for 2.0.0+

var device = awsIot.device({
   keyPath: privateKeyPath,
  certPath: certPath,
    caPath: rootCAPath,
  clientId: clientId,
    region: awsRegion, 
    host: endpoint
});

// listen for connection
device.on('connect', function() {
    console.log('Connected to AWS IoT');
    device.subscribe(topicName);
    console.log(`Subscribed to topic ${topicName}${os.EOL}Waiting for commands ...`);
});

device.on('message', function(topic, payload) {
    var message = JSON.parse(payload);
    changeLight(message.name, message.state);
    console.log(`${message.name} ${message.state}`);
});

device.on('offline', function() {
    console.log('Device has gone offline');
});

device.on('reconnect', function() {
    console.log('Device has reconnected');
});

device.on('error', function(error) {
    console.error(`Error: ${error.toString()}`);
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
    console.log(`Testing lights ...`);
    changeLight(lights[0].name, 1);
    wpi.delay(test_delay);
    changeLight(lights[1].name, 1);
    wpi.delay(test_delay);
    changeLight(lights[2].name, 1);
    wpi.delay(test_delay);
    changeLight(lights[2].name, 0);
    wpi.delay(test_delay);
    changeLight(lights[1].name, 0);
    wpi.delay(test_delay);
    changeLight(lights[0].name, 0);
    wpi.delay(test_delay);
    for(count = 0; count < 3; count++) {
        changeLight(lights[2].name, 1);
        wpi.delay(test_delay);
        changeLight(lights[2].name, 0);
        wpi.delay(test_delay);
    }
}