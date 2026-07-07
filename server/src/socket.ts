import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from './shared/constants';
import { verifyAccessToken } from './shared/utils/jwt';
import { prisma } from './shared/prisma';

let io: Server | null = null;

export const initSocket = (server: HTTPServer): Server => {
  // Configure CORS for Socket.IO based on environment
  const allowedOrigins = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'https://localhost:5173'];

  const socketCorsOrigin = process.env.NODE_ENV === 'production'
    ? allowedOrigins
    : '*';

  io = new Server(server, {
    cors: {
      origin: socketCorsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Render-specific: Handle connection issues better
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication Middleware for Sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload; // Attach user payload to socket.data
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    console.log(
      `[Socket] User connected and authenticated: ${socket.id} (User: ${socket.data.user?.email})`,
    );

    // Handle Join Room
    socket.on(
      SOCKET_EVENTS.ROOM_JOIN,
      async ({ roomCode, name }: { roomCode: string; name: string }) => {
        try {
          // Validate meeting room exists in database
          const meeting = await prisma.meeting.findUnique({
            where: { code: roomCode },
          });

          if (!meeting) {
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'Meeting room not found' });
            return;
          }

          // Check if meeting is expired (active for 24 hours)
          const MEETING_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
          const isExpired = Date.now() - new Date(meeting.createdAt).getTime() > MEETING_EXPIRY_MS;

          if (isExpired || !meeting.isActive) {
            if (meeting.isActive) {
              // Asynchronously deactivate in DB for future queries
              prisma.meeting.update({
                where: { code: roomCode },
                data: { isActive: false },
              }).catch((err) => console.error('[Socket] Failed to auto-deactivate expired room:', err));
            }
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'Meeting room has expired or is inactive' });
            return;
          }

          socket.join(roomCode);
          socket.data.roomCode = roomCode;
          socket.data.name = name;

          console.log(`[Socket] Client ${socket.id} (${name}) joined room ${roomCode}`);

          // Broadcast to other room members that a new user joined
          socket.to(roomCode).emit(SOCKET_EVENTS.ROOM_JOINED, {
            socketId: socket.id,
            userId: socket.data.user?.userId,
            name,
          });

          // Send list of current participants in the room back to the client
          if (io) {
            const clients = await io.in(roomCode).fetchSockets();
            const participants = clients
              .filter((c) => c.id !== socket.id)
              .map((c) => ({
                socketId: c.id,
                userId: c.data.user?.userId,
                name: c.data.name || 'Participant',
              }));
            socket.emit('room:participants', participants);
          }
        } catch (error) {
          console.error(`[Socket] Error joining room ${roomCode}:`, error);
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Internal server error joining meeting' });
        }
      },
    );

    // Handle Leave Room
    socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => {
      const roomCode = socket.data.roomCode;
      if (roomCode) {
        console.log(`[Socket] Client ${socket.id} left room ${roomCode}`);
        socket.leave(roomCode);
        socket.to(roomCode).emit(SOCKET_EVENTS.ROOM_LEFT, { socketId: socket.id });
        socket.data.roomCode = undefined;
      }
    });

    // Signaling Offer
    socket.on(SOCKET_EVENTS.SIGNAL_OFFER, ({ to, offer }) => {
      io?.to(to).emit(SOCKET_EVENTS.SIGNAL_OFFER, {
        from: socket.id,
        offer,
      });
    });

    // Signaling Answer
    socket.on(SOCKET_EVENTS.SIGNAL_ANSWER, ({ to, answer }) => {
      io?.to(to).emit(SOCKET_EVENTS.SIGNAL_ANSWER, {
        from: socket.id,
        answer,
      });
    });

    // ICE Candidate Exchange
    socket.on(SOCKET_EVENTS.SIGNAL_ICE, ({ to, candidate }) => {
      io?.to(to).emit(SOCKET_EVENTS.SIGNAL_ICE, {
        from: socket.id,
        candidate,
      });
    });

    // Chat Message Forwarding
    socket.on(SOCKET_EVENTS.CHAT_SEND, ({ text }: { text: string }) => {
      const roomCode = socket.data.roomCode;
      if (roomCode) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        io?.to(roomCode).emit(SOCKET_EVENTS.CHAT_RECEIVE, {
          sender: socket.data.name || 'Participant',
          text,
          time,
        });
      }
    });

    // Presence Toggles: Audio
    socket.on(SOCKET_EVENTS.USER_TOGGLE_AUDIO, ({ enabled }: { enabled: boolean }) => {
      const roomCode = socket.data.roomCode;
      if (roomCode) {
        socket.to(roomCode).emit(SOCKET_EVENTS.USER_TOGGLE_AUDIO, {
          socketId: socket.id,
          enabled,
        });
      }
    });

    // Presence Toggles: Video
    socket.on(SOCKET_EVENTS.USER_TOGGLE_VIDEO, ({ enabled }: { enabled: boolean }) => {
      const roomCode = socket.data.roomCode;
      if (roomCode) {
        socket.to(roomCode).emit(SOCKET_EVENTS.USER_TOGGLE_VIDEO, {
          socketId: socket.id,
          enabled,
        });
      }
    });

    // Disconnect Handling
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      const roomCode = socket.data.roomCode;
      if (roomCode) {
        console.log(`[Socket] User ${socket.id} disconnected from room ${roomCode}`);
        socket.to(roomCode).emit(SOCKET_EVENTS.ROOM_LEFT, { socketId: socket.id });
      } else {
        console.log(`[Socket] User disconnected: ${socket.id}`);
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket first.');
  }
  return io;
};
