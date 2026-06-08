import type { Request, Response } from 'express';
import * as studentService from '../services/student.service.js';
import { getPublicStudentProfile } from '../services/public.service.js';
import { getStaffScope, studentMatchesScope } from '../services/teacher.service.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/response.js';
import { paramId } from '../utils/params.js';

async function resolveStudent(idOrRoll: string) {
  try {
    return await studentService.getStudentById(idOrRoll);
  } catch {
    return studentService.getStudentByRollNumber(idOrRoll);
  }
}

async function assertStaffCanAccessStudent(req: Request, student: { department: string; semester: number; section: string }) {
  if (req.user?.role !== 'teacher') return;
  const scope = await getStaffScope(req.user.userId);
  if (!studentMatchesScope(student, scope)) {
    throw new AppError('You can only view students in your section', 403);
  }
}

export async function listStudents(req: Request, res: Response) {
  let department = req.query.department as string | undefined;
  let semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;
  let section = req.query.section as string | undefined;

  if (req.user?.role === 'teacher') {
    const scope = await getStaffScope(req.user.userId);
    department = scope.department;
    semester = scope.semester ?? undefined;
    section = scope.section ?? undefined;
    if (req.query.section && scope.section && req.query.section !== scope.section) {
      throw new AppError('You can only view students in your assigned section', 403);
    }
    if (req.query.semester && scope.semester != null && Number(req.query.semester) !== scope.semester) {
      throw new AppError('You can only view students in your assigned semester', 403);
    }
  }

  const result = await studentService.listStudents({
    search: req.query.search as string,
    department,
    semester,
    section,
    batchYear: req.query.batchYear ? parseInt(req.query.batchYear as string, 10) : undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
  });
  return sendSuccess(res, result.students, undefined, 200, result.meta);
}

export async function getStudent(req: Request, res: Response) {
  const student = await resolveStudent(paramId(req.params.id));
  await assertStaffCanAccessStudent(req, student);
  return sendSuccess(res, student);
}

export async function getStudentProfile(req: Request, res: Response) {
  const student = await resolveStudent(paramId(req.params.id));
  await assertStaffCanAccessStudent(req, student);
  const profile = await getPublicStudentProfile(student.studentId);
  return sendSuccess(res, profile);
}

export async function createStudent(req: Request, res: Response) {
  const student = await studentService.createStudent(req.body);
  return sendSuccess(res, student, 'Student created', 201);
}

export async function updateStudent(req: Request, res: Response) {
  const student = await studentService.updateStudent(paramId(req.params.id), req.body);
  return sendSuccess(res, student, 'Student updated');
}

export async function deleteStudent(req: Request, res: Response) {
  await studentService.deleteStudent(paramId(req.params.id));
  return sendSuccess(res, null, 'Student deleted');
}
