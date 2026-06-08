import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { env, isAdminRegistrationAllowed } from '../config/env.js';
import {
  crAccountEmail,
  DEMO_CR_SEMESTER,
  DEMO_CR_SECTION,
  parseCrLoginShortcut,
} from '../data/nubtk/cr-accounts.js';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username required'),
  password: z.string().min(1, 'Password required'),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  teacherId: z.string().min(1),
  designation: z.string().min(1),
  department: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', { path: '/api/auth' });
}

function normalizeLoginEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (value === 'admin') return 'admin@admin.com';
  if (value === 'student') return '11220321018@gmail.com';
  if (value === 'teacher' || value === 'cr') {
    return crAccountEmail(DEMO_CR_SEMESTER, DEMO_CR_SECTION);
  }
  const crShortcut = parseCrLoginShortcut(value);
  if (crShortcut) return crShortcut;
  if (/^\d{8,14}$/.test(value)) return `${value}@gmail.com`;
  return value;
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

  const email = normalizeLoginEmail(parsed.data.email);
  const result = await authService.login(email, parsed.data.password);
  setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    accessToken: result.accessToken,
    user: result.user,
  }, 'Login successful');
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

  const { db } = await import('../config/db.js');
  const { users } = await import('../models/schema.js');
  const { eq } = await import('drizzle-orm');
  const admins = await db.select().from(users).where(eq(users.role, 'admin'));

  if (admins.length > 0 && !isAdminRegistrationAllowed()) {
    return sendError(res, 'Registration disabled', 403);
  }

  const user = await authService.registerAdmin(parsed.data);
  return sendSuccess(res, user, 'Admin registered', 201);
}

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logout(refreshToken, req.user?.userId);
  clearRefreshCookie(res);
  return sendSuccess(res, null, 'Logged out');
}

export async function refreshToken(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) return sendError(res, 'Refresh token required', 401);

  const result = await authService.refreshAccessToken(token);
  setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, { accessToken: result.accessToken });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.userId);
  return sendSuccess(res, user);
}

export async function changePassword(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

  await authService.changePassword(
    req.user!.userId,
    parsed.data.currentPassword,
    parsed.data.newPassword
  );
  return sendSuccess(res, null, 'Password changed');
}

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

  await authService.forgotPassword(parsed.data.email);
  return sendSuccess(res, null, 'If the email exists, a reset link has been sent');
}

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

  await authService.resetPassword(parsed.data.token, parsed.data.newPassword);
  return sendSuccess(res, null, 'Password reset successful');
}
