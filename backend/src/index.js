import express from 'express';
import { createServer } from 'http';
import { MessageForwarder } from './message_forwarder.js';
import { configureServer } from './utils/server_config.js';
import { saveDefaults, getDefaults } from './utils/storage.js';
import { boatsimEnvPath } from './utils/paths.js';
import dotenv from 'dotenv';

// Load environment variables from ~/.boatsim/.env
dotenv.config({ path: boatsimEnvPath });

// configure the environment 
const frontendPort = process.env.PORT;
const backendPort = process.env.REACT_APP_BACKEND_PORT;

if (!frontendPort || !backendPort) {
    throw new Error('Required environment variables PORT and REACT_APP_BACKEND_PORT not found in ~/.boatsim/.env');
}

const app = express();
const httpServer = createServer(app);

// Configure server and get io instance
const { corsMiddleware, io } = configureServer(httpServer, frontendPort);

// Add middleware
app.use(corsMiddleware);
app.use(express.json()); // Add JSON body parsing

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request for ${req.url}`);
  next();
});

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
app.get('/api/device/status', async (req, res) => {
    const status = await forwarder.getEachDeviceStatus();
    res.json(status);
});

app.post('/api/device/connect', (req, res) => {
    console.log("Connection request for device", req.body);
    try {
        if (req.body.devicePath.startsWith("tcp://")) {
            return res.status(500).json({ error: "TCP devices not yet supported" });
            // forwarder.connectTcpDevice(req.body.devicePath);
        } else {
            forwarder.connectSerialDevice(req.body.devicePath);
            return res.json({ message: 'Connection initiated' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/api/device/disconnect', (req, res) => {
    try {
        console.log("Disconnection request for device", req.body);
        forwarder.disconnectSerialDevice(req.body.devicePath);
        res.json({ message: 'Disconnection initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
httpServer.listen(backendPort, '0.0.0.0', () => {
  console.log(`Server running on port ${backendPort}`);
}); 