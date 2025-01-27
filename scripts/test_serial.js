
const pkg = require('@canboat/canboatjs');
const { FromPgn, pgnToActisenseSerialFormat, Actisense, serial } = pkg;
const EventEmitter = require('events');

const SerialStream = serial.SerialStream;

class SerialTester extends EventEmitter {
    constructor(devicePath) {
	super();
        this.devicePath = devicePath;
        this.setupDevice();
        this.testConnection();
    }

    setupDevice() {
        this.actisense = new serial({
            device: this.devicePath,
            app: this,
            outEvent: 'nmea2000out',
            reconnect: true,
            baudRate: 115200
        });

        // Listen for any data received
        this.on('nmea2000JsonOut', (data) => {
            console.log('Received NMEA 2000 data:', data);
        });
    }

    testConnection() {
        // Test message (PGN 130311 - Environmental Parameters)
        const testMsg = {
            pgn: 130311,
            priority: 2,
            dst: 255,
            src: 1,
            timestamp: Date.now(),
            fields: {
                temperatureSource: 'Outside Temperature',
                temperature: 25.5,
                humidity: 50.0,
                atmosphericPressure: 101.325
            }
        };

        // Send test message every 5 seconds
        setInterval(() => {
            console.log('Sending test message...');
            this.emit('nmea2000out', testMsg);
            
            const serialMessage = pgnToActisenseSerialFormat(testMsg);
            console.log('Formatted message:', serialMessage);
        }, 5000);
    }
}

// Usage
const devicePath = '/dev/ttyUSB0'; // Adjust this to your device path
const tester = new SerialTester(devicePath); 
