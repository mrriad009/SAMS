import type { Request, Response } from 'express';
import * as attendanceService from '../services/attendance.service.js';
import * as permissions from '../services/permissions.service.js';
import { sendSuccess } from '../utils/response.js';
import { paramId } from '../utils/params.js';

export async function listSessions(req: Request, res: Response) {
  let dateFrom = req.query.dateFrom as string | undefined;
  let dateTo = req.query.dateTo as string | undefined;

  const sessions = await attendanceService.listSessions({
    courseId: req.query.courseId as string,
    dateFrom,
    dateTo,
    status: req.query.status as 'scheduled' | 'completed' | 'cancelled',
  });
  return sendSuccess(res, sessions);
}

export async function createSession(req: Request, res: Response) {
  if (req.user?.role === 'teacher') {
    await permissions.assertTeacherCreateSession(req.user.userId, {
      courseId: req.body.courseId,
      date: req.body.date,
    });
  }

  const session = await attendanceService.createSession(req.body);
  return sendSuccess(res, session, 'Session created', 201);
}

export async function getSessionAttendance(req: Request, res: Response) {
  const sessionId = paramId(req.params.id);

  if (req.user?.role === 'teacher') {
    await permissions.assertSessionInTeacherScope(req.user.userId, sessionId);
  }

  const data = await attendanceService.getSessionAttendance(sessionId);
  return sendSuccess(res, data);
}

export async function updateAttendance(req: Request, res: Response) {
  const id = paramId(req.params.id);
  const data = req.body as { status?: 'present' | 'absent' | 'late' | 'excused'; remarks?: string };

  if (req.user?.role === 'teacher') {
    const context = await attendanceService.getAttendanceRecordContext(id);
    await permissions.assertSessionInTeacherScope(req.user.userId, context.sessionId, {
      requireToday: true,
    });
    await permissions.assertStudentsInTeacherScope(req.user.userId, [context.studentDbId]);
  }

  const updated = await attendanceService.updateAttendanceRecord(id, data, req.user!.userId);
  return sendSuccess(res, updated, 'Attendance updated');
}

export async function submitAttendance(req: Request, res: Response) {
  const sessionId = paramId(req.params.id);
  const records = req.body.records as Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
  }>;

  if (req.user?.role === 'teacher') {
    await permissions.assertSessionInTeacherScope(req.user.userId, sessionId, {
      requireToday: true,
    });
    await permissions.assertStudentsInTeacherScope(
      req.user.userId,
      records.map((r) => r.studentId)
    );
  }

  const data = await attendanceService.submitAttendance(sessionId, records, req.user!.userId);
  return sendSuccess(res, data, 'Attendance submitted');
}

export async function getStudentAttendance(req: Request, res: Response) {
  const records = await attendanceService.getStudentAttendance(req.user!.userId, {
    courseId: req.query.courseId as string,
  });
  return sendSuccess(res, records);
}

export async function getStudentSummary(req: Request, res: Response) {
  const summary = await attendanceService.getStudentAttendanceSummary(req.user!.userId);
  return sendSuccess(res, summary);
}

export async function getDashboardStats(req: Request, res: Response) {
  if (req.user?.role === 'teacher') {
    const { getTeacherDashboardStats } = await import('../services/teacher.service.js');
    const stats = await getTeacherDashboardStats(req.user.userId);
    return sendSuccess(res, {
      ...stats,
      monthlyAttendancePercentage: 0,
    });
  }
  const stats = await attendanceService.getDashboardStats();
  return sendSuccess(res, stats);
}

export async function getTrend(req: Request, res: Response) {
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
  const trend = await attendanceService.getAttendanceTrend(days);
  return sendSuccess(res, trend);
}

export async function getLowAttendance(_req: Request, res: Response) {
  const students = await attendanceService.getLowAttendanceStudents();
  return sendSuccess(res, students);
}

export async function getTodaySessions(_req: Request, res: Response) {
  const sessions = await attendanceService.getTodaySessions();
  return sendSuccess(res, sessions);
}
