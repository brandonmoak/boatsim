import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MessageForwarder } from './message_forwarder.js';

const app = express();
const httpServer = createServer(app);

// Configure CORS for both Express and Socket.IO
app.use(cors());
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  // Add connection debugging and control options
  connectTimeout: 5000,
  pingTimeout: 20000,
  pingInterval: 25000
});

const path = '/dev/usb-Actisense_NGX-1_4CD81-if00-port0';
// Create boat simulator instance
const forwarder = new MessageForwarder(io, path);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected', {
    id: socket.id,
    transport: socket.conn.transport.name,
    headers: socket.handshake.headers['user-agent']
  });

  socket.on('update_pgn_2000', (data) => {
    console.log('Received PGN update:', data);
    forwarder.handlePGNUpdate(data);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected', {
      id: socket.id,
      reason: reason
    });
  });
});

// Start server
const PORT = 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 