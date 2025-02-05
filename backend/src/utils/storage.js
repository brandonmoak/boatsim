import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create storage directory in the app's data directory
const getStoragePath = () => {
    const isElectron = process.env.ELECTRON === 'true';
    
    if (isElectron) {
        // In Electron, use the resources/data directory
        const resourcePath = path.dirname(path.dirname(__dirname)); // Go up from src/utils to resources
        const dataPath = path.join(resourcePath, 'data');
        fs.mkdirSync(dataPath, { recursive: true });
        return dataPath;
    } else {
        // In development, use a local directory
        const storagePath = path.join(__dirname, '..', '..', 'data');
        fs.mkdirSync(storagePath, { recursive: true });
        return storagePath;
    }
};

const CONFIG_DIR = getStoragePath();
fs.mkdirSync(CONFIG_DIR, { recursive: true });

export const saveConfig = (filename, data) => {
    const filePath = path.join(CONFIG_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export const loadConfig = (filename) => {
    const filePath = path.join(CONFIG_DIR, filename);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
};

export async function saveDefaults(defaults) {
  // Validate the defaults data
  if (!defaults || typeof defaults !== 'object') {
    throw new Error('Invalid defaults data');
  }

  // Save to file
  const defaultsPath = path.join(CONFIG_DIR, 'pgn_defaults.json');
  await fs.promises.writeFile(
    defaultsPath, 
    JSON.stringify(defaults, null, 2)
  );

  return defaults;
}

export async function getDefaults() {
  const defaultsPath = path.join(CONFIG_DIR, 'pgn_defaults.json');
  
  // Check if defaults file exists
  if (!fs.existsSync(defaultsPath)) {
    return {}; // Return empty object if no defaults exist
  }

  // Read and parse defaults
  const defaultsData = await fs.promises.readFile(defaultsPath, 'utf8');
  return JSON.parse(defaultsData);
} 