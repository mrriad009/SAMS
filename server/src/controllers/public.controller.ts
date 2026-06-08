import type { Request, Response } from 'express';
import * as publicService from '../services/public.service.js';
import { getAllSettings } from '../services/settings.service.js';
import { CSE_DEPARTMENT } from '../config/constants.js';
import { sendSuccess } from '../utils/response.js';

export async function getStudentProfile(req: Request, res: Response) {
  const rollNumber = decodeURIComponent(String(req.params.studentId));
  const profile = await publicService.getPublicStudentProfile(rollNumber);
  return sendSuccess(res, profile);
}

export async function getAppConfig(_req: Request, res: Response) {
  const settings = await getAllSettings();
  const appMode = settings.app_mode === 'advanced' ? 'advanced' : 'general';
  return sendSuccess(res, {
    appMode,
    department: CSE_DEPARTMENT,
    currentSemester: parseInt(settings.current_semester || '8', 10),
    attendanceThreshold: parseInt(settings.attendance_threshold || '75', 10),
    academicYear: settings.academic_year,
  });
}
