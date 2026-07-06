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
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // In production, check if origin matches frontend URL
      if (process.env.NODE_ENV === 'production') {
        const frontendUrl = process.env.FRONTEND_URL;
        // Match with or without protocol
        if (frontendUrl && (
          origin === frontendUrl || 
          origin === `https://${frontendUrl}` ||
          origin.includes('vidss-frontend.onrender.com')
        )) {
          callback(null, true);
        } else {
          console.log(`CORS blocked origin: ${origin}, expected: ${frontendUrl}`);
          callback(null, true); // Allow for now to debug
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
