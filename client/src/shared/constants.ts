export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',
  ROOM_LEAVE: 'room:leave',
  ROOM_LEFT: 'room:left',
  SIGNAL_OFFER: 'signal:offer',
  SIGNAL_ANSWER: 'signal:answer',
  SIGNAL_ICE: 'signal:ice',
  CHAT_SEND: 'chat:send',
  CHAT_RECEIVE: 'chat:receive',
  USER_TOGGLE_AUDIO: 'user:toggle-audio',
  USER_TOGGLE_VIDEO: 'user:toggle-video',
  ERROR: 'room:error',
} as const;

export const MEETING_CONFIG = {
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
} as const;

// API Configuration - Uses environment variable
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
