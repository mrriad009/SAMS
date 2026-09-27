import type { Request, Response } from 'express';
import * as departmentService from '../services/department.service.js';
import { sendSuccess } from '../utils/response.js';

export async function list(_req: Request, res: Response) {
  const rows = await departmentService.listDepartments();
  return sendSuccess(res, rows);
}

export async function create(req: Request, res: Response) {
  const created = await departmentService.createDepartment({
    code: String(req.body.code || ''),
    name: String(req.body.name || ''),
  });
  return sendSuccess(res, created, 'Department added', 201);
}
