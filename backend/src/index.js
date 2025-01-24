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
  }
});

// Create boat simulator instance
const forwarder = new MessageForwarder(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('update_pgn_2000', (data) => {
    console.log('Received PGN update:', data);
    forwarder.handlePGNUpdate(data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 