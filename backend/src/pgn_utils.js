import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function organizePGNs() {
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