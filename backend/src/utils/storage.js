import path from 'path';
import fs from 'fs';
import { STORAGE_DIR } from './paths.js';

const DEFAULT_DEFAULTS = {
    "127488": {
      "Speed": 500,
      "Tilt/Trim": 15,
      "Boost Pressure": 25,
      "Instance": 1
    },
    "128259": {
      "Speed Water Referenced": 10,
      "Speed Water Referenced Type": 2,
      "Speed Ground Referenced": 10,
      "Speed Direction": 3
    }
  }

export async function saveDefaults(defaults) {
  // Validate the defaults data
  if (!defaults || typeof defaults !== 'object') {
    throw new Error('Invalid defaults data');
  }

  // Save to file
  const defaultsPath = path.join(STORAGE_DIR, 'pgn_defaults.json');
  await fs.promises.writeFile(
    defaultsPath, 
    JSON.stringify(defaults, null, 2)
  );

  return defaults;
}

export async function getDefaults() {
  const defaultsPath = path.join(STORAGE_DIR, 'pgn_defaults.json');
  
  // Check if defaults file exists
  if (!fs.existsSync(defaultsPath)) {
    console.log('No defaults file found, using default values');
    return DEFAULT_DEFAULTS; // Return empty object if no defaults exist
  }

  // Read and parse defaults
  const defaultsData = await fs.promises.readFile(defaultsPath, 'utf8');
  return JSON.parse(defaultsData);
} 