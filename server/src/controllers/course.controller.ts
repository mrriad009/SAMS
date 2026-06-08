import type { Request, Response } from 'express';
import * as courseService from '../services/course.service.js';
import { getStaffScope } from '../services/teacher.service.js';
import { sendSuccess } from '../utils/response.js';
import { paramId } from '../utils/params.js';

export async function listCourses(req: Request, res: Response) {
  let department = req.query.department as string | undefined;
  let semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;

  if (req.user?.role === 'teacher') {
    const scope = await getStaffScope(req.user.userId);
    department = scope.department;
    semester = scope.semester ?? undefined;
  }

  const courses = await courseService.listCourses({ department, semester });
  return sendSuccess(res, courses);
}

export async function getCourse(req: Request, res: Response) {
  const course = await courseService.getCourseById(paramId(req.params.id));
  return sendSuccess(res, course);
}

export async function createCourse(req: Request, res: Response) {
  const course = await courseService.createCourse(req.body);
  return sendSuccess(res, course, 'Course created', 201);
}

export async function updateCourse(req: Request, res: Response) {
  const course = await courseService.updateCourse(paramId(req.params.id), req.body);
  return sendSuccess(res, course, 'Course updated');
}

export async function deleteCourse(req: Request, res: Response) {
  await courseService.deleteCourse(paramId(req.params.id));
  return sendSuccess(res, null, 'Course deleted');
}

export async function enrollStudents(req: Request, res: Response) {
  const enrolled = await courseService.enrollStudents(paramId(req.params.id), req.body.studentIds);
  return sendSuccess(res, enrolled, 'Students enrolled');
}

export async function getEnrolledStudents(req: Request, res: Response) {
  const students = await courseService.getEnrolledStudents(paramId(req.params.id));
  return sendSuccess(res, students);
}

export async function getStudentCourses(req: Request, res: Response) {
  const courses = await courseService.getStudentCourses(req.user!.userId);
  return sendSuccess(res, courses);
}

export async function getAvailableCourses(req: Request, res: Response) {
  const courses = await courseService.getAvailableCoursesForStudent(req.user!.userId);
  return sendSuccess(res, courses);
}

export async function getRetakeAvailableCourses(req: Request, res: Response) {
  const semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;
  const courses = await courseService.getRetakeCoursesForStudent(req.user!.userId, { semester });
  return sendSuccess(res, courses);
}

export async function enrollInCourse(req: Request, res: Response) {
  const retake = req.body?.retake === true;
  await courseService.enrollStudentSelf(req.user!.userId, paramId(req.params.id), { retake });
  return sendSuccess(res, null, retake ? 'Retake enrollment successful' : 'Enrolled successfully');
}

export async function unenrollFromCourse(req: Request, res: Response) {
  await courseService.unenrollStudentSelf(req.user!.userId, paramId(req.params.id));
  return sendSuccess(res, null, 'Dropped from course');
}
