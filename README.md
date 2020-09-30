# iot-pi-azure
Azure to pi and Pi to Azure IoT Hub

Based on examples from https://github.com/Azure-Samples/azure-iot-samples-node

# Azure


## Send data from Azure to Pi

````javascript 
//Should include sharedAccessKey - see "Settings" -> "Shared access policies"
const AZURE_SHAREDKEY = '>>ENTER<<'

//Consumer group - see "Settings" -> "Built in endpoints" in portal.azure.com
const AZURE_CONSUMER_GROUP = '>>ENTER<<'

//The device ID you have created you pi as
const AZURE_DEVICEID = '>>ENTER<<'
````


```javascript

const IoTAzure2Pi = require('./IoTAzure2Pi.js')

var Azure2Pi = new IoTAzure2Pi( AZURE_SHAREDKEY, AZURE_DEVICEID )
var message = {id: req.params.id, type: 'lamp', state: req.body.state }
Azure2Pi.sendMessage( message )


```


## Read incoming data on Azure from pi

```javascript
const iotHubClient = require('./IoTAzureReader.js')

var iotHubReader = new iotHubClient( AZURE_SHAREDKEY, AZURE_CONSUMER_GROUP, AZURE_DEVICEID );
iotHubReader.startReadMessage(function (obj, date) {
    try {
        console.log(date, obj);
    } catch (err) {
        console.log(obj);
        console.error(err);
    }
});


```

# Raspberry PI

## Send data from PI to Azure IoT Hub

`getSensorData()` do return a object with the sensor data

`azureCloudConnected` and `azureCloudIncomingMessage` is callback methods

````javascript
//ConnectionString - see portal.azure.com "IoT devices" -> {Your pi} -> "Connection string primary"
const AZURE_CONNECTION 		= '>>ENTER<<'
//portal.azure.com "IoT devices" -> {Your pi}
const AZURE_DEVICEID 		= '>>ENTER<<'

````

```javascript
const IoTPi2Azure = require('./IoTPi2Azure.js')

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
```

Simple callback when a connection established. 

```javascript
function azureCloudConnected(){
	console.log( '[IoT Azure] Connectled to the cloud. Start and send a message!')
}
```

And the most important thing - do something on incoming messages from Azure. 
It could be change a lamp state from 0 to 1. 
```javascript
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

		console.log('Receive message: ' + data);
	});

}
```

## Send test data to Azure
It is horrible to debug on a PI. Use `azure_test_data.js` to send random test data to azure to test your integration

# License
MIT - see LICENSE