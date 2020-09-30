/**
 * Used to send random data to Azure, when you don't have access to your PI!!
 *
 * Or don't want to debug on it.... ;-) 
 *
 * Based on https://github.com/Azure-Samples/azure-iot-samples-node
 *
 * @author Martin Kollerup <martin@digitalspace.dk>
 */

const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;
const Protocol = require('azure-iot-device-mqtt').Mqtt;

var connectionString = '>>ENTER<<'

sendMessage = function(){

	var sensors = []
	sensors.push( {name : 'Lamp 1', alias : 'lamp-1', type : 'lamp', state: 0 })
	sensors.push( {name : 'Lamp 2', alias : 'lamp-2', type : 'lamp', state: 0 })
	sensors.push( {name : 'Lamp 3', alias : 'lamp-3', type : 'lamp', state: 0 })
	sensors.push( {name : 'Humidity', alias : 'humidity', type : 'humidity', temperature: Math.random() * (20 - 5) + 5, humidity:  Math.random() * (50 - 20) + 20 })
	sensors.push( {name : 'Ultrasonic', alias : 'ultrasonic', type : 'ultrasonic', distance:  Math.random() * (5 - 1) + 5} )

    /*var content = JSON.stringify({
        messageId: messageId++,
        deviceId: 'RaspPiTemp',
        temperature: Math.random() * (20 - 5) + 5,
        humidity: Math.random() * (50 - 20) + 20,
        time: new Date()
    });*/

    var content = JSON.stringify( sensors );
    
    var message = new Message(content);
    console.log('Sending message: ' + content);

    client.sendEvent(message, (err) => {
        if (err) {
            console.error('Failed to send message to Azure IoT Hub');
        } else {
            console.log('Message sent to Azure IoT Hub');
        }
        setTimeout(sendMessage, 500);
    });
};



receiveMessageCallback = function(msg) {
    var message = msg.getData().toString('utf-8');
    client.complete(msg, () => {
        console.log('Receive message: ' + message);
    });
}


var client = Client.fromConnectionString(connectionString, Protocol);
messageId = 0;
client.open((err) => {
    if (err) {
        console.error('[IoT hub Client] Connect error: ' + err.message);
        return;
    }
    client.on('disconnect',function(){
        client.removeAllListeners();
        console.log('client disconnected');
    });

    client.on('message', receiveMessageCallback);
    sendMessage();
});