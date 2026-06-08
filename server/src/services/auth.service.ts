import bcrypt from 'bcryptjs';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../config/db.js';
import {
  users,
  students,
  teachers,
  refreshTokens,
  passwordResetTokens,
} from '../models/schema.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshExpiryDate,
  getResetExpiryDate,
  generateResetToken,
} from '../utils/jwt.js';
import { AppError } from '../utils/response.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/mailer.js';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash: _, ...rest } = user;
  return rest;
}

export async function login(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const payload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getRefreshExpiryDate(),
  });

  let profile = null;
  if (user.role === 'student') {
    [profile] = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
  } else if (user.role === 'admin' || user.role === 'teacher') {
    [profile] = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
  }

  return {
    accessToken,
    refreshToken,
    user: { ...sanitizeUser(user), profile },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        eq(refreshTokens.userId, payload.userId),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!stored) throw new AppError('Refresh token not found or expired', 401);

  await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) throw new AppError('User not found', 404);

  const newPayload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: getRefreshExpiryDate(),
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string | undefined, userId?: string) {
  if (refreshToken) {
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, hashToken(refreshToken)));
  }
  if (userId) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }
}

export async function getMe(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new AppError('User not found', 404);

  let profile = null;
  if (user.role === 'student') {
    const { getStudentByUserId } = await import('./student.service.js');
    profile = await getStudentByUserId(user.id);
  } else if (user.role === 'admin' || user.role === 'teacher') {
    [profile] = await db.select().from(teachers).where(eq(teachers.userId, user.id)).limit(1);
  }

  return { ...sanitizeUser(user), profile };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new AppError('User not found', 404);

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400);

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function forgotPassword(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return;

  const token = generateResetToken();
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: getResetExpiryDate(),
  });

  await sendPasswordResetEmail(email, token);
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const [stored] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!stored) throw new AppError('Invalid or expired reset token', 400);

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, stored.userId));

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, stored.id));
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, stored.userId));
}

export async function registerAdmin(data: {
  name: string;
  email: string;
  password: string;
  teacherId: string;
  designation: string;
  department: string;
}) {
  const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (existing.length > 0) throw new AppError('Email already registered', 400);

  const passwordHash = await hashPassword(data.password);
  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'admin',
    })
    .returning();

  await db.insert(teachers).values({
    userId: user.id,
    teacherId: data.teacherId,
    designation: data.designation,
    department: data.department,
  });

  return sanitizeUser(user);
}

export { sendWelcomeEmail };
