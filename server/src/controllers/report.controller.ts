import type { Request, Response } from 'express';
import * as reportService from '../services/report.service.js';
import { getStaffScope } from '../services/teacher.service.js';
import { sendSuccess } from '../utils/response.js';

async function resolveReportFilters(req: Request) {
  const filters: import('../services/report.service.js').ReportFilters = {
    courseId: req.query.courseId as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    studentId: req.query.studentId as string,
    section: req.query.section as string,
  };

  if (req.user?.role === 'teacher') {
    const scope = await getStaffScope(req.user.userId);
    filters.department = scope.department;
    if (scope.semester != null) filters.semester = scope.semester;
    filters.section = scope.section || undefined;
  }

  return filters;
}

export async function getReport(req: Request, res: Response) {
  const report = await reportService.getAttendanceReport(await resolveReportFilters(req));
  return sendSuccess(res, report);
}
