import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { attendance, classSessions, courses, students, users } from '../models/schema.js';
import { getLowAttendanceStudents, getAttendanceTrend } from './attendance.service.js';
import { getSetting } from './settings.service.js';

export interface ReportFilters {
  courseId?: string;
  dateFrom?: string;
  dateTo?: string;
  studentId?: string;
  section?: string;
  department?: string;
  semester?: number;
}

export async function getAttendanceReport(filters: ReportFilters) {
  const sessionConditions = [];
  if (filters.courseId) sessionConditions.push(eq(classSessions.courseId, filters.courseId));
  if (filters.dateFrom) sessionConditions.push(gte(classSessions.date, filters.dateFrom));
  if (filters.dateTo) sessionConditions.push(lte(classSessions.date, filters.dateTo));

  const studentConditions = [];
  if (filters.studentId) studentConditions.push(eq(attendance.studentId, filters.studentId));
  if (filters.section) studentConditions.push(eq(students.section, filters.section));
  if (filters.department) studentConditions.push(eq(students.department, filters.department));
  if (filters.semester != null) studentConditions.push(eq(students.semester, filters.semester));

  const conditions = [...sessionConditions, ...studentConditions];

  const records = await db
    .select({
      id: attendance.id,
      status: attendance.status,
      markedAt: attendance.markedAt,
      sessionDate: classSessions.date,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      studentName: users.name,
      studentId: students.studentId,
      section: students.section,
    })
    .from(attendance)
    .innerJoin(classSessions, eq(attendance.sessionId, classSessions.id))
    .innerJoin(courses, eq(classSessions.courseId, courses.id))
    .innerJoin(students, eq(attendance.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined);

  const byCourse = await db
    .select({
      courseId: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      total: sql<number>`count(${attendance.id})::int`,
      present: sql<number>`count(case when ${attendance.status} in ('present', 'late') then 1 end)::int`,
    })
    .from(attendance)
    .innerJoin(classSessions, eq(attendance.sessionId, classSessions.id))
    .innerJoin(courses, eq(classSessions.courseId, courses.id))
    .innerJoin(students, eq(attendance.studentId, students.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(courses.id, courses.courseCode, courses.courseName);

  const courseStats = byCourse.map((c) => ({
    ...c,
    percentage: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
  }));

  const trend = await getAttendanceTrend(30, filters);
  const threshold = parseInt((await getSetting('attendance_threshold')) || '75', 10);
  const defaulters = await getLowAttendanceStudents(threshold, filters);

  return {
    records,
    courseStats,
    trend,
    defaulters,
    threshold,
    summary: {
      totalRecords: records.length,
      presentCount: records.filter((r) => r.status === 'present' || r.status === 'late').length,
    },
  };
}
