import { z } from 'zod';
import { createMeetingSchema, joinMeetingSchema } from './validation';

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>['body'];
export type JoinMeetingInput = z.infer<typeof joinMeetingSchema>['body'];

export interface MeetingResponse {
  id: string;
  title: string | null;
  code: string;
  hostId: string;
  isActive: boolean;
  createdAt: Date;
}
