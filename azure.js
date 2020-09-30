const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();

//Get JSON on POST - urlencode - deprecated, but working ;-)
app.use( express.urlencoded() );
app.use( express.json() ); 

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const iotHubClient = require('./integration/IoTAzureReader.js')
const IoTAzure2Pi = require('./integration/IoTAzure2Pi.js')
const PORT = 30010

//Should include sharedAccessKey - see "Settings" -> "Shared access policies"
const AZURE_SHAREDKEY = '>>ENTER<<'
//Consumer group - see "Settings" -> "Built in endpoints" in portal.azure.com
const AZURE_CONSUMER_GROUP = '>>ENTER<<'
//The device ID you have created you pi as
const AZURE_DEVICEID = '>>ENTER<<'


/**
 * Open a broadcast connection for all clients
 * Send incoming data from Pi to the websocket
 * 
 */
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            try {
                console.log('sending data to websocket ' + data);
                client.send(data);
            } catch (e) {
                console.error(e);
            }
        }
    });
};

/**
 * Connection to IOT hub
 * 
 * Get all messages from the PI. remember to use the connection string with a shared aceess key name in
 * Find it under "Settings" -> "Shared access policies" -> and choose one ;-) 
 */
var iotHubReader = new iotHubClient( AZURE_SHAREDKEY, AZURE_CONSUMER_GROUP, AZURE_DEVICEID );
iotHubReader.startReadMessage(function (obj, date) {
    try {
        console.log(date);
        date = date || Date.now()
        wss.broadcast(JSON.stringify(Object.assign(obj, { time: date }))); //moment.utc(date).format('YYYY:MM:DD[T]hh:mm:ss')
    } catch (err) {
        console.log(obj);
        console.error(err);
    }
});

/**
 * Change state of lamp -there is only an endpoint for lamps currently
 *
 * POST /lamp/:id | body {id:..., }
 */
app.post('/lamp/:id', (req, res) => {

    var Azure2Pi = new IoTAzure2Pi( AZURE_SHAREDKEY, AZURE_DEVICEID )
    var message = {id: req.params.id, type: 'lamp', state: req.body.state }
    Azure2Pi.sendMessage( message )

    res.end( JSON.stringify( { state: req.body.state } ) );

})

//Load html files from public - including assets
app.use( express.static( path.join(__dirname, 'public') ) );

//Run the server
server.listen( PORT, function listening() {
    console.log('Listening on %d', server.address().port);
});