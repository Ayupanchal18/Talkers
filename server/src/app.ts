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
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // In production, only allow requests from the configured frontend URL
      if (process.env.NODE_ENV === 'production') {
        const frontendUrl = process.env.FRONTEND_URL;
        const allowed =
          frontendUrl &&
          (origin === frontendUrl ||
            origin === `https://${frontendUrl}` ||
            origin.includes('vidss-frontend.onrender.com'));

        if (allowed) {
          callback(null, true);
        } else {
          console.warn(`[CORS] Blocked origin: ${origin}`);
          callback(new Error(`CORS: Origin ${origin} is not allowed`));
        }
      } else {
        // Development: allow everything
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
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
