import type { Request, Response } from 'express';
import * as publicService from '../services/public.service.js';
import { getAllSettings } from '../services/settings.service.js';
import { CSE_DEPARTMENT } from '../config/constants.js';
import { listDepartments } from '../services/department.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getStudentProfile(req: Request, res: Response) {
  const rollNumber = decodeURIComponent(String(req.params.studentId));
  const profile = await publicService.getPublicStudentProfile(rollNumber);
  return sendSuccess(res, profile);
}

export async function getAppConfig(_req: Request, res: Response) {
  const settings = await getAllSettings();
  const appMode = settings.app_mode === 'advanced' ? 'advanced' : 'general';
  let departmentList: Array<{ code: string; name: string }> = [{ code: 'CSE', name: CSE_DEPARTMENT }];
  try {
    const rows = await listDepartments();
    if (rows.length > 0) {
      departmentList = rows.map((row) => ({ code: row.code, name: row.name }));
    }
  } catch (error) {
    console.warn('Department list unavailable until the database is migrated:', error);
  }
  return sendSuccess(res, {
    appMode,
    department: CSE_DEPARTMENT,
    departments: departmentList,
    currentSemester: parseInt(settings.current_semester || '8', 10),
    attendanceThreshold: parseInt(settings.attendance_threshold || '75', 10),
    academicYear: settings.academic_year,
  });
}
