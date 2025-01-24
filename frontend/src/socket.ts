import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
    if (!socket) {
        socket = io('http://localhost:5001', {
            transports: ['websocket'],
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });
    }
    return socket;
};

export const getSocket = (): Socket | null => socket; 