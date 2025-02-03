import { EventEmitter } from 'events'
import dgram from 'dgram'
import { PgnStatsManager } from './utils/pgn_stats_manager.js';
import { ActisenseSerialDevice, listSerialDevices } from './actisense_serial_device.js';

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
            console.log("ERROR CONNECTING TO DEVICE", error);
            this.io.emit('device_error', error);
        });

        // Set up periodic status updates
        this.statusInterval = setInterval(() => {
            const status = this.getEachDeviceStatus();
            this.io.emit('device_status', status);
        }, 1000); // Send status every second
    }

    async getEachDeviceStatus() {
        const status = {};
        let all_devices = [];
        try {
            all_devices = await listSerialDevices();
        } catch (error) {
            this.io.emit('device_error', error.message);
            return status;
        }

        if (all_devices.length === 0) {
            return status;
        }

        for (const devicePath of all_devices) {
            if (this.devices[devicePath]) {
                status[devicePath] = this.devices[devicePath].getStatus();
            } else {
                status[devicePath] = {
                    path: devicePath,
                    type: 'actisense',
                    status: 'disconnected',
                    timestamp: Date.now()
                };
            }
        }
        return status;
    }

    connectSerialDevice(devicePath) {
        const actisense = new ActisenseSerialDevice(devicePath, this);
        actisense.connect();
        actisense.status = 'connected';
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

    anyDevicesConnected() {
        return Object.values(this.devices).some(device => device.status === 'connected');
    }

    handlePGNUpdate(dataArray) {
        dataArray.forEach(data => this.statsManager.updateStats(data['pgn_id']));

        // if no devices connected, don't forward
        if (!this.anyDevicesConnected()) {
            return {'status': 'no_devices_connected'};
        }

        // forward to all connected devices
        for (const device of Object.values(this.devices)) {
            device.write(dataArray);
        }
        return {'status': 'success'};
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