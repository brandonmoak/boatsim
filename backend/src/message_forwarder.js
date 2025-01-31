import pkg from '@canboat/canboatjs';
const { pgnToActisenseSerialFormat, serial} = pkg;
import { EventEmitter } from 'events'
import dgram from 'dgram'
import { PgnStatsManager } from './pgn_state_manager.js';

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
        for (const data of dataArray) {
            const pgn = data['pgn_id'];
            
            // Update stats manager
            this.statsManager.updateStats(pgn);

            const msg = {
                pgn: parseInt(pgn),
                priority: 2,
                dst: 255,
                src: 1,
                timestamp: Date.now(),
                fields: data['values']
            };

            this.emit('nmea2000out', msg);
            
            const message = pgnToActisenseSerialFormat(msg);
            if (message) {
                this.udpSocket.send(
                    message, 
                    this.UDP_PORT, 
                    this.BROADCAST_ADDRESS
                );
            }
        }
    }
}

export { MessageForwarder }; 