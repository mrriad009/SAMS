import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  role: 'admin' | 'teacher' | 'student';
  email: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: parseJwtExpiry(env.jwtAccessExpiry, '15m'),
    algorithm: 'HS256',
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: parseJwtExpiry(env.jwtRefreshExpiry, '7d'),
    algorithm: 'HS256',
  });
}

/** jsonwebtoken accepts "15m", "1h", "7d" — not values like "1h30m" */
function parseJwtExpiry(value: string, fallback: string): jwt.SignOptions['expiresIn'] {
  const normalized = value.trim();
  if (/^\d+[smhdwy]$/i.test(normalized) || /^\d+$/.test(normalized)) {
    return normalized as jwt.SignOptions['expiresIn'];
  }
  console.warn(`Invalid JWT expiry "${value}", using fallback "${fallback}"`);
  return fallback as jwt.SignOptions['expiresIn'];
}

const JWT_ALGORITHMS: jwt.Algorithm[] = ['HS256'];

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtAccessSecret, { algorithms: JWT_ALGORITHMS }) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret, { algorithms: JWT_ALGORITHMS }) as TokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshExpiryDate(): Date {
  const days = parseInt(env.jwtRefreshExpiry.replace('d', ''), 10) || 7;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function getResetExpiryDate(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  return date;
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
