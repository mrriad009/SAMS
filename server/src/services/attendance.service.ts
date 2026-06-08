import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import {
  classSessions,
  attendance,
  courses,
  students,
  studentCourses,
  users,
  teachers,
} from '../models/schema.js';
import { AppError } from '../utils/response.js';
import { getSetting } from './settings.service.js';

export async function listSessions(filters?: {
  courseId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
}) {
  const conditions = [];
  if (filters?.courseId) conditions.push(eq(classSessions.courseId, filters.courseId));
  if (filters?.dateFrom) conditions.push(gte(classSessions.date, filters.dateFrom));
  if (filters?.dateTo) conditions.push(lte(classSessions.date, filters.dateTo));
  if (filters?.status) conditions.push(eq(classSessions.status, filters.status));

  return db
    .select({
      id: classSessions.id,
      courseId: classSessions.courseId,
      teacherId: classSessions.teacherId,
      date: classSessions.date,
      startTime: classSessions.startTime,
      endTime: classSessions.endTime,
      topic: classSessions.topic,
      roomNumber: classSessions.roomNumber,
      status: classSessions.status,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
    })
    .from(classSessions)
    .innerJoin(courses, eq(classSessions.courseId, courses.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(classSessions.date));
}

export async function createSession(data: {
  courseId: string;
  teacherId?: string;
  date: string;
  startTime: string;
  endTime: string;
  topic?: string;
  roomNumber?: string;
}) {
  const [session] = await db.insert(classSessions).values(data).returning();
  return session;
}

export async function getSessionAttendance(sessionId: string) {
  const [session] = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.id, sessionId))
    .limit(1);
  if (!session) throw new AppError('Session not found', 404);

  const enrolled = await db
    .select({
      studentDbId: students.id,
      studentId: students.studentId,
      name: users.name,
      section: students.section,
    })
    .from(studentCourses)
    .innerJoin(students, eq(studentCourses.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(studentCourses.courseId, session.courseId));

  const records = await db
    .select()
    .from(attendance)
    .where(eq(attendance.sessionId, sessionId));

  const recordMap = new Map(records.map((r) => [r.studentId, r]));

  const sheet = enrolled.map((s) => ({
    studentDbId: s.studentDbId,
    studentId: s.studentId,
    name: s.name,
    section: s.section,
    attendance: recordMap.get(s.studentDbId) || null,
  }));

  return { session, sheet };
}

export async function submitAttendance(
  sessionId: string,
  records: Array<{ studentId: string; status: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }>,
  markedBy: string
) {
  await getSessionAttendance(sessionId);

  // neon-http driver does not support db.transaction — run statements sequentially
  for (const record of records) {
    const [existing] = await db
      .select()
      .from(attendance)
      .where(
        and(eq(attendance.sessionId, sessionId), eq(attendance.studentId, record.studentId))
      )
      .limit(1);

    if (existing) {
      await db
        .update(attendance)
        .set({
          status: record.status,
          remarks: record.remarks,
          markedAt: new Date(),
          markedBy,
        })
        .where(eq(attendance.id, existing.id));
    } else {
      await db.insert(attendance).values({
        sessionId,
        studentId: record.studentId,
        status: record.status,
        markedBy,
        remarks: record.remarks,
      });
    }
  }

  await db
    .update(classSessions)
    .set({ status: 'completed' })
    .where(eq(classSessions.id, sessionId));

  return getSessionAttendance(sessionId);
}

export async function updateAttendanceRecord(
  id: string,
  data: { status?: 'present' | 'absent' | 'late' | 'excused'; remarks?: string },
  markedBy: string
) {
  const [record] = await db.select().from(attendance).where(eq(attendance.id, id)).limit(1);
  if (!record) throw new AppError('Attendance record not found', 404);

  const [updated] = await db
    .update(attendance)
    .set({ ...data, markedAt: new Date(), markedBy })
    .where(eq(attendance.id, id))
    .returning();

  return updated;
}

export async function getAttendanceRecordContext(id: string) {
  const [row] = await db
    .select({
      recordId: attendance.id,
      studentDbId: attendance.studentId,
      sessionId: attendance.sessionId,
      sessionDate: classSessions.date,
      courseId: classSessions.courseId,
    })
    .from(attendance)
    .innerJoin(classSessions, eq(attendance.sessionId, classSessions.id))
    .where(eq(attendance.id, id))
    .limit(1);

  if (!row) throw new AppError('Attendance record not found', 404);
  return row;
}

export async function getStudentAttendance(userId: string, filters?: { courseId?: string }) {
  const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (!student) throw new AppError('Student not found', 404);

  const conditions = [eq(attendance.studentId, student.id)];
  if (filters?.courseId) conditions.push(eq(classSessions.courseId, filters.courseId));

  return db
    .select({
      id: attendance.id,
      status: attendance.status,
      markedAt: attendance.markedAt,
      remarks: attendance.remarks,
      sessionDate: classSessions.date,
      sessionTopic: classSessions.topic,
      startTime: classSessions.startTime,
      endTime: classSessions.endTime,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      courseId: courses.id,
    })
    .from(attendance)
    .innerJoin(classSessions, eq(attendance.sessionId, classSessions.id))
    .innerJoin(courses, eq(classSessions.courseId, courses.id))
    .where(and(...conditions))
    .orderBy(desc(classSessions.date));
}

export async function getStudentAttendanceSummary(userId: string) {
  const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (!student) throw new AppError('Student not found', 404);
  return getStudentAttendanceSummaryByDbId(student.id);
}

export async function getStudentAttendanceSummaryByDbId(studentDbId: string) {
  const threshold = parseInt((await getSetting('attendance_threshold')) || '75', 10);

  const courseStats = await db
    .select({
      courseId: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      total: sql<number>`count(${attendance.id})::int`,
      present: sql<number>`count(case when ${attendance.status} in ('present', 'late') then 1 end)::int`,
    })
    .from(studentCourses)
    .innerJoin(courses, eq(studentCourses.courseId, courses.id))
    .leftJoin(classSessions, eq(classSessions.courseId, courses.id))
    .leftJoin(
      attendance,
      and(eq(attendance.sessionId, classSessions.id), eq(attendance.studentId, studentDbId))
    )
    .where(eq(studentCourses.studentId, studentDbId))
    .groupBy(courses.id, courses.courseCode, courses.courseName);

  const summaries = courseStats.map((c) => ({
    ...c,
    percentage: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
    belowThreshold: c.total > 0 ? (c.present / c.total) * 100 < threshold : false,
  }));

  const overallTotal = summaries.reduce((sum, s) => sum + s.total, 0);
  const overallPresent = summaries.reduce((sum, s) => sum + s.present, 0);
  const overallPercentage =
    overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

  return {
    courses: summaries,
    overall: {
      total: overallTotal,
      present: overallPresent,
      percentage: overallPercentage,
      belowThreshold: overallTotal > 0 && overallPercentage < threshold,
    },
    threshold,
  };
}

export async function getTodaySessions() {
  const today = new Date().toISOString().split('T')[0];
  return listSessions({ dateFrom: today, dateTo: today });
}

interface AttendanceScopeFilter {
  department?: string;
  semester?: number;
  section?: string;
}

export async function getAttendanceTrend(days = 30, scope?: AttendanceScopeFilter) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split('T')[0];

  const hasScope = !!(scope?.department || scope?.semester != null || scope?.section);

  if (hasScope) {
    const conditions = [gte(classSessions.date, start)];
    if (scope?.department) conditions.push(eq(students.department, scope.department));
    if (scope?.semester != null) conditions.push(eq(students.semester, scope.semester));
    if (scope?.section) conditions.push(eq(students.section, scope.section));

    return db
      .select({
        date: classSessions.date,
        total: sql<number>`count(${attendance.id})::int`,
        present: sql<number>`count(case when ${attendance.status} in ('present', 'late') then 1 end)::int`,
      })
      .from(classSessions)
      .innerJoin(attendance, eq(attendance.sessionId, classSessions.id))
      .innerJoin(students, eq(attendance.studentId, students.id))
      .where(and(...conditions))
      .groupBy(classSessions.date)
      .orderBy(classSessions.date);
  }

  return db
    .select({
      date: classSessions.date,
      total: sql<number>`count(${attendance.id})::int`,
      present: sql<number>`count(case when ${attendance.status} in ('present', 'late') then 1 end)::int`,
    })
    .from(classSessions)
    .leftJoin(attendance, eq(attendance.sessionId, classSessions.id))
    .where(gte(classSessions.date, start))
    .groupBy(classSessions.date)
    .orderBy(classSessions.date);
}

export async function getLowAttendanceStudents(threshold?: number, scope?: AttendanceScopeFilter) {
  const thresh = threshold || parseInt((await getSetting('attendance_threshold')) || '75', 10);

  const studentConditions = [];
  if (scope?.department) studentConditions.push(eq(students.department, scope.department));
  if (scope?.semester != null) studentConditions.push(eq(students.semester, scope.semester));
  if (scope?.section) studentConditions.push(eq(students.section, scope.section));

  const allStudents = await db
    .select({
      id: students.id,
      studentId: students.studentId,
      name: users.name,
      department: students.department,
      section: students.section,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(studentConditions.length ? and(...studentConditions) : undefined);

  const defaulters = [];

  for (const student of allStudents) {
    const [stats] = await db
      .select({
        total: sql<number>`count(${attendance.id})::int`,
        present: sql<number>`count(case when ${attendance.status} in ('present', 'late') then 1 end)::int`,
      })
      .from(attendance)
      .where(eq(attendance.studentId, student.id));

    if (stats && stats.total > 0) {
      const pct = (stats.present / stats.total) * 100;
      if (pct < thresh) {
        defaulters.push({ ...student, percentage: Math.round(pct), total: stats.total, present: stats.present });
      }
    }
  }

  return defaulters.sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true }));
}

export async function getDashboardStats() {
  const [studentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(students);
  const [courseCount] = await db.select({ count: sql<number>`count(*)::int` }).from(courses);
  const todaySessions = await getTodaySessions();

  const trend = await getAttendanceTrend(7);
  const monthlyTotal = trend.reduce((s, t) => s + t.total, 0);
  const monthlyPresent = trend.reduce((s, t) => s + t.present, 0);
  const monthlyPercentage =
    monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 100) : 0;

  return {
    totalStudents: studentCount?.count || 0,
    totalCourses: courseCount?.count || 0,
    todaySessions: todaySessions.length,
    monthlyAttendancePercentage: monthlyPercentage,
  };
}
