import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { loadEnvVars } from './env-helper.js';
import fs from 'fs';

try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const isDev = process.argv.includes('--dev');

    let mainWindow;
    let backendProcess;

    // Load environment variables
    console.log('Loading environment variables...');
    const envVars = loadEnvVars();
    const frontendPort = process.env.ELECTRON_START_URL 
        ? new URL(process.env.ELECTRON_START_URL).port 
        : (envVars.PORT || 3002);
    const backendPort = envVars.REACT_APP_BACKEND_PORT || 5010;

    console.log('Environment loaded:', { frontendPort, backendPort });

    function startBackend() {
        const backendPath = isDev 
            ? path.join(__dirname, '../backend')
            : path.join(process.resourcesPath, 'backend');

        console.log('Starting backend at:', backendPath);
        console.log('Resource path:', process.resourcesPath);
        console.log('Current directory:', __dirname);
        
        // List contents of resources directory
        try {
            console.log('\nContents of resources directory:');
            const resourceContents = fs.readdirSync(process.resourcesPath);
            console.log(resourceContents);

            const nodePath = path.join(process.resourcesPath, 'node');
            if (fs.existsSync(nodePath)) {
                console.log('\nContents of node directory:');
                const nodeContents = fs.readdirSync(nodePath);
                console.log(nodeContents);

                const binPath = path.join(nodePath, 'bin');
                if (fs.existsSync(binPath)) {
                    console.log('\nContents of bin directory:');
                    const binContents = fs.readdirSync(binPath);
                    console.log(binContents);
                }
            } else {
                console.log('\nNode directory not found at:', nodePath);
            }
        } catch (error) {
            console.error('Error listing directory contents:', error);
        }
        
        // Use bundled Node.js in production, system Node.js in development
        const nodePath = isDev 
            ? 'node'
            : path.join(
                process.resourcesPath, 
                'node',
                'bin',
                'node'
              );
        
        // Make sure the binary is executable on Unix systems
        if (!isDev && process.platform !== 'win32') {
            try {
                console.log('\nAttempting to set permissions on:', nodePath);
                if (fs.existsSync(nodePath)) {
                    const statsBefore = fs.statSync(nodePath);
                    console.log('Permissions before:', statsBefore.mode.toString(8));
                    
                    fs.chmodSync(nodePath, '755');
                    
                    const statsAfter = fs.statSync(nodePath);
                    console.log('Permissions after:', statsAfter.mode.toString(8));
                } else {
                    console.error('Node binary not found at path:', nodePath);
                }
            } catch (error) {
                console.error('Failed to set executable permissions:', error);
            }
        }
        
        // Verify the binary exists
        if (!isDev) {
            if (!fs.existsSync(nodePath)) {
                throw new Error(`Node.js binary not found at ${nodePath}`);
            }
        }
        
        console.log('Using Node.js at:', nodePath);

        try {
            backendProcess = spawn(nodePath, ['src/index.js'], {
                cwd: backendPath,
                env: {
                    ...process.env,
                    ...envVars,
                    ELECTRON: 'true',
                    NODE_ENV: isDev ? 'development' : 'production'
                },
                shell: isDev // Only use shell in development
            });

            backendProcess.stdout.on('data', (data) => {
                console.log(`Backend stdout: ${data}`);
            });

            backendProcess.stderr.on('data', (data) => {
                console.error(`Backend stderr: ${data}`);
            });

            backendProcess.on('error', (error) => {
                console.error('Failed to start backend process:', error);
            });

            backendProcess.on('close', (code) => {
                console.log(`Backend process exited with code ${code}`);
            });

        } catch (error) {
            console.error('Error starting backend:', error);
            throw error;
        }
    }

    function stopBackend() {
        if (backendProcess) {
            console.log('Stopping backend process...');
            backendProcess.kill();
            backendProcess = null;
        }
    }

    function createWindow() {
        console.log('Creating window...');
        mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        const startUrl = isDev 
            ? `http://localhost:${frontendPort}`
            : `file://${path.join(process.resourcesPath, 'frontend/build/index.html')}`;
        
        console.log('Loading URL:', startUrl);
        mainWindow.loadURL(startUrl);

        if (isDev) {
            mainWindow.webContents.openDevTools();
            // Register shortcut
            globalShortcut.register('CommandOrControl+Shift+I', () => {
                mainWindow.webContents.toggleDevTools();
            });
        }

        mainWindow.on('closed', () => {
            console.log('Window closed');
            mainWindow = null;
            stopBackend();
            // Unregister shortcut
            if (isDev) {
                globalShortcut.unregister('CommandOrControl+Shift+I');
            }
            app.quit();
        });
    }

    app.whenReady().then(() => {
        console.log('Electron app is ready');
        startBackend();
        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });

    app.on('window-all-closed', () => {
        console.log('All windows closed');
        stopBackend();
        app.quit();
    });

    app.on('before-quit', () => {
        console.log('App quitting');
        stopBackend();
    });

} catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
} 