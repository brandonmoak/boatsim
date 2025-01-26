import dgram from 'dgram';
import pkg from '@canboat/canboatjs';
import { EventEmitter } from 'events';
const { FromPgn, Serial, pgnToActisenseSerialFormat } = pkg;
import { organizePGNs } from './pgn_utils.js';

const NMEA_2000_PORT = 10111;
const UDP_IP = '127.0.0.1';

export class MessageForwarder {
  constructor(io, serialPort = null) {
    this.io = io;
    this.fromPgn = new FromPgn();
    this.socket = dgram.createSocket('udp4');
    
    // Initialize serial connection if port provided
    if (serialPort) {
      this.setupSerialConnection(serialPort);
    }
    
    // Initialize PGNs asynchronously
    this.initializePGNs();
  }

  setupSerialConnection(devicePath) {
    // Create serial connection using canboatjs Serial class
    this.serial = new Serial({
      app: this,
      device: devicePath,
      plainText: true,
      disableSetTransmitPGNs: true
    });

    // Setup error handling
    this.serial.on('error', (err) => {
      console.error('Serial port error:', err);
    });

    // Forward received data to UDP
    this.serial.on('data', (data) => {
      this.socket.send(Buffer.from(data), NMEA_2000_PORT, UDP_IP, (err) => {
        if (err) console.error('Error forwarding to UDP:', err);
      });
    });

    // Setup debug logging if in development
    if (process.env.NODE_ENV === 'development') {
      this.serial.on('data', (data) => {
        console.log('Received from serial:', data);
      });
    }
  }

  async initializePGNs() {
    try {
      this.pgns = await organizePGNs();
      console.log('Available PGNs:', Object.keys(this.pgns));
      
      // Let's look at PGN 127250 (Vessel Heading) as an example
      const headingPgn = this.pgns['127250'];
      if (headingPgn) {
        console.log('\nVessel Heading (127250) Definition:');
        console.log(JSON.stringify(headingPgn[0], null, 2));
      }
    } catch (err) {
      console.warn('Error organizing PGN definitions:', err);
      this.pgns = {};
    }
  }

  handlePGNUpdate(pgnUpdates) {
    pgnUpdates.forEach(update => {
      const { pgn_id, values } = update;
      
      try {
        // Get and print PGN definition
        const pgnDefs = this.pgns[pgn_id];
        if (!pgnDefs || pgnDefs.length === 0) {
          console.log(`PGN ${pgn_id} definition not found`);
          console.log('Available PGNs:', Object.keys(this.pgns));
        } else {
          const pgnDef = pgnDefs[0]; // Take the first definition
          console.log(`PGN ${pgn_id} definition:`, {
            description: pgnDef.Description,
            fields: pgnDef.Fields?.map(f => ({
              name: f.Name,
              type: f.Type,
              units: f.Units
            })) || []
          });
        }
        console.log('Provided values:', values);

        // Create PGN object in canboatjs format
        const pgnData = {
          pgn: pgn_id,
          timestamp: Date.now(),
          src: 1,
          dst: 255,
          prio: 2,
          fields: values
        };

        // Convert to Actisense serial format
        const message = pgnToActisenseSerialFormat(pgnData);
        
        if (message) {
          // Emit the raw message for serial transmission
          this.emit('nmea2000out', message);
          
          // For UDP, we do want to stringify the object
          this.socket.send(message, NMEA_2000_PORT, UDP_IP);
        }
      } catch (err) {
        console.error(`Error handling PGN ${pgn_id}:`, err);
      }
    });
  }

  stop() {
    this.socket.close();
    if (this.serial) {
      this.serial.close();
    }
  }
} 