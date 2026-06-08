import type { Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import * as profileService from '../services/profile.service.js';
import * as settingsService from '../services/settings.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { departmentSchema, sectionSchema } from '../utils/academic.validation.js';
import { isValidBatchYear } from '../utils/semester.js';
import { isStudentRegistrationAllowed } from '../config/env.js';
import { isAllowedImageBuffer } from '../utils/image-validation.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

export const avatarUpload = upload.single('avatar');

const studentProfileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  department: departmentSchema,
  section: sectionSchema,
  address: z.string().optional(),
});

const studentRegisterSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
  studentId: z.string().min(1, 'Student ID is required'),
  department: departmentSchema,
  section: sectionSchema,
  phone: z.string().optional(),
  batchYear: z.coerce
    .number()
    .int()
    .refine(isValidBatchYear, 'Select a valid batch year'),
});

const adminProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export async function registerStudent(req: Request, res: Response) {
  if (!isStudentRegistrationAllowed()) {
    return sendError(res, 'Student registration is disabled', 403);
  }

  const parsed = studentRegisterSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

  const student = await profileService.registerStudentAccount(parsed.data);
  return sendSuccess(res, student, 'Registration successful', 201);
}

export async function getProfile(req: Request, res: Response) {
  const profile = await profileService.getStudentProfile(req.user!.userId);
  return sendSuccess(res, profile);
}

export async function updateContact(req: Request, res: Response) {
  const parsed = studentProfileSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

  const profile = await profileService.updateStudentContact(req.user!.userId, parsed.data);
  return sendSuccess(res, profile, 'Profile updated');
}

export async function uploadAvatar(req: Request, res: Response) {
  if (!req.file) return sendError(res, 'No file uploaded');
  if (!isAllowedImageBuffer(req.file.buffer)) {
    return sendError(res, 'Invalid image file', 400);
  }
  const user = await profileService.uploadAvatar(req.user!.userId, req.file.buffer);
  return sendSuccess(res, user, 'Avatar uploaded');
}

export async function getSettings(_req: Request, res: Response) {
  const settings = await settingsService.getAllSettings();
  return sendSuccess(res, settings);
}

export async function updateSettings(req: Request, res: Response) {
  const settings = await settingsService.updateSettings(req.body);
  return sendSuccess(res, settings, 'Settings updated');
}

export async function updateAdminProfile(req: Request, res: Response) {
  const parsed = adminProfileSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

  const user = await profileService.updateProfile(req.user!.userId, parsed.data);
  return sendSuccess(res, user, 'Profile updated');
}
