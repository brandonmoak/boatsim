import EventEmitter from 'events';
import pkg from '@canboat/canboatjs';
import { observeProperty } from './property_observer.js';
const { serial } = pkg;

export class ActisenseSerialDevice {
    // app is an EventEmitter that will be used to emit events to the upper level
    // it will emit events of connection status and errors 
    constructor(path, app = new EventEmitter()) {
        this.path = path;
        this.app = app;
        this.status = 'disconnected';
        this.providerId = 'actisense-serial' + this.path;
        this.MAX_RETRIES = 2;
        this.retries = 0;

       // set up the message handlers for the lower level serial device
       this.app.setProviderStatus = (providerId, status) => {
            console.log("setProviderStatus", status);
            const not_connected = status.includes('Not connected')
            if (not_connected) {
                this.status = 'disconnected';
                this.emitStatus();
            }
        };
        
        this.app.setProviderError = (providerId, error) => {
            console.log("setProviderError", error);
            if (error.includes('cannot open')) {
                this.retries++;
                if (this.retries > this.MAX_RETRIES) {
                    this.status = 'disconnected';
                    this.actisense.reconnect = false;
                    this.emitError(error);
                }
            } else {
                this.status = 'disconnected';
                this.emitError(error);
            }
        };

        this.app.on('startupResponseChanged', (data) => {
            console.log("startupResponseChanged", data);
            // Listen for startup response i
            // (setting provider status emits before receiving feedback from the device)
            if (this.actisense.gotStartupResponse == true) {
                this.status = 'connected';
                this.emitStatus();
            } 
        });
    }

    connect() {
        // Setup Serial Stream parser with our EventEmitter-based app object
        this.actisense = new serial({
            device: this.path,
            app: this.app,
            outEvent: 'nmea2000out',
            reconnect: true,
            baudRate: 115200,
            providerId: 'actisense-serial' + this.path
        });

        // Listen for startup response i
        // (setting provider status emits before receiving feedback from the device)
        observeProperty(this.actisense, 'gotStartupResponse', this.app, 'startupResponseChanged');
    }

    disconnect() {
        console.log("closingserial device", this.path);
        this.actisense.reconnect = false;
        this.actisense.end();
    }

    emitStatus() {
        const status = this.getStatus();
        this.app.emit('serialDeviceStatus', status);
    }
    
    emitError(error) {
        const status = this.getStatus();
        status ['error'] = error;
        this.app.emit('serialDeviceError', status);
    }

    getStatus() {
        const status = {
            device: this.path,
            status: this.status,
            type: 'actisense',
            timestamp: Date.now()
        }
        return status;
    }

    write(dataArray, priority = 2, dst = 255, src = 1, timestamp = Date.now()) {
        if (this.status != 'connected') {
            console.error("Serial device not connected");
            return;
        }

        for (const data of dataArray) {
            const pgn = data['pgn_id'];
            
            const msg = {
                pgn: parseInt(pgn),
                priority: priority,
                dst: dst,
                src: src,
                timestamp: timestamp,
                fields: data['values']
            };

            this.app.emit('nmea2000out', msg);
            // that.options.app.emit('connectionwrite', { providerId: that.options.providerId })
        }
    }
}

import { MOCK_SERIAL_DEVICES } from '../test/mock.js';
export function listSerialDevices() {
    const paths = MOCK_SERIAL_DEVICES.map(device => device.path);
    return paths;
}

