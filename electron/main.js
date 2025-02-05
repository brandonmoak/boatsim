import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import isDev from 'electron-is-dev';
import os from 'os';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { exec } from 'child_process';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;
let frontendProcess;

// Load environment variables from ~/.boatsim/.env
const env = dotenv.config({ path: path.join(os.homedir(), '.boatsim', '.env') });
dotenvExpand.expand(env);

// Get environment variables
const frontendPort = process.env.PORT;
const backendPort = process.env.REACT_APP_BACKEND_PORT;
const backendUrl = process.env.REACT_APP_BACKEND_URL;

if (!frontendPort || !backendPort || !backendUrl) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

function startFrontend() {
  if (isDev) {
    console.log('Starting frontend build process...');
    frontendProcess = exec('cd .. && npm run start --workspace=frontend', {
      env: {
        ...process.env,
        PORT: frontendPort,
        BROWSER: 'none' // Prevent opening in browser
      }
    });

    frontendProcess.stdout?.on('data', (data) => {
      console.log(`Frontend: ${data}`);
      // Once the development server is ready, create the window
      if (data.includes('webpack compiled successfully')) {
        createWindow();
      }
    });

    frontendProcess.stderr?.on('data', (data) => {
      console.error(`Frontend Error: ${data}`);
    });

    frontendProcess.on('exit', (code) => {
      console.log(`Frontend process exited with code ${code}`);
    });

    console.log('Frontend process PID:', frontendProcess.pid);
  }
}

function forceKillProcess(process, name) {
  return new Promise((resolve) => {
    if (!process || !process.pid) {
      console.log(`${name} process not found or invalid`);
      resolve();
      return;
    }

    console.log(`Attempting to kill ${name} process (PID: ${process.pid})`);
    
    // For frontend, we need to kill any node process on the port first
    if (name === 'frontend') {
      try {
        // Kill any node process listening on the frontend port
        exec(`lsof -ti :${frontendPort} | xargs kill -9`, (error) => {
          if (error) {
            console.log(`Error killing port ${frontendPort} process:`, error);
          } else {
            console.log(`Successfully killed process on port ${frontendPort}`);
          }
        });
      } catch (e) {
        console.log(`Error killing port process: ${e.message}`);
      }
    }
    
    const timeout = setTimeout(() => {
      console.log(`Force killing ${name} process with SIGKILL...`);
      try {
        process.kill('SIGKILL');
      } catch (e) {
        console.log(`Error force killing ${name} process: ${e.message}`);
      }
      resolve();
    }, 2000);

    try {
      process.once('exit', () => {
        console.log(`${name} process exited gracefully`);
        clearTimeout(timeout);
        resolve();
      });

      process.kill('SIGTERM');
    } catch (e) {
      clearTimeout(timeout);
      resolve();
    }
  });
}

// Prevent multiple quit attempts
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(process.cwd(), '../frontend/public/boat_favicon.png')
  });

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${frontendPort}`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/build/index.html'));
  }

  // Add keyboard shortcuts for DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isMac = process.platform === 'darwin';
    const devToolsShortcut = isMac
      ? input.meta && input.alt && input.key.toLowerCase() === 'i'  // Cmd+Option+I for macOS
      : (input.control && input.shift && input.key.toLowerCase() === 'i');  // Ctrl+Shift+I for Windows/Linux

    if (devToolsShortcut) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('close', async (e) => {
    if (isQuitting) return;
    
    e.preventDefault();
    isQuitting = true;
    
    if (backendProcess) {
      await forceKillProcess(backendProcess, 'backend');
      backendProcess = null;
    }
    if (frontendProcess) {
      await forceKillProcess(frontendProcess, 'frontend');
      frontendProcess = null;
    }
    mainWindow = null;
    app.quit();
  });
}

function startBackend() {
  console.log('Starting backend process...');
  const backendPath = isDev 
    ? path.join(__dirname, '../backend/src/index.js')
    : path.join(process.resourcesPath, 'backend/src/index.js');

  backendProcess = spawn('node', [backendPath], {
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: frontendPort,
      REACT_APP_BACKEND_PORT: backendPort,
      REACT_APP_BACKEND_URL: backendUrl
    }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  console.log('Backend process PID:', backendProcess.pid);
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(() => {
  if (isDev) {
    startFrontend();
  } else {
    createWindow();
  }
  startBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});