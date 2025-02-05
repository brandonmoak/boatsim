import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import { loadEnvVars } from '../electron/env-helper.js';

// Get root directory and environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envVars = loadEnvVars();
const frontendPort = envVars.PORT || 3000;

// Helper function to spawn processes
function spawnProcess(command, args, cwd, name, env = {}) {
    console.log(`[${name}] Spawning process:`, { command, args, cwd });
    const proc = spawn(command, args, {
        cwd,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, ...envVars, ...env }
    });

    proc.stdout.on('data', (data) => {
        console.log(`[${name}] ${data.toString().trim()}`);
    });

    proc.stderr.on('data', (data) => {
        console.error(`[${name}] ${data.toString().trim()}`);
    });

    return proc;
}

// Function to check if port is actually in use
function checkPort(port) {
    return new Promise((resolve) => {
        const client = new net.Socket();
        
        client.on('connect', () => {
            client.destroy();
            resolve(true);
        });
        
        client.on('error', () => {
            client.destroy();
            resolve(false);
        });

        client.connect(port, 'localhost');
    });
}

// Function to wait for port with timeout and retries
async function waitForPort(port, retries = 30, interval = 1000) {
    console.log(`[Setup] Checking port ${port}...`);
    
    for (let i = 0; i < retries; i++) {
        const isPortInUse = await checkPort(port);
        if (isPortInUse) {
            console.log(`[Setup] Port ${port} is now available`);
            return true;
        }
        console.log(`[Setup] Waiting for port ${port} (attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Timeout waiting for port ${port}`);
}

// Start all processes
async function startDev() {
    console.log('🚀 Starting development environment...');

    // Start frontend
    const frontend = spawnProcess('npm', ['start'],
        path.join(rootDir, 'frontend'),
        'Frontend',
        { BROWSER: 'none' }
    );

    try {
        // Wait for frontend to be ready
        console.log(`[Setup] Waiting for frontend server to be ready on port ${frontendPort}...`);
        await waitForPort(frontendPort);
        console.log('[Setup] Frontend server is ready');

        // Start electron with proper environment
        console.log('[Setup] Starting Electron...');
        const electron = spawnProcess('npm', ['run', 'dev'],
            path.join(rootDir, 'electron'),
            'Electron',
            {
                NODE_ENV: 'development',
                ELECTRON_START_URL: `http://localhost:${frontendPort}`
            }
        );

        // Handle process termination
        function cleanup() {
            console.log('\n🛑 Shutting down...');
            frontend.kill('SIGKILL'); // Force kill the frontend process
            electron.kill('SIGKILL'); // Force kill the electron process
            
            // Exit after a short delay to ensure processes are killed
            setTimeout(() => {
                process.exit(0);
            }, 100);
        }

        // Listen for both SIGINT (Ctrl+C) and SIGTERM
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        // Also listen for the electron process exit
        electron.on('exit', () => {
            console.log('Electron process exited, cleaning up...');
            cleanup();
        });

    } catch (error) {
        console.error('Error during startup:', error);
        frontend.kill();
        process.exit(1);
    }
}

startDev().catch((error) => {
    console.error('Error in development setup:', error);
    process.exit(1);
});