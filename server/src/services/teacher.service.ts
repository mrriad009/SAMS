import { and, eq, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { courses, students, teachers } from '../models/schema.js';
import { AppError } from '../utils/response.js';
import { getTodaySessions } from './attendance.service.js';

export interface StaffScope {
  department: string;
  semester: number | null;
  section: string | null;
  staffType: 'teacher' | 'cr';
}

export function studentMatchesScope(
  student: { department: string; semester: number; section: string },
  scope: StaffScope
): boolean {
  if (student.department !== scope.department) return false;
  if (scope.semester != null && student.semester !== scope.semester) return false;
  if (scope.section && student.section !== scope.section) return false;
  return true;
}

export async function getStaffScope(userId: string): Promise<StaffScope> {
  const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, userId)).limit(1);
  if (!teacher) throw new AppError('Staff profile not found', 404);

  return {
    department: teacher.department,
    semester: teacher.semester,
    section: teacher.section,
    staffType: teacher.staffType,
  };
}

export async function getTeacherDashboardStats(userId: string) {
  const scope = await getStaffScope(userId);
  const conditions = [eq(students.department, scope.department)];
  if (scope.semester != null) conditions.push(eq(students.semester, scope.semester));
  if (scope.section) conditions.push(eq(students.section, scope.section));

  const [studentCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .where(and(...conditions));

  const courseConditions = [eq(courses.department, scope.department)];
  if (scope.semester != null) courseConditions.push(eq(courses.semester, scope.semester));

  const [courseCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(courses)
    .where(and(...courseConditions));

  const todaySessions = await getTodaySessions();

  return {
    scope,
    totalStudents: studentCount?.count || 0,
    totalCourses: courseCount?.count || 0,
    todaySessions: todaySessions.length,
  };
}
