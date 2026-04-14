import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname);
    const apiBase = process.env.REACT_APP_API_URL || (isLocalhost ? 'http://localhost:5000/api' : '/api');
    const socketBase = apiBase.replace(/\/api$/, '');
    socketInstance = io(socketBase, { transports: ['websocket', 'polling'] });
  }
  return socketInstance;
};

export const connectSocketForUser = (userId) => {
  const socket = getSocket();
  if (!socket.connected) socket.connect();
  if (userId) socket.emit('join-user', userId);
  return socket;
};

export const joinArtworkRoom = (artworkId) => {
  if (!artworkId) return;
  getSocket().emit('join-artwork', artworkId);
};

export const leaveArtworkRoom = (artworkId) => {
  if (!artworkId) return;
  getSocket().emit('leave-artwork', artworkId);
};
