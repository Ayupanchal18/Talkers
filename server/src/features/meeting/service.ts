import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors/AppError';
import { MeetingResponse } from './types';

/**
 * Generates a standard xxx-xxxx-xxx style room code.
 */
function generateRoomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const getPart = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${getPart(3)}-${getPart(4)}-${getPart(3)}`;
}

/**
 * Generates a unique room code, checking database for collisions.
 */
async function generateUniqueRoomCode(): Promise<string> {
  let code = '';
  let attempts = 0;
  while (attempts < 5) {
    code = generateRoomCode();
    const existing = await prisma.meeting.findUnique({
      where: { code },
    });
    if (!existing) {
      return code;
    }
    attempts++;
  }
  throw new AppError('Failed to generate a unique meeting code', 500);
}

/**
 * Handles creation of a meeting room.
 */
export async function createMeeting(hostId: string, title?: string): Promise<MeetingResponse> {
  const code = await generateUniqueRoomCode();

  const meeting = await prisma.meeting.create({
    data: {
      title: title || 'New Calling Session',
      code,
      hostId,
    },
  });

  return meeting;
}

/**
 * Verifies and joins an active meeting room by its code.
 */
export async function joinMeeting(code: string): Promise<MeetingResponse> {
  const meeting = await prisma.meeting.findUnique({
    where: { code },
  });

  if (!meeting || !meeting.isActive) {
    throw new AppError('Meeting room not found or is inactive', 404);
  }

  return meeting;
}
