import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Log error details
  console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode} - Message: ${message}`);
  if (!(err instanceof AppError)) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message:
      statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
