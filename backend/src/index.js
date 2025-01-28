import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MessageForwarder } from './message_forwarder.js';
import path from 'path';
import fs from 'fs';
import { configureServer } from './serverConfig.js';

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
app.use(corsMiddleware);

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