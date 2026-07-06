# 🎥 Vidss - Real-time Video Calling Platform

A modern, full-stack video calling platform built with React, Node.js, Socket.IO, and WebRTC.

## ✨ Features

- 🎬 **Real-time Video Calls** - Peer-to-peer video/audio communication using WebRTC
- 💬 **Live Chat** - In-meeting text chat
- 🔐 **User Authentication** - Secure JWT-based auth system
- 🏠 **Meeting Rooms** - Create and join meeting rooms with unique codes
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Built with React 19 and TailwindCSS
- ⚡ **Real-time Signaling** - Socket.IO for WebRTC signaling
- 🗄️ **PostgreSQL Database** - Prisma ORM for type-safe database access

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling
- **React Router** - Client-side routing
- **Zustand** - State management
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js + Express** - REST API
- **TypeScript** - Type safety
- **Socket.IO** - WebSocket server for signaling
- **PostgreSQL** - Database
- **Prisma ORM** - Database ORM
- **JWT** - Authentication
- **Zod** - Validation

## 📁 Project Structure

```
vidss/
├── client/                 # React frontend
│   ├── src/
│   │   ├── features/      # Feature-based modules
│   │   │   ├── auth/      # Authentication
│   │   │   └── meeting/   # Meeting/video calling
│   │   ├── shared/        # Shared components & utilities
│   │   └── routes/        # Route configuration
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── features/     # Feature modules
│   │   │   ├── auth/     # Auth routes & services
│   │   │   └── meeting/  # Meeting routes & services
│   │   ├── shared/       # Shared utilities
│   │   ├── socket.ts     # Socket.IO server
│   │   └── index.ts      # Server entry point
│   ├── prisma/           # Database schema & migrations
│   └── package.json
│
├── render.yaml           # Render deployment config
└── DEPLOYMENT.md         # Deployment guide
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vidss
   ```

2. **Set up the database**
   ```bash
   # Install PostgreSQL and create database
   createdb vidss
   ```

3. **Configure environment variables**

   **Server** (`server/.env`):
   ```env
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/vidss?schema=public
   JWT_SECRET=your_jwt_secret_change_in_production
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_change_in_production
   FRONTEND_URL=http://localhost:5173
   ```

   **Client** (`client/.env`):
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Install dependencies & setup database**

   **Backend:**
   ```bash
   cd server
   npm install
   npx prisma generate
   npx prisma migrate deploy
   ```

   **Frontend:**
   ```bash
   cd client
   npm install
   ```

5. **Start development servers**

   **Backend** (in `server/` directory):
   ```bash
   npm run dev
   ```

   **Frontend** (in `client/` directory):
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - Health check: http://localhost:5000/health

## 🎮 Usage

1. **Register/Login** - Create an account or log in
2. **Create Meeting** - Start a new video meeting and get a room code
3. **Join Meeting** - Enter a room code to join an existing meeting
4. **Video Call** - Enable camera/microphone and start calling
5. **Chat** - Use in-meeting chat to send messages

## 📦 Deployment

### Deploy to Render.com (Free)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete deployment guide.

**Quick start:**
1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **"New +"** → **"Blueprint"**
4. Select your repository
5. Click **"Apply"**

Your app will be live in ~10 minutes!

## 🧪 Development

### Available Scripts

**Backend:**
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typecheck` - Type checking
- `npm run lint` - Lint code

**Frontend:**
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

### Database Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Deploy migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (DB GUI)
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset
```

## 🔒 Security

- JWT authentication for API and Socket.IO
- Bcrypt password hashing
- Helmet security headers
- CORS protection
- Input validation with Zod
- SQL injection protection via Prisma

## 🌐 Browser Support

- Chrome/Edge 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Opera 76+

**Note**: WebRTC requires HTTPS in production (Render provides this automatically).

## 📝 API Documentation

### REST Endpoints

**Auth:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

**Meetings:**
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:code` - Get meeting by code
- `GET /api/meetings/user/all` - Get user's meetings

### Socket.IO Events

**Client → Server:**
- `room:join` - Join meeting room
- `room:leave` - Leave meeting room
- `signal:offer` - Send WebRTC offer
- `signal:answer` - Send WebRTC answer
- `signal:ice` - Send ICE candidate
- `chat:send` - Send chat message
- `user:toggle-audio` - Toggle audio state
- `user:toggle-video` - Toggle video state

**Server → Client:**
- `room:joined` - User joined room
- `room:left` - User left room
- `room:participants` - Current participants list
- `signal:offer` - Receive WebRTC offer
- `signal:answer` - Receive WebRTC answer
- `signal:ice` - Receive ICE candidate
- `chat:receive` - Receive chat message
- `room:error` - Room error

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- WebRTC for peer-to-peer communication
- Socket.IO for real-time signaling
- Render for free hosting
- Prisma for amazing DX with databases

## 📞 Support

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/vidss/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/vidss/discussions)

---

Made with ❤️ by [Your Name]
