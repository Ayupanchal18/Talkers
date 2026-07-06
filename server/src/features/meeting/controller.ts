import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError';
import * as meetingService from './service';

export async function createMeeting(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Authentication required to create a meeting', 401);
    }

    const { title } = req.body;
    const result = await meetingService.createMeeting(userId, title);

    res.status(201).json({
      status: 'success',
      data: {
        meeting: result,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function joinMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.body;
    const result = await meetingService.joinMeeting(code);

    res.status(200).json({
      status: 'success',
      data: {
        meeting: result,
      },
    });
  } catch (error) {
    next(error);
  }
}
