import { io } from 'socket.io-client';
import { API_URL } from '../config/constants';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }
  return socket;
};

export const subscribeToCity = (city) => {
  const s = getSocket();
  if (s.connected) {
    s.emit('subscribe_city', city);
  } else {
    s.once('connect', () => s.emit('subscribe_city', city));
  }
};

export default getSocket;
