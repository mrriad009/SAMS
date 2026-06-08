import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { classSessions, courses } from '../models/schema.js';
import { AppError } from '../utils/response.js';
import { getStaffScope, studentMatchesScope, type StaffScope } from './teacher.service.js';
import * as studentService from './student.service.js';
import { localDateKey } from '../utils/date.js';

export function todayDateKey(): string {
  return localDateKey();
}

export function assertAttendanceDateAllowed(role: string, date: string): void {
  if (role === 'admin') return;
  if (date !== todayDateKey()) {
    throw new AppError('Attendance can only be marked for today', 403);
  }
}

export async function getTeacherScope(userId: string): Promise<StaffScope> {
  return getStaffScope(userId);
}

export async function assertCourseInTeacherScope(userId: string, courseId: string): Promise<void> {
  const scope = await getStaffScope(userId);
  const [course] = await db
    .select({
      department: courses.department,
      semester: courses.semester,
    })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) throw new AppError('Course not found', 404);
  if (course.department !== scope.department) {
    throw new AppError('You can only manage courses in your department', 403);
  }
  if (scope.semester != null && course.semester !== scope.semester) {
    throw new AppError('You can only manage courses for your assigned semester', 403);
  }
}

export async function assertSessionInTeacherScope(
  userId: string,
  sessionId: string,
  options?: { requireToday?: boolean }
): Promise<{ sessionDate: string; courseId: string }> {
  const [row] = await db
    .select({
      sessionDate: classSessions.date,
      courseId: classSessions.courseId,
    })
    .from(classSessions)
    .where(eq(classSessions.id, sessionId))
    .limit(1);

  if (!row) throw new AppError('Session not found', 404);

  await assertCourseInTeacherScope(userId, row.courseId);

  if (options?.requireToday) {
    assertAttendanceDateAllowed('teacher', row.sessionDate);
  }

  return row;
}

export async function assertStudentsInTeacherScope(
  userId: string,
  studentDbIds: string[]
): Promise<void> {
  const scope = await getStaffScope(userId);
  for (const id of studentDbIds) {
    const student = await studentService.getStudentById(id);
    if (!studentMatchesScope(student, scope)) {
      throw new AppError('You can only mark attendance for students in your section', 403);
    }
  }
}

export function assertSectionFilterAllowed(
  role: string,
  scope: StaffScope,
  section?: string
): string | undefined {
  if (role === 'admin') return section;
  if (scope.section) return scope.section;
  return section;
}

export async function assertTeacherCreateSession(
  userId: string,
  data: { courseId: string; date: string }
): Promise<void> {
  assertAttendanceDateAllowed('teacher', data.date);
  await assertCourseInTeacherScope(userId, data.courseId);
}
