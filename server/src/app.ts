import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppError } from './shared/errors/AppError';
import { errorHandler } from './shared/middlewares/errorHandler';
import authRouter from './features/auth/routes';
import meetingRouter from './features/meeting/routes';

dotenv.config();

const app = express();

// HTTP Request Logging
app.use(morgan('dev'));

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean) // Production: only allow configured frontend
  : [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'https://localhost:5173',
      'http://192.168.1.17:5173',
      'https://192.168.1.17:5173'
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // In production, strictly check origin. In dev, allow all for easier testing
      if (process.env.NODE_ENV === 'production') {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Feature Routes
app.use('/api/auth', authRouter);
app.use('/api/meetings', meetingRouter);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unhandled Route Handler
app.use('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

export default app;
