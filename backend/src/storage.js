import path from 'path';
import fs from 'fs';

// Create storage directory if it doesn't exist
const currentDir = path.dirname(new URL(import.meta.url).pathname);
const STORAGE_DIR = path.join(currentDir, '../../frontend/src/config');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR);
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
    return {}; // Return empty object if no defaults exist
  }

  // Read and parse defaults
  const defaultsData = await fs.promises.readFile(defaultsPath, 'utf8');
  return JSON.parse(defaultsData);
} 