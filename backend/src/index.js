import express from 'express';
import { createServer } from 'http';
import { MessageForwarder } from './message_forwarder.js';
import path from 'path';
import fs from 'fs';
import { configureServer } from './server_config.js';
import { saveDefaults, getDefaults } from './storage.js';

// configure the environment 
const actisensePath = '/dev/serial/by-id/usb-Actisense_NGX-1_4CD81-if00-port0';
const frontendEnvPath = path.join(process.cwd(), '../frontend/.env');
const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
const frontendPort = frontendEnv.match(/PORT=(\d+)/)[1];
const backendPort = frontendEnv.match(/REACT_APP_BACKEND_PORT=(\d+)/)[1];

const app = express();
const httpServer = createServer(app);

// Configure server and get io instance
const { corsMiddleware, io } = configureServer(httpServer, frontendPort);

// Add middleware
app.use(corsMiddleware);
app.use(express.json()); // Add JSON body parsing

// Add route for saving defaults
app.post('/api/defaults', async (req, res) => {
  try {
    const defaults = await saveDefaults(req.body);
    res.json(defaults);
  } catch (error) {
    console.error('Error saving defaults:', error);
    res.status(500).json({ error: 'Failed to save defaults' });
  }
});

// Add route for getting defaults
app.get('/api/defaults', async (req, res) => {
  try {
    const defaults = await getDefaults();
    res.json(defaults);
  } catch (error) {
    console.error('Error reading defaults:', error);
    res.status(500).json({ error: 'Failed to read defaults' });
  }
});

// Create message forwarding instance and set up its routes
const forwarder = new MessageForwarder(io);

// Add REST endpoints for device management
app.get('/api/device/status', (req, res) => {
    const status = forwarder.getEachDeviceStatus();
    res.json(status);
});

app.post('/api/device/connect', (req, res) => {
    try {
        console.log("Connection request for device", req.body);
        if (req.body.devicePath.startsWith("tcp://")) {
            // forwarder.connectTcpDevice(req.body.devicePath);
        } else {
            forwarder.connectSerialDevice(req.body.devicePath);
        }
        res.json({ message: 'Connection initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/device/disconnect', (req, res) => {
    try {
        forwarder.disconnectSerialDevice(actisensePath);
        res.json({ message: 'Disconnection initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
httpServer.listen(backendPort, () => {
  console.log(`Server running on port ${backendPort}`);
}); 