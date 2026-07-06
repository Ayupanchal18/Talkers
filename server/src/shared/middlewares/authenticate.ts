import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// Extend Express Request type to include authenticated user payload
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token required', 401);
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired authentication token', 401));
  }
};
