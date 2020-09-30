const Gpio 		= require('pigpio').Gpio;
var lampOnOff 	= require('onoff').Gpio;
const dht 		= require('pigpio-dht');

//Connection wrapeprs for Azure
const IoTPi2Azure = require('./integration/IoTPi2Azure.js')
const IoTAzure2Pi = require('./integration/IoTAzure2Pi.js')

//Local settings
const MICROSECDONDS_PER_CM 	= 1e6/34321;

//ConnectionString - see portal.azure.com "IoT devices" -> {Your pi} -> "Connection string primary"
const AZURE_CONNECTION 		= '>>ENTER<<'
const AZURE_DEVICEID 		= '>>ENTER<<'
const AZURE_SEND_INTERVAL 	= 5000

//All our sensors
var sensors = []
sensors.push( {name : 'Lamp 1', alias : 'lamp-1', actions : ['write','read'], type : 'lamp', pin: 2 } )
sensors.push( {name : 'Lamp 2', alias : 'lamp-2', actions : ['write','read'], type : 'lamp', pin: 4 } )
sensors.push( {name : 'Lamp 3', alias : 'lamp-3', actions : ['write','read'], type : 'lamp', pin: 22 } )
sensors.push( {name : 'Humidity', alias : 'humidity', actions : ['read'], type : 'humidity', pin: 12, temperature: 0, humidity: 0 })
sensors.push( {name : 'Ultrasonic', alias : 'ultrasonic', actions : ['read'], type : 'ultrasonic', echo: 0, trigger: 0, distance: 0} )


/**
 * Initialize all the sensors - Not beautifull hahahah
 *
 * @todo  Make plugin for every sensor and init all plugins depending on a sensor json file
 */
sensors.forEach(element => { 
	switch( element.type ) {

		case 'lamp' :
			var LED = new lampOnOff(element.pin, 'out');

			element.reference = LED;
			break;

		case 'humidity' :
			const dhtType = 22;
			const hmySensor = dht(element.pin, dhtType);

			element.reference = hmySensor;

			humidity_updateData( element )

			break;

		case 'ultrasonic' :

			//microseconds it takes sound to travel 1cm at 20 degrees celcius
			const echo = new Gpio(24, {mode: Gpio.INPUT, alert: true});
			const trigger = new Gpio(23, {mode: Gpio.OUTPUT});

			element.echo = echo
			element.trigger = trigger

			ultrasonic_updateData( element )

			break;
	}
});


/**
 * Send cached sensor data to azure every x-interval
 * 
 */
function azureCloudConnection() {
	const azure = new IoTPi2Azure( AZURE_CONNECTION, AZURE_DEVICEID )
	azure.openConnection( azureCloudConnected, azureCloudIncomingMessage )

	setInterval( function(){
		var content = JSON.stringify( getSensorsData() )
		azure.sendMessage( content );
	}, AZURE_SEND_INTERVAL )

}

//Init the cloud connection
azureCloudConnection();


/**
 * Callback when there is a succesfull connection
 * 
 */
function azureCloudConnected(){
	console.log( '[IoT Azure] Connectled to the cloud. Start and send a message!')
}

/**
 * Listener on incoming messages from Azure
 * 
 * @param  {object} msg  Message object returned from Azure
 * @param  {object} self Integration class - just the "plugin"
 */
function azureCloudIncomingMessage( msg, self ) {
	
	var message = msg.getData().toString('utf-8');
	self.client.complete( msg, () => {

		var data = JSON.parse(message);

		switch( data.type ) {

			case 'lamp' :
				var lamp = sensors[data.id]
				lamp_setData( lamp, data.state );
				break;
		}

		console.log('Receive message: ' + data);
	});

}


/**
 * Our sensors object includes references to the single sensor
 * Skip this part and only sends the sensor data values
 * 
 * @return {object} Current values of the sensors
 */
function getSensorsData() {

	var sensorData = []

	sensors.forEach(element => { 

		var current = { name: element.name, alias: element.alias }

		if( element.hasOwnProperty("state") ) {
			current.state = element.state
		}

		if( element.hasOwnProperty("temperature") ) {
			current.temperature = element.temperature
		}

		if( element.hasOwnProperty("humidity") ) {
			current.humidity = element.humidity
		}

		if( element.hasOwnProperty("distance") ) {
			current.distance = element.distance
		}

		sensorData.push( current )

	});


	return sensorData;
}


/**
 * Update sensor state on a Lamp
 * 
 * @param  {object} lamp  Sensor object with reference
 * @param  {int} 	state 1|0 to turn on / off
 */
function lamp_setData( lamp, state ) {

	var state = parseInt( state )
	var lampPin = parseInt( lamp.pin )

	var LED = new lampOnOff(lamp.pin, 'out');
	LED.writeSync( state )
}


/**
 * Get current lamp state
 * @param  {object} lamp 	Sensor object
 * @return {array}      	Array with current data
 */
function lamp_getData( sensor ) {

	return {state : sensor.reference.readSync()};
}


/**
 * Update the cached Humidity sensor data 
 * 
 * @param  {object} sensor Single sensor object with reference
 */
function humidity_updateData( sensor ) {

	setInterval(() => {
		sensor.reference.read();
	}, 2500);

	sensor.reference.on('result', data => {
		sensor.temperature = data.temperature
		sensor.humidity = data.humidity
	});


	sensor.reference.on('badChecksum', () => { });

}


/**
 * Get humidity sensor data
 * 
 * @param  {object} sensor Single sensor object with reference
 * @return {object}        Current cached sensor data
 */
function humidity_getData( sensor ) {

	var temperature = sensor.temperature
	var humidity = sensor.humidity

	return { temperature: temperature, humidity: humidity}
}

/**
 * Update the cached ultrasonic sensor data 
 * 
 * @param  {object} sensor Single sensor object with reference
 */
function ultrasonic_updateData( sensor ) {
	let startTick;
	sensor.trigger.digitalWrite(0);

	sensor.echo.on('alert', (level, tick) => {

		if (level == 1) {
			startTick = tick;
		} else {
			const endTick = tick;
			const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
			sensor.distance = diff / 2 / MICROSECDONDS_PER_CM
    	}
    });

    setInterval(() => {
    	sensor.trigger.trigger(10, 1);
	}, 1000);
}

/**
 * Get ultrasonic sensor data
 * 
 * @param  {object} sensor Single sensor object with reference
 * @return {object}        Current cached sensor data
 */
function ultrasonic_getData( sensor ) {

	var distance = sensor.distance
	return { distance: distance }
}