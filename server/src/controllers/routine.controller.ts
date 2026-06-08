import type { Request, Response } from 'express';
import * as routineService from '../services/routine.service.js';
import { getStaffScope } from '../services/teacher.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { paramId } from '../utils/params.js';

export async function listRoutine(req: Request, res: Response) {
  let department = req.query.department as string | undefined;
  let semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;
  let section = req.query.section as string | undefined;

  if (req.user?.role === 'teacher') {
    const scope = await getStaffScope(req.user.userId);
    department = scope.department;
    semester = scope.semester ?? undefined;
    section = scope.section ?? undefined;
  }

  const slots = await routineService.listRoutine({ department, semester, section });
  return sendSuccess(res, slots);
}

export async function createSlot(req: Request, res: Response) {
  const slot = await routineService.createRoutineSlot(req.body);
  return sendSuccess(res, slot, 'Routine slot created', 201);
}

export async function updateSlot(req: Request, res: Response) {
  const slot = await routineService.updateRoutineSlot(paramId(req.params.id), req.body);
  return sendSuccess(res, slot, 'Routine slot updated');
}

export async function deleteSlot(req: Request, res: Response) {
  await routineService.deleteRoutineSlot(paramId(req.params.id));
  return sendSuccess(res, null, 'Routine slot deleted');
}

export async function importRoutineSlots(req: Request, res: Response) {
  const slots = req.body.slots;
  if (!Array.isArray(slots) || slots.length === 0) {
    return sendError(res, 'No routine slots to import', 400);
  }

  const result = await routineService.bulkImportRoutineSlots(slots);
  return sendSuccess(res, result, `Imported ${result.created} routine slots`);
}

export async function getStudentRoutine(req: Request, res: Response) {
  const slots = await routineService.getStudentRoutine(req.user!.userId);
  return sendSuccess(res, slots);
}
