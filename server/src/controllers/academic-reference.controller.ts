import type { Request, Response } from 'express';
import * as academicService from '../services/academic-reference.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getFaculty(req: Request, res: Response) {
  const faculty = await academicService.listFaculty(req.query.department as string | undefined);
  return sendSuccess(res, faculty);
}

export async function getRepresentatives(req: Request, res: Response) {
  const representatives = await academicService.listRepresentatives({
    department: req.query.department as string | undefined,
    semester: req.query.semester ? parseInt(req.query.semester as string, 10) : undefined,
    section: req.query.section as string | undefined,
  });
  return sendSuccess(res, representatives);
}
