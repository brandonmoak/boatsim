import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

// Load environment variables from ~/.boatsim/.env
export const boatsimEnvPath = path.join(os.homedir(), '.boatsim', '.env');

export const STORAGE_DIR = path.join(os.homedir(), '.boatsim');
