import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { initSocket } from './socket';

dotenv.config();

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';

server.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Server URL: http://${HOST}:${PORT}`);
  console.log(`✅ Health check: http://${HOST}:${PORT}/health`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🏠 Local:   http://localhost:${PORT}`);
  }
});
