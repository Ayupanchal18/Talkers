import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { API_URL } from '../../../shared/constants';

const SOCKET_URL = API_URL;

interface UseMeetingSocketProps {
  roomCode: string;
  isMediaReady?: boolean;
  onMessageReceived?: (msg: { sender: string; text: string; time: string }) => void;
  onUserJoined?: (user: { socketId: string; userId: string; name: string }) => void;
  onUserLeft?: (user: { socketId: string }) => void;
  onAudioToggled?: (data: { socketId: string; enabled: boolean }) => void;
  onVideoToggled?: (data: { socketId: string; enabled: boolean }) => void;
  onParticipantsList?: (
    participants: Array<{ socketId: string; userId: string; name: string }>,
  ) => void;
  onSignalOffer?: (data: { from: string; offer: any }) => void;
  onSignalAnswer?: (data: { from: string; answer: any }) => void;
  onSignalIce?: (data: { from: string; candidate: any }) => void;
  onError?: (error: { message: string }) => void;
}

export function useMeetingSocket({
  roomCode,
  isMediaReady = true,
  onMessageReceived,
  onUserJoined,
  onUserLeft,
  onAudioToggled,
  onVideoToggled,
  onParticipantsList,
  onSignalOffer,
  onSignalAnswer,
  onSignalIce,
  onError,
}: UseMeetingSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, user } = useAuthStore();

  const callbacksRef = useRef({
    onMessageReceived,
    onUserJoined,
    onUserLeft,
    onAudioToggled,
    onVideoToggled,
    onParticipantsList,
    onSignalOffer,
    onSignalAnswer,
    onSignalIce,
    onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMessageReceived,
      onUserJoined,
      onUserLeft,
      onAudioToggled,
      onVideoToggled,
      onParticipantsList,
      onSignalOffer,
      onSignalAnswer,
      onSignalIce,
      onError,
    };
  });

  useEffect(() => {
    if (!accessToken || !user || !roomCode || !isMediaReady) return;

    // Connect to Socket.IO backend using authentication handshake
    const socket = io(SOCKET_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket'], // React Native operates best strictly on WebSockets
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to server:', socket.id);
      socket.emit('room:join', { roomCode, name: user.name });
    });

    socket.on('room:error', (err) => {
      console.warn('[Socket] Room error received:', err);
      if (callbacksRef.current.onError) callbacksRef.current.onError(err);
    });

    socket.on('room:participants', (list) => {
      if (callbacksRef.current.onParticipantsList) callbacksRef.current.onParticipantsList(list);
    });

    socket.on('room:joined', (data) => {
      if (callbacksRef.current.onUserJoined) callbacksRef.current.onUserJoined(data);
    });

    socket.on('room:left', (data) => {
      if (callbacksRef.current.onUserLeft) callbacksRef.current.onUserLeft(data);
    });

    socket.on('user:toggle-audio', (data) => {
      if (callbacksRef.current.onAudioToggled) callbacksRef.current.onAudioToggled(data);
    });

    socket.on('user:toggle-video', (data) => {
      if (callbacksRef.current.onVideoToggled) callbacksRef.current.onVideoToggled(data);
    });

    socket.on('chat:receive', (msg) => {
      if (callbacksRef.current.onMessageReceived) callbacksRef.current.onMessageReceived(msg);
    });

    // WebRTC Signaling Events
    socket.on('signal:offer', (data) => {
      if (callbacksRef.current.onSignalOffer) callbacksRef.current.onSignalOffer(data);
    });

    socket.on('signal:answer', (data) => {
      if (callbacksRef.current.onSignalAnswer) callbacksRef.current.onSignalAnswer(data);
    });

    socket.on('signal:ice', (data) => {
      if (callbacksRef.current.onSignalIce) callbacksRef.current.onSignalIce(data);
    });

    return () => {
      console.log('[Socket] Leaving room & disconnecting...');
      socket.emit('room:leave');
      socket.disconnect();
    };
  }, [roomCode, accessToken, user, isMediaReady]);

  const sendMessage = (text: string) => {
    socketRef.current?.emit('chat:send', { text });
  };

  const toggleAudio = (enabled: boolean) => {
    socketRef.current?.emit('user:toggle-audio', { enabled });
  };

  const toggleVideo = (enabled: boolean) => {
    socketRef.current?.emit('user:toggle-video', { enabled });
  };

  const sendOffer = (to: string, offer: any) => {
    socketRef.current?.emit('signal:offer', { to, offer });
  };

  const sendAnswer = (to: string, answer: any) => {
    socketRef.current?.emit('signal:answer', { to, answer });
  };

  const sendIceCandidate = (to: string, candidate: any) => {
    socketRef.current?.emit('signal:ice', { to, candidate });
  };

  return {
    socket: socketRef.current,
    sendMessage,
    toggleAudio,
    toggleVideo,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };
}
