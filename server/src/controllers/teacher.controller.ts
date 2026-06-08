import type { Request, Response } from 'express';
import * as teacherService from '../services/teacher.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getDashboard(req: Request, res: Response) {
  const stats = await teacherService.getTeacherDashboardStats(req.user!.userId);
  return sendSuccess(res, stats);
}

export async function getProfile(req: Request, res: Response) {
  const scope = await teacherService.getStaffScope(req.user!.userId);
  return sendSuccess(res, scope);
}
