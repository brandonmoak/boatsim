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

// Create boat simulator instance
const forwarder = new MessageForwarder(io, actisensePath, actisensePath);

// Socket.IO connection handling
io.on('connection', (socket) => {
  socket.on('update_pgn_2000', (data) => {
    forwarder.handlePGNUpdate(data);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', {
      id: socket.id,
      reason: reason
    });
  });
});

// Start server
httpServer.listen(backendPort, () => {
  console.log(`Server running on port ${backendPort}`);
}); 