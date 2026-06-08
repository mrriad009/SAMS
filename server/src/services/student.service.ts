import { calculateSemester } from '../utils/semester.js';
import { eq, and, or, ilike, sql, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users, students, studentCourses, courses } from '../models/schema.js';
import { hashPassword, sendWelcomeEmail } from './auth.service.js';
import { AppError } from '../utils/response.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants.js';

interface StudentFilters {
  search?: string;
  department?: string;
  semester?: number;
  section?: string;
  batchYear?: number;
  page?: number;
  limit?: number;
}

type StudentRow = {
  id: string;
  batchYear: number;
  semester: number;
};

async function syncSemesterIfNeeded(row: StudentRow) {
  const current = calculateSemester(row.batchYear);
  if (current === row.semester) return row.semester;
  await db.update(students).set({ semester: current }).where(eq(students.id, row.id));
  return current;
}

export async function listStudents(filters: StudentFilters) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (filters.department) conditions.push(eq(students.department, filters.department));
  if (filters.semester) conditions.push(eq(students.semester, filters.semester));
  if (filters.section) conditions.push(eq(students.section, filters.section));
  if (filters.batchYear) conditions.push(eq(students.batchYear, filters.batchYear));
  if (filters.search) {
    conditions.push(
      or(
        ilike(users.name, `%${filters.search}%`),
        ilike(users.email, `%${filters.search}%`),
        ilike(students.studentId, `%${filters.search}%`)
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: students.id,
      userId: students.userId,
      studentId: students.studentId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      department: students.department,
      semester: students.semester,
      section: students.section,
      batchYear: students.batchYear,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
      address: students.address,
      createdAt: users.createdAt,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const synced = await Promise.all(
    rows.map(async (row) => {
      const semester = await syncSemesterIfNeeded(row);
      return semester === row.semester ? row : { ...row, semester };
    })
  );

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(where);

  return {
    students: synced,
    meta: { page, limit, total: countResult?.count || 0, totalPages: Math.ceil((countResult?.count || 0) / limit) },
  };
}

function normalizeRollNumber(rollNumber: string) {
  return rollNumber.trim();
}

export async function getStudentByRollNumber(rollNumber: string) {
  const normalized = normalizeRollNumber(rollNumber);
  if (!normalized) throw new AppError('Student not found', 404);

  const [row] = await db
    .select({
      id: students.id,
      userId: students.userId,
      studentId: students.studentId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      department: students.department,
      semester: students.semester,
      section: students.section,
      batchYear: students.batchYear,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
      address: students.address,
      createdAt: users.createdAt,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.studentId, normalized))
    .limit(1);

  if (!row) throw new AppError('Student not found', 404);
  const semester = await syncSemesterIfNeeded(row);
  return semester === row.semester ? row : { ...row, semester };
}

export async function getStudentById(id: string) {
  const [row] = await db
    .select({
      id: students.id,
      userId: students.userId,
      studentId: students.studentId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      department: students.department,
      semester: students.semester,
      section: students.section,
      batchYear: students.batchYear,
      guardianName: students.guardianName,
      guardianPhone: students.guardianPhone,
      address: students.address,
      createdAt: users.createdAt,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.id, id))
    .limit(1);

  if (!row) throw new AppError('Student not found', 404);
  const semester = await syncSemesterIfNeeded(row);
  return semester === row.semester ? row : { ...row, semester };
}

export async function createStudent(data: {
  name: string;
  email: string;
  studentId: string;
  department: string;
  section: string;
  batchYear: number;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  password?: string;
}) {
  const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (existing.length) throw new AppError('Email already exists', 400);

  const studentId = normalizeRollNumber(data.studentId);
  if (!studentId) throw new AppError('Student ID is required', 400);

  const existingId = await db
    .select()
    .from(students)
    .where(eq(students.studentId, studentId))
    .limit(1);
  if (existingId.length) throw new AppError('Student ID already exists', 400);

  const tempPassword = data.password || studentId;
  const passwordHash = await hashPassword(tempPassword);

  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'student',
      phone: data.phone,
    })
    .returning();

  const semester = calculateSemester(data.batchYear);

  const [student] = await db
    .insert(students)
    .values({
      userId: user.id,
      studentId,
      department: data.department,
      semester,
      section: data.section,
      batchYear: data.batchYear,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      address: data.address,
    })
    .returning();

  await sendWelcomeEmail(data.email, tempPassword);

  return { ...student, name: user.name, email: user.email };
}

export async function updateStudent(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    studentId: string;
    phone: string;
    department: string;
    section: string;
    batchYear: number;
    guardianName: string;
    guardianPhone: string;
    address: string;
  }>
) {
  const student = await getStudentById(id);

  if (data.email && data.email !== student.email) {
    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing.length) throw new AppError('Email already exists', 400);
  }

  const userUpdates: Partial<typeof users.$inferInsert> = {};
  if (data.name) userUpdates.name = data.name;
  if (data.email) userUpdates.email = data.email;
  if (data.phone !== undefined) userUpdates.phone = data.phone;
  userUpdates.updatedAt = new Date();

  if (Object.keys(userUpdates).length > 1) {
    await db.update(users).set(userUpdates).where(eq(users.id, student.userId));
  }

  const studentUpdates: Partial<typeof students.$inferInsert> = {};
  if (data.studentId !== undefined) {
    const newStudentId = normalizeRollNumber(data.studentId);
    if (!newStudentId) throw new AppError('Student ID is required', 400);
    if (newStudentId !== student.studentId) {
      const [existing] = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.studentId, newStudentId))
        .limit(1);
      if (existing && existing.id !== id) {
        throw new AppError('Student ID already exists', 400);
      }
      studentUpdates.studentId = newStudentId;
    }
  }
  if (data.department) studentUpdates.department = data.department;
  if (data.section) studentUpdates.section = data.section;
  if (data.batchYear) {
    studentUpdates.batchYear = data.batchYear;
    studentUpdates.semester = calculateSemester(data.batchYear);
  }
  if (data.guardianName !== undefined) studentUpdates.guardianName = data.guardianName;
  if (data.guardianPhone !== undefined) studentUpdates.guardianPhone = data.guardianPhone;
  if (data.address !== undefined) studentUpdates.address = data.address;

  if (Object.keys(studentUpdates).length > 0) {
    await db.update(students).set(studentUpdates).where(eq(students.id, id));
  }

  return getStudentById(id);
}

export async function deleteStudent(id: string) {
  const student = await getStudentById(id);
  await db.delete(users).where(eq(users.id, student.userId));
}

export async function getStudentByUserId(userId: string) {
  const [row] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (!row) throw new AppError('Student profile not found', 404);
  const semester = await syncSemesterIfNeeded(row);
  return semester === row.semester ? row : { ...row, semester };
}

export async function getEnrolledCourses(studentId: string) {
  return db
    .select({
      enrollmentId: studentCourses.id,
      enrolledAt: studentCourses.enrolledAt,
      courseId: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      creditHours: courses.creditHours,
      department: courses.department,
      semester: courses.semester,
    })
    .from(studentCourses)
    .innerJoin(courses, eq(studentCourses.courseId, courses.id))
    .where(eq(studentCourses.studentId, studentId));
}
