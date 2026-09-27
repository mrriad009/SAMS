import type { Request, Response } from 'express';
import * as reportService from '../services/report.service.js';
import * as exportService from '../services/export.service.js';
import { getStaffScope } from '../services/teacher.service.js';
import { sendSuccess } from '../utils/response.js';

async function resolveReportFilters(req: Request) {
  const semester = req.query.semester ? parseInt(String(req.query.semester), 10) : undefined;
  const filters: import('../services/report.service.js').ReportFilters = {
    courseId: req.query.courseId as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    studentId: req.query.studentId as string,
    section: req.query.section as string,
    department: req.query.department as string,
    semester: Number.isNaN(semester) ? undefined : semester,
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

export async function exportReport(req: Request, res: Response) {
  const filters = await resolveReportFilters(req);
  const format = req.query.format === 'pdf' ? 'pdf' : 'xlsx';
  if (format === 'pdf') {
    const pdf = await exportService.buildPdfReport(filters);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.pdf"');
    return res.send(pdf);
  }
  const workbook = await exportService.buildExcelReport(filters);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.xlsx"');
  return res.send(workbook);
}
