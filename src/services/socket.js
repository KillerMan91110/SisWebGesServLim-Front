import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  if (socket) return socket;
  const token = localStorage.getItem("token");
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
