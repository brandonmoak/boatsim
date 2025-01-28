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
            reconnectionAttempts: 5
        });
    }
    return socket;
};

export const getSocket = (): Socket | null => socket; 