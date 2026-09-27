import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { departments } from '../models/schema.js';
import { AppError } from '../utils/response.js';

const DEFAULT_DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'EEE', name: 'Electrical & Electronic Engineering' },
  { code: 'BBA', name: 'Business Administration' },
];

export async function listDepartments() {
  const existing = await db.select().from(departments);
  if (existing.length === 0) {
    await db.insert(departments).values(DEFAULT_DEPARTMENTS);
  }

  return db.select().from(departments).orderBy(departments.code);
}

export async function createDepartment(input: { code: string; name: string }) {
  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  if (!/^[A-Z0-9]{2,20}$/.test(code)) {
    throw new AppError('Department code must be 2–20 letters or numbers', 400);
  }
  if (name.length < 3) throw new AppError('Department name is required', 400);

  const [duplicate] = await db
    .select()
    .from(departments)
    .where(eq(departments.code, code))
    .limit(1);
  if (duplicate) throw new AppError('A department with this code already exists', 409);

  const [created] = await db.insert(departments).values({ code, name }).returning();
  return created;
}
