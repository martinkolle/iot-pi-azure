/**
 * Connection to Azure IoT hub with mqtt protocol
 *
 * This is Azure 2 Pi
 *
 * Based on https://github.com/Azure-Samples/azure-iot-samples-node/
 * @author Martin Kollerup <martin@digitalspace.dk>
 * @license MIT
 */

'use strict';

/**
 * Module dependencies
 */
var Client = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;

class IoTAzure2Pi {

    constructor( connectionString, deviceId ) {
        //Should have SharedAccessKeyName included
        this.connectionString = connectionString

        //Device ID in Azure
        this.deviceId = deviceId

        //Internal message id
        this.messageId = 0
        this.isConnected = 0
    }

    /**
     * Send a message from Azure to Pi
     * 
     * @param  {string} msg String to send - ewg. stringify json object
     */
    sendMessage( msg, callback ) {

        var client = Client.fromConnectionString(this.connectionString);

        client.open( (err) => {

            if (err) {
                console.error('Could not connect: ' + err.message);
                return;
            } 
            
            console.log('Client connected');

            var message = new Message( msg );
            console.log('Sending message: ' + message.getData());

            //Sending the message to Pi
            client.send(this.deviceId, message, (err) => {

                if (err) {
                    console.error( err.toString() );
                    return;
                }

                //Message is sent with success
                if( callback ) callback( message, client ) 
                
                console.log('sent c2d message');
            });
        });
    }
}

module.exports = IoTAzure2Pi