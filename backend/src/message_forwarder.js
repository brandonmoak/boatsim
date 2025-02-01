import { EventEmitter } from 'events'
import dgram from 'dgram'
import { PgnStatsManager } from './pgn_state_manager.js';
import { ActisenseSerialDevice } from './serial_device_manager.js';

class MessageForwarder extends EventEmitter {
    constructor(io, devicePath) {
        super();
        this.io = io;
        this.devicePath = devicePath;
        this.actisense = new ActisenseSerialDevice(this.devicePath);
        this.setupDevice();
        this.setupUDP();
        this.statsManager = new PgnStatsManager({
            windowSeconds: 10,
            logIntervalSeconds: 1,
        });
    }

    setupDevice() {
        // Setup Serial Stream parser using the SerialStream class directly from pkg
        this.actisense.connect();
    }

    setupUDP() {
        this.udpSocket = dgram.createSocket('udp4');
        this.UDP_PORT = 10111;
        this.BROADCAST_ADDRESS = '127.0.0.1';
    }

    handlePGNUpdate(dataArray) {
        this.statsManager.updateStats(dataArray);
        this.actisense.write(dataArray);
    }
}

export { MessageForwarder }; 