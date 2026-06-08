import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users } from '../models/schema.js';
import { uploadAvatarImage } from '../utils/upload.js';
import { AppError } from '../utils/response.js';
import { getMe } from './auth.service.js';

export async function updateProfile(
  userId: string,
  data: { name?: string; phone?: string; avatarUrl?: string }
) {
  const updates: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (data.name !== undefined) updates.name = data.name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();

  if (!updated) throw new AppError('User not found', 404);
  const { passwordHash: _, ...rest } = updated;
  return rest;
}

export async function uploadAvatar(userId: string, buffer: Buffer) {
  const url = await uploadAvatarImage(userId, buffer);
  return updateProfile(userId, { avatarUrl: url });
}

export async function getStudentProfile(userId: string) {
  return getMe(userId);
}

export async function updateStudentContact(
  userId: string,
  data: {
    name: string;
    phone?: string;
    department: string;
    section: string;
    address?: string;
  }
) {
  const profile = await getMe(userId);
  if (profile.role !== 'student') throw new AppError('Not a student', 403);

  if (!data.name?.trim()) throw new AppError('Name is required', 400);
  if (!data.department?.trim()) throw new AppError('Department is required', 400);
  if (!data.section?.trim()) throw new AppError('Section is required', 400);

  await updateProfile(userId, {
    name: data.name.trim(),
    phone: data.phone?.trim() || undefined,
  });

  const { students } = await import('../models/schema.js');
  await db
    .update(students)
    .set({
      department: data.department.trim(),
      section: data.section.trim(),
      address: data.address?.trim() || null,
    })
    .where(eq(students.userId, userId));

  return getMe(userId);
}

export async function registerStudentAccount(data: {
  name: string;
  email: string;
  password: string;
  studentId: string;
  department: string;
  section: string;
  phone?: string;
  batchYear: number;
}) {
  const { createStudent } = await import('./student.service.js');
  const student = await createStudent({
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    studentId: data.studentId.trim(),
    department: data.department.trim(),
    section: data.section.trim(),
    phone: data.phone?.trim() || undefined,
    batchYear: data.batchYear,
  });
  return student;
}
