import { EventEmitter } from 'events'
import dgram from 'dgram'
import { PgnStatsManager } from './pgn_state_manager.js';
import { ActisenseSerialDevice } from './serial_device_manager.js';

class MessageForwarder extends EventEmitter {
    constructor(io) {
        super();
        this.io = io;
        this.statsManager = new PgnStatsManager({
            windowSeconds: 10,
            logIntervalSeconds: 1,
        });
        this.devices = {};
        this.setupSubscribers();
        this.setupPublishers();
        
    }

    setupSubscribers() {
        // Socket.IO connection handling
        this.io.on('connection', (socket) => {

            // subscribe to pgn updates
            socket.on('update_pgn_2000', (data) => {
                this.handlePGNUpdate(data);
            });
    
            // handle a disconnection event
            socket.on('disconnect', (reason) => {
                console.log('Client disconnected:', {
                    id: socket.id,
                    reason: reason
                });
            });
        });
    }

    setupPublishers() {
        // Forward serial device events to socket.io clients
        this.on('serialDeviceStatus', (status) => {
            this.io.emit('device_status', status);
        });

        this.on('serialDeviceError', (error) => {
            this.io.emit('device_error', error);
        });

        // Set up periodic status updates
        this.statusInterval = setInterval(() => {
            const status = this.getEachDeviceStatus();
            this.io.emit('device_status', status);
        }, 1000); // Send status every second
    }

    getEachDeviceStatus() {
        const status = {};
        for (const devicePath in this.devices) {
            status[devicePath] = this.devices[devicePath].getStatus();
        }
        return status;
    }

    connectSerialDevice(devicePath) {
        const actisense = new ActisenseSerialDevice(devicePath, this);
        this.devices[devicePath] = actisense;
    }

    disconnectSerialDevice(devicePath) {
        const actisense = this.devices[devicePath];
        if (actisense) {
            actisense.disconnect();
            delete this.devices[devicePath];
        }
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

    // Add cleanup method to clear interval
    cleanup() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
        this.actisense.disconnect();
    }
}

export { MessageForwarder }; 