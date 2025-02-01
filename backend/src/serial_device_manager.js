import EventEmitter from 'events';
import pkg from '@canboat/canboatjs';
const { serial } = pkg;

export class ActisenseSerialDevice {
    constructor(path) {
        this.path = path;
        this.app = new EventEmitter();
        this.status = 'disconnected';
        this.providerId = 'actisense-serial' + this.path;

       // set up the message handlers for the serial device
       this.app.setProviderStatus = (providerId, status) => {
            connected = status.includes('connected') && status.includes(this.path);
            this.status = connected ? 'connected' : 'disconnected';
            console.log(`Provider ${providerId} status: ${status}`);

            status = this.getStatus();
            this.emit('serialDeviceStatusChange', status);
        };
        
        this.app.setProviderError = (providerId, error) => {
            this.status = 'error';
            console.error(`Provider ${providerId} error: ${error}`);
        };

        this.app.on('startupResponseChanged', (data) => {
            console.log("startupResponseChanged", data);
            if (data.newValue == true) {
                this.status = 'connected';
            } else {
                this.status = 'disconnected';
            }
        });
    }

    connect() {
        // Setup Serial Stream parser with our EventEmitter-based app object
        this.actisense = new serial({
            device: this.devicePath,
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
    
    getStatus() {
        const status = {
            device: this.path,
            status: this.status,
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

            this.emit('nmea2000out', msg);
            // that.options.app.emit('connectionwrite', { providerId: that.options.providerId })
        }
    }
}

