import { z } from 'zod';

export const createMeetingSchema = z.object({
  body: z.object({
    title: z.string().max(100, 'Title is too long').optional(),
  }),
});

export const joinMeetingSchema = z.object({
  body: z.object({
    code: z.string().min(3, 'Meeting code must be at least 3 characters'),
  }),
});
