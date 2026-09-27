import type { Request, Response } from 'express';
import * as leaveService from '../services/leave.service.js';
import { sendSuccess } from '../utils/response.js';
import { paramId } from '../utils/params.js';

export async function listMine(req: Request, res: Response) {
  const rows = await leaveService.listStudentLeaves(req.user!.userId);
  return sendSuccess(res, rows);
}

export async function createMine(req: Request, res: Response) {
  const body = req.body as {
    dateFrom?: string;
    dateTo?: string;
    courseIds?: string[];
    reason?: string;
    note?: string;
  };
  const created = await leaveService.createLeaveRequest(req.user!.userId, {
    dateFrom: body.dateFrom || '',
    dateTo: body.dateTo || '',
    courseIds: body.courseIds || [],
    reason: body.reason || '',
    note: body.note,
  });
  return sendSuccess(res, created, 'Leave request submitted', 201);
}

export async function listInbox(req: Request, res: Response) {
  const role = req.user!.role === 'teacher' ? 'teacher' : 'admin';
  const semester = req.query.semester ? parseInt(String(req.query.semester), 10) : undefined;
  const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
  const rows = await leaveService.listLeaveInbox(req.user!.userId, role, {
    status: status || undefined,
    section: req.query.section as string | undefined,
    semester: Number.isNaN(semester) ? undefined : semester,
  });
  return sendSuccess(res, rows);
}

export async function review(req: Request, res: Response) {
  const role = req.user!.role === 'teacher' ? 'teacher' : 'admin';
  const decision = req.body.decision as 'approved' | 'rejected';
  if (decision !== 'approved' && decision !== 'rejected') {
    return res.status(400).json({ success: false, message: 'Decision must be approved or rejected' });
  }
  const updated = await leaveService.reviewLeaveRequest(
    req.user!.userId,
    role,
    paramId(req.params.id),
    decision,
    req.body.reviewNote as string | undefined
  );
  return sendSuccess(res, updated, decision === 'approved' ? 'Leave approved' : 'Leave rejected');
}
