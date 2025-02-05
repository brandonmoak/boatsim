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

const DEFAULT_WAYPOINTS = {
  "waypoints": [
    {
      "name": "Halifax Harbor",
      "lat": 44.6476,
      "lon": -63.5728
    },
    {
      "name": "Eastern Passage",
      "lat": 44.52,
      "lon": -63.48
    },
    {
      "name": "Off Lawrencetown",
      "lat": 44.4,
      "lon": -63.3
    },
    {
      "name": "Off Sheet Harbor",
      "lat": 44.35,
      "lon": -63.1
    },
    {
      "name": "Further Out to Sea",
      "lat": 44.45,
      "lon": -62.9
    },
    {
      "name": "Loop Back Point",
      "lat": 44.6,
      "lon": -62.7
    },
    {
      "name": "Approaching Coast",
      "lat": 44.75,
      "lon": -63
    },
    {
      "name": "Halifax Harbor Return",
      "lat": 44.6476,
      "lon": -63.5728
    }
  ]
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

export async function saveWaypoints(waypoints) {
  const waypointsPath = path.join(STORAGE_DIR, 'waypoints.json');
  await fs.promises.writeFile(waypointsPath, JSON.stringify(waypoints, null, 2));
  return waypoints;
}

export async function getWaypoints() {
  const waypointsPath = path.join(STORAGE_DIR, 'waypoints.json');
  if (!fs.existsSync(waypointsPath)) {
    return DEFAULT_WAYPOINTS;
  }
  return JSON.parse(await fs.promises.readFile(waypointsPath, 'utf8'));
}