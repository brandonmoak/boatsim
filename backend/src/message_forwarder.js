import dgram from 'dgram';
import pkg from '@canboat/canboatjs';
const { FromPgn, pgnToActisenseSerialFormat } = pkg;

const NMEA_2000_PORT = 10111;
const UDP_IP = '127.0.0.1';

export class MessageForwarder {
  constructor(io) {
    this.io = io;
    this.fromPgn = new FromPgn();
    this.socket = dgram.createSocket('udp4');
  }

  handlePGNUpdate(pgnUpdates) {
    pgnUpdates.forEach(update => {
      const { pgn_id, values } = update;
      
      try {
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
        const message = pkg.pgnToActisenseSerialFormat(pgnData);
        
        if (message) {
          // Send via UDP
          this.socket.send(Buffer.from(message), NMEA_2000_PORT, UDP_IP, (err) => {
            if (err) console.error('Error sending message:', err);
          });
        }
      } catch (err) {
        console.error(`Error encoding PGN ${pgn_id}:`, err);
      }
    });
  }

  stop() {
    this.socket.close();
  }
} 