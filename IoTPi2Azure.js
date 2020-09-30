/**
 * Connection to Azure IoT hub with mqtt protocol
 *
 * This is Pi 2 Azure
 *
 * Based on https://github.com/Azure-Samples/azure-iot-samples-node/
 * @author Martin Kollerup <martin@digitalspace.dk>
 */

'use strict'

/**
 * Module dependencies
 */
const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;
const Protocol = require('azure-iot-device-mqtt').Mqtt;

/**
 * Send IOT data to Azure with mqtt
 *
 * Use the connectionstring from Settings -> Shared Access policies
 *  -> owner -> "IOThubowner" -> "Primary"
 */
class IoTPi2Azure {

    constructor( connectionString, deviceId ) {

        this.connectionString = connectionString
        this.deviceId = deviceId

        this.messageId = 0
        this.isConnected = 0
    }


    /**
     * Connect to azure IoT Hub
     * 
     * @param  {Function}  callback        Callback on success connection
     * @param  {Function}  messageCallback Callback function on incoming Message
     */
    openConnection( callback, messageCallback ) { 
        const self = this;
        this.client = Client.fromConnectionString(this.connectionString, Protocol);

        self.client.open((err) => {
            if (err) {
                console.error('[IoT Azure] Connect error: ' + err.message);
                return;
            }

            //No errors - we have a connection
            self.isConnected = 1

            /**
             * Callback with reference to client
             * Use it to create your own disconnect and message callbacks
             */
            if(callback) callback( self.client );

            //Disconnect if possible
            self.client.on('disconnect', function() {
                self.client.removeAllListeners();
                console.log('[IoT Azure] Client disconnected');
            });


            //Incoming messages
            self.client.on('message', (msg) => {
                
                //This could just be removed - we do nothing in the method
                self.receiveMessageCallback(msg, self)

                //Problem with calling with this and therefore we pass msg and self
                if( messageCallback ) messageCallback( msg, self )
            })

        });

    }


    /**
     * Send message to Azure
     * Remember to stringify your data!
     * 
     * @param  {string}   content  Object with data to send
     * @param  {Function} callback Callback to handle on sendEvent
     */
    sendMessage( content, callback ) {

        var isContentEmpty = content.length <= 0
        if( isContentEmpty ) {
            console.error('[IoT Azure] Can\'t send empty message')
        }
        
        var message = new Message(content);
        console.log('[IoT Azure] Sending message: ' + content);

        this.client.sendEvent(message, (err) => {
            if (err) {
                console.error('[IoT Azure] Failed to send message: ' + err.message);
            } else {
                console.log('[IoT Azure] Message sent');
            }

            if(callback) callback( message, err );
        });
    }


    /**
     * Handle callback when a message is received
     * 
     * @param  {object} msg  Message object from Azure
     * @param  {object} self Instance of this current class
     */
    receiveMessageCallback(msg, self) {
        var message = msg.getData().toString('utf-8');

        self.client.complete(msg, () => {
            //console.log('Receive message: ' + message);
        });
    }
}

module.exports = IoTPi2Azure