import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadEnvVars() {
    const defaultEnv = {
        PORT: '3002',
        REACT_APP_BACKEND_PORT: '5010'
    };

    const isDev = process.argv.includes('--dev');
    
    try {
        // In development, look for .env in the frontend directory
        // In production, look in the Resources directory
        let envPath;
        if (isDev) {
            envPath = path.join(__dirname, '../frontend/.env');
        } else if (process.resourcesPath) {
            envPath = path.join(process.resourcesPath, 'frontend/.env');
        } else {
            // Fallback path when not in Electron
            envPath = path.join(__dirname, '../frontend/.env');
        }

        console.log('Looking for .env at:', envPath);

        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf8');
            console.log('Found .env file');
            
            const envVars = {};
            envFile.split('\n').forEach(line => {
                if (line.trim() && !line.startsWith('#')) {
                    const [key, value] = line.split('=');
                    if (key && value) {
                        envVars[key.trim()] = value.trim();
                    }
                }
            });
            
            console.log('Loaded environment variables:', { ...defaultEnv, ...envVars });
            return { ...defaultEnv, ...envVars };
        }
        
        console.log('No .env file found, using defaults:', defaultEnv);
        return defaultEnv;
    } catch (error) {
        console.warn('Error loading .env file:', error);
        console.log('Using default environment:', defaultEnv);
        return defaultEnv;
    }
} 