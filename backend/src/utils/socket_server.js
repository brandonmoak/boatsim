import { Server } from 'socket.io';
import cors from 'cors';

export function configureSocketServer(httpServer, frontendPort) {
  // Configure TCP_NODELAY on the HTTP server
  httpServer.on('connection', (socket) => {
    socket.setNoDelay(true);
    console.log('New TCP connection with TCP_NODELAY enabled');
  });

  // Configure CORS for Express
  const corsMiddleware = cors();

  // Configure Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    // Disable all buffering/batching
    transports: ['websocket'],
    perMessageDeflate: false,
    httpCompression: false,
    maxHttpBufferSize: 1e8,
    pingTimeout: 20000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    serveClient: false,
    allowEIO3: true,
    connectTimeout: 5000
  });

  io.engine.on('connection', (socket) => {
    console.log('Raw engine connection:', {
      id: socket.id,
      protocol: socket.protocol,
      transport: socket.transport?.name
    });
  });

  // Configure Socket.IO connection logging
  io.on('connection', (socket) => {
    console.log('Client connected:', {
      id: socket.id,
      transport: socket.conn.transport.name
    });

    // Only log write queue if it's getting large
    setInterval(() => {
      const writeQueueLength = socket.conn.writeBuffer?.length || 0;
      if (writeQueueLength > 1000) {
        console.log('Large write queue:', writeQueueLength);
      }
    }, 1000);

    socket.conn.on('upgrade', (transport) => {
      console.log('Socket upgraded to:', transport.name);
    });
  });

  // Configure event loop lag monitoring
  let lastCheck = Date.now();
  setInterval(() => {
    const now = Date.now();
    const lag = now - lastCheck - 100;
    if (lag > 50) {  // Only log if lag is greater than 50ms
      console.log(`Event loop lag: ${lag}ms`);
    }
    lastCheck = now;
  }, 100);

  return { corsMiddleware, io };
} 