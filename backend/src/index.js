import express from 'express';
import { createServer } from 'http';
import { MessageForwarder } from './message_forwarder.js';
import { configureSocketServer } from './utils/socket_server.js';
import { configureRoutes } from './utils/routes.js';
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
const { corsMiddleware, io } = configureSocketServer(httpServer, frontendPort);

// Add middleware
app.use(corsMiddleware);
app.use(express.json()); // Add JSON body parsing

// Create message forwarding instance and set up its routes
// OPENS a websocket connection to the frontend
const forwarder = new MessageForwarder(io);

// Configure all routes
configureRoutes(app, forwarder);

// Start server
httpServer.listen(backendPort, '0.0.0.0', () => {
  console.log(`Server running on port ${backendPort}`);
}); 