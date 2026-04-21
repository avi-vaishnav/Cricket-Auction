import { io } from 'socket.io-client';

import { SOCKET_BASE_URL } from './api';

const URL = SOCKET_BASE_URL;

export const socket = io(URL, {
  autoConnect: false,
});
