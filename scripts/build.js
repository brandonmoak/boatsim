import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to run commands with environment variables
function runCommand(command, cwd, env = {}) {
    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
            env: { ...process.env, ...env }
        });
    } catch (error) {
        console.error(`Error executing command in ${cwd}:`, error);
        process.exit(1);
    }
}

// Get root directory
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file
function loadEnvVars() {
    const envPath = path.join(rootDir, 'frontend', '.env');
    try {
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
                const [key, value] = line.split('=');
                if (key && value) {
                    envVars[key.trim()] = value.trim();
                }
            }
        });
        return envVars;
    } catch (error) {
        console.warn('No .env file found, using defaults');
        return {
            PORT: '3002',
            REACT_APP_BACKEND_PORT: '5010'
        };
    }
}

const envVars = loadEnvVars();
console.log('\n📦 Using environment variables:', envVars);

console.log('\n🏗️  Building frontend...');

// After line 54, add these environment variables for the frontend build
const buildEnv = {
    ...envVars,
    PUBLIC_URL: './',
    REACT_APP_BACKEND_URL: `http://localhost:${envVars.REACT_APP_BACKEND_PORT}`,
    REACT_APP_IS_ELECTRON: 'true'
};

// Modify line 55 to include the build environment
runCommand('npm run build:electron', path.join(rootDir, 'frontend'), buildEnv);

console.log('\n Installing backend production dependencies...');
runCommand('npm ci --only=production', path.join(rootDir, 'backend'));

// After line 60, ensure the environment file exists in both locations
const envContent = Object.entries(buildEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

// Write to frontend build directory
const frontendBuildEnvPath = path.join(rootDir, 'frontend', 'build', '.env');
fs.mkdirSync(path.dirname(frontendBuildEnvPath), { recursive: true });
fs.writeFileSync(frontendBuildEnvPath, envContent);

// Write to electron resources directory
const electronResourcesEnvPath = path.join(rootDir, 'electron', 'resources', 'frontend', '.env');
fs.mkdirSync(path.dirname(electronResourcesEnvPath), { recursive: true });
fs.writeFileSync(electronResourcesEnvPath, envContent);

// Create a production package.json for the backend
const backendPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'backend', 'package.json'), 'utf8'));
delete backendPackageJson.devDependencies;
fs.writeFileSync(
    path.join(rootDir, 'backend', 'package.json'),
    JSON.stringify(backendPackageJson, null, 2)
);

console.log('\n📦 Building electron app...');
runCommand('npm run build', path.join(rootDir, 'electron'));

// Copy .env file to electron/dist resources for all platforms
const platforms = {
  darwin: path.join(rootDir, 'electron', 'dist', 'mac', 'boatsim-desktop.app', 'Contents', 'Resources', 'frontend'),
  win32: path.join(rootDir, 'electron', 'dist', 'win-unpacked', 'resources', 'frontend'),
  linux: path.join(rootDir, 'electron', 'dist', 'linux-unpacked', 'resources', 'frontend')
};

const platformPath = platforms[process.platform];
if (platformPath) {
  const distEnvPath = path.join(platformPath, '.env');
  fs.mkdirSync(path.dirname(distEnvPath), { recursive: true });
  fs.writeFileSync(distEnvPath, Object.entries(envVars).map(([key, value]) => `${key}=${value}`).join('\n'));
}

console.log('\n✅ Build completed successfully!'); 