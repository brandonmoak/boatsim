import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
    if (!socket) {
        const backendPort = process.env.REACT_APP_BACKEND_PORT;
        console.log('Backend port:', backendPort);
        socket = io(`http://localhost:${backendPort}`, {
            transports: ['websocket'],
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            forceNew: true,
            timeout: 5000,
            // Disable buffering/batching
            perMessageDeflate: { threshold: 0 },
            // Enable TCP_NODELAY
            extraHeaders: {
                'Connection': 'Upgrade',
                'Upgrade': 'websocket',
                'TCP_NODELAY': '1'
            },
            // Add performance configurations
            transportOptions: {
                websocket: {
                    binaryType: 'arraybuffer',
                    noDelay: true  // Enable TCP_NODELAY for WebSocket
                }
            }
        });

        // Add connection monitoring
        socket.on('connect', () => {
            console.log('Socket connected with ID:', socket?.id);
            // Try to set TCP_NODELAY on the underlying connection if possible
            const transport = (socket as any).io?.engine?.transport;
            if (transport?.ws?.socket?.setNoDelay) {
                transport.ws.socket.setNoDelay(true);
                console.log('Set TCP_NODELAY on client WebSocket');
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        socket.io.on('ping', () => {
            console.log('Socket ping');
        });

        socket.io.engine?.on('packet', (packet: any) => {
            console.log('Socket packet:', packet);
        });
    }
    return socket;
};

export const getSocket = (): Socket | null => socket; 