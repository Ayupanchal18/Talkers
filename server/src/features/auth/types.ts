import { z } from 'zod';
import { registerSchema, loginSchema } from './validation';

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
}
