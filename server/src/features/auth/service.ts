import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors/AppError';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../../shared/utils/jwt';
import { RegisterInput, LoginInput, AuthResponse } from './types';

/**
 * Handles user registration business logic.
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  // Hash password using native scrypt
  const hashedPassword = await hashPassword(input.password);

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    input.name,
  )}`;

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: hashedPassword,
      avatarUrl: defaultAvatar,
    },
  });

  const payload: TokenPayload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Handles user login verification and token issuance.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Compare passwords
  const isPasswordValid = await comparePassword(input.password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const payload: TokenPayload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Handles refresh token verification and rotates access & refresh tokens.
 */
export async function refresh(
  token: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const decoded = verifyRefreshToken(token);

    // Verify user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    const payload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}
