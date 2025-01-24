import dgram from 'dgram';
import pkg from '@canboat/canboatjs';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const { FromPgn, pgnToActisenseSerialFormat } = pkg;

const NMEA_2000_PORT = 10111;
const UDP_IP = '127.0.0.1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function organizePGNs() {
  const res = {};
  
  try {
    // Read JSON files directly
    const pgnsBasePath = join(__dirname, '../node_modules/@canboat/pgns/canboat.json');
    const pgnsIKPath = join(__dirname, '../node_modules/@canboat/pgns/pgns-ik.json');
    const pgnsNGTPath = join(__dirname, '../node_modules/@canboat/pgns/pgns-ngt.json');

    const [pgnsBaseContent, pgnsIKContent, pgnsNGTContent] = await Promise.all([
      readFile(pgnsBasePath, 'utf8'),
      readFile(pgnsIKPath, 'utf8'),
      readFile(pgnsNGTPath, 'utf8')
    ]);

    const pgnsBase = JSON.parse(pgnsBaseContent);
    const pgnsIK = JSON.parse(pgnsIKContent);
    const pgnsNGT = JSON.parse(pgnsNGTContent);
    
    console.log('Loaded PGN files successfully');
    
    const all = [...pgnsBase.PGNs, ...pgnsIK.PGNs, ...pgnsNGT.PGNs];
    
    all.forEach(pgn => {
      if (!res[pgn.PGN]) {
        res[pgn.PGN] = [];
      }
      res[pgn.PGN].push(pgn);
      pgn.Fields = Array.isArray(pgn.Fields) ? pgn.Fields : (pgn.Fields ? [pgn.Fields.Field] : []);
      
      let reservedCount = 1;
      pgn.Fields.forEach((field) => {
        if (field.Name === 'Reserved') {
          field.Name = `Reserved${reservedCount++}`;
        }
      });
    });
  } catch (err) {
    console.error('Error loading PGN definitions:', err);
  }
  
  return res;
}

export class MessageForwarder {
  constructor(io) {
    this.io = io;
    this.fromPgn = new FromPgn();
    this.socket = dgram.createSocket('udp4');
    
    // Initialize PGNs asynchronously
    this.initializePGNs();
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
        const pgnDef = this.pgns[pgn_id];
        if (!pgnDef) {
          console.log(`PGN ${pgn_id} definition not found`);
          console.log('Available PGNs:', Object.keys(this.pgns));
        } else {
          console.log(`PGN ${pgn_id} definition:`, {
            description: pgnDef.Description,
            fields: pgnDef.Fields.map(f => ({
              name: f.Name,
              type: f.Type,
              units: f.Units
            }))
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