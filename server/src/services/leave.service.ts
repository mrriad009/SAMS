import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import {
  classSessions,
  courses,
  leaveRequestCourses,
  leaveRequests,
  studentCourses,
  students,
  users,
} from '../models/schema.js';
import { AppError } from '../utils/response.js';
import { submitAttendance } from './attendance.service.js';
import { dispatchAlert } from './alert.service.js';
import { getStaffScope, studentMatchesScope } from './teacher.service.js';

const MAX_LEAVE_DAYS = 14;

function eachDate(from: string, to: string): string[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('Enter valid leave dates', 400);
  }
  if (end < start) throw new AppError('The end date must be on or after the start date', 400);

  const span = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (span > MAX_LEAVE_DAYS - 1) {
    throw new AppError(`Leave requests can cover at most ${MAX_LEAVE_DAYS} days`, 400);
  }

  const dates: string[] = [];
  for (let i = 0; i <= span; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    dates.push(day.toISOString().slice(0, 10));
  }
  return dates;
}

async function attachCourses(rows: Array<{ id: string }>) {
  if (rows.length === 0) return [];
  const links = await db
    .select({
      leaveRequestId: leaveRequestCourses.leaveRequestId,
      courseId: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
    })
    .from(leaveRequestCourses)
    .innerJoin(courses, eq(leaveRequestCourses.courseId, courses.id))
    .where(inArray(leaveRequestCourses.leaveRequestId, rows.map((row) => row.id)));

  return links;
}

export async function listStudentLeaves(userId: string) {
  const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (!student) throw new AppError('Student profile not found', 404);

  const rows = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.studentId, student.id))
    .orderBy(desc(leaveRequests.createdAt));

  const links = await attachCourses(rows);
  return rows.map((row) => ({
    ...row,
    courses: links.filter((link) => link.leaveRequestId === row.id),
  }));
}

export async function createLeaveRequest(
  userId: string,
  input: { dateFrom: string; dateTo: string; courseIds: string[]; reason: string; note?: string }
) {
  const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (!student) throw new AppError('Student profile not found', 404);

  const reason = input.reason.trim();
  if (reason.length < 3) throw new AppError('Add a short reason for the leave', 400);
  const courseIds = [...new Set(input.courseIds)];
  if (courseIds.length === 0) throw new AppError('Select at least one course', 400);
  eachDate(input.dateFrom, input.dateTo);

  const enrolled = await db
    .select({ courseId: studentCourses.courseId })
    .from(studentCourses)
    .where(and(eq(studentCourses.studentId, student.id), inArray(studentCourses.courseId, courseIds)));
  if (enrolled.length !== courseIds.length) {
    throw new AppError('You can only request leave for courses you are enrolled in', 400);
  }

  const [request] = await db
    .insert(leaveRequests)
    .values({
      studentId: student.id,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      reason,
      note: input.note?.trim() || null,
    })
    .returning();

  await db.insert(leaveRequestCourses).values(
    courseIds.map((courseId) => ({ leaveRequestId: request.id, courseId }))
  );

  return { ...request, courses: courseIds };
}

export async function listLeaveInbox(
  userId: string,
  role: 'admin' | 'teacher',
  filters?: { status?: 'pending' | 'approved' | 'rejected'; section?: string; semester?: number }
) {
  const conditions = [];
  if (role === 'teacher') {
    const scope = await getStaffScope(userId);
    conditions.push(eq(students.department, scope.department));
    if (scope.semester != null) conditions.push(eq(students.semester, scope.semester));
    if (scope.section) conditions.push(eq(students.section, scope.section));
  }
  if (filters?.status) conditions.push(eq(leaveRequests.status, filters.status));
  if (filters?.section) conditions.push(eq(students.section, filters.section));
  if (filters?.semester != null) conditions.push(eq(students.semester, filters.semester));

  const rows = await db
    .select({
      id: leaveRequests.id,
      studentDbId: students.id,
      studentId: students.studentId,
      studentName: users.name,
      userId: users.id,
      department: students.department,
      semester: students.semester,
      section: students.section,
      dateFrom: leaveRequests.dateFrom,
      dateTo: leaveRequests.dateTo,
      reason: leaveRequests.reason,
      note: leaveRequests.note,
      status: leaveRequests.status,
      reviewNote: leaveRequests.reviewNote,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .innerJoin(students, eq(leaveRequests.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leaveRequests.createdAt));

  const links = await attachCourses(rows);
  return rows.map((row) => ({
    ...row,
    courses: links.filter((link) => link.leaveRequestId === row.id),
  }));
}

async function sessionFor(courseId: string, date: string) {
  const [existing] = await db
    .select()
    .from(classSessions)
    .where(and(eq(classSessions.courseId, courseId), eq(classSessions.date, date)))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(classSessions)
    .values({
      courseId,
      date,
      startTime: '09:00:00',
      endTime: '10:30:00',
      topic: 'Approved leave',
      status: 'completed',
    })
    .returning();
  return created;
}

export async function reviewLeaveRequest(
  reviewerId: string,
  role: 'admin' | 'teacher',
  requestId: string,
  decision: 'approved' | 'rejected',
  reviewNote?: string
) {
  const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, requestId)).limit(1);
  if (!request) throw new AppError('Leave request not found', 404);
  if (request.status !== 'pending') throw new AppError('This request has already been reviewed', 400);

  const [student] = await db
    .select({
      id: students.id,
      userId: students.userId,
      department: students.department,
      semester: students.semester,
      section: students.section,
      name: users.name,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.id, request.studentId))
    .limit(1);
  if (!student) throw new AppError('Student not found', 404);

  if (role === 'teacher') {
    const scope = await getStaffScope(reviewerId);
    if (!studentMatchesScope(student, scope)) {
      throw new AppError('This request is outside your section', 403);
    }
  }

  if (decision === 'approved') {
    const links = await db
      .select({ courseId: leaveRequestCourses.courseId })
      .from(leaveRequestCourses)
      .where(eq(leaveRequestCourses.leaveRequestId, request.id));
    const dates = eachDate(request.dateFrom, request.dateTo);
    const remark = `Approved leave: ${request.reason}`;

    for (const link of links) {
      for (const date of dates) {
        const session = await sessionFor(link.courseId, date);
        await submitAttendance(
          session.id,
          [{ studentId: student.id, status: 'excused', markSource: 'manual', remarks: remark }],
          reviewerId,
          { notifyStudents: false }
        );
      }
    }
  }

  const [updated] = await db
    .update(leaveRequests)
    .set({
      status: decision,
      reviewedBy: reviewerId,
      reviewNote: reviewNote?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(leaveRequests.id, request.id))
    .returning();

  const title = decision === 'approved' ? 'Leave approved' : 'Leave rejected';
  const message =
    decision === 'approved'
      ? `Your leave from ${request.dateFrom} to ${request.dateTo} was approved and marked excused.`
      : `Your leave from ${request.dateFrom} to ${request.dateTo} was rejected.`;

  await dispatchAlert(student.userId, {
    title,
    message: reviewNote?.trim() ? `${message} Note: ${reviewNote.trim()}` : message,
    type: 'leave_update',
    referenceId: request.id,
    referenceType: 'leave_request',
  });

  return updated;
}
