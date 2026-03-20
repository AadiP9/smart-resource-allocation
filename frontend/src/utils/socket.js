import { io } from 'socket.io-client';

const URL = 'http://localhost:8000'; // Backend URL for MVP
export const socket = io(URL);
