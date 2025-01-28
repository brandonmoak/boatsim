import pkg from '@canboat/canboatjs';
const { FromPgn, pgnToActisenseSerialFormat, Actisense, serial} = pkg;
import { SerialPort } from 'serialport'
import { EventEmitter } from 'events'
import dgram from 'dgram'
import { PgnStatsManager } from './PgnStatsManager.js';

const SerialStream = serial.SerialStream;

class MessageForwarder extends EventEmitter {
    constructor(io, devicePath) {
        super();
        this.io = io;
        this.devicePath = devicePath;
        this.setupDevice();
        this.setupUDP();
        this.statsManager = new PgnStatsManager({
            windowSeconds: 10,
            logIntervalSeconds: 1,
        });
    }

    setupDevice() {
        // Setup Serial Stream parser using the SerialStream class directly from pkg
        this.actisense = new serial({
            device: this.devicePath,
            app: this,
            outEvent: 'nmea2000out',  // specify the output event name
            reconnect: true,
            baudRate: 115200
        });

    }

    setupUDP() {
        this.udpSocket = dgram.createSocket('udp4');
        this.UDP_PORT = 10111;
        this.BROADCAST_ADDRESS = '127.0.0.1';
    }

    handlePGNUpdate(dataArray) {
        // console.log('--------------------------------');
        // console.log('handlePGNUpdate received:', dataArray);
        // console.log('--------------------------------');

        try {
            // Loop through each PGN message in the array
            dataArray.forEach(data => {
                const pgn = data['pgn_id'];
                this.statsManager.updateStats(pgn);

                // Format the message for NMEA 2000
                const msg = {
                    pgn: parseInt(pgn),
                    priority: 2,
                    dst: 255,
                    src: 1,
                    timestamp: Date.now(),
                    fields: data['values']
                };

                // Emit the message using the event that actisense is listening for
                this.emit('nmea2000out', msg);
                
                // Convert to Actisense serial format and send over UDP
                const message = pgnToActisenseSerialFormat(msg);
                if (message) {
                    this.udpSocket.send(
                        message, 
                        this.UDP_PORT, 
                        this.BROADCAST_ADDRESS
                    );
                }

                console.log('Sent to device and UDP:', message);
            });

        } catch (error) {
            console.error('Error sending PGN:', error);
            this.io.emit('pgn_sent', {
                status: 'error',
                error: error.message
            });
        }
    }
}

export { MessageForwarder }; 