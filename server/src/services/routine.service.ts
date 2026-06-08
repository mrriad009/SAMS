import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { classRoutine, courses, teachers, users } from '../models/schema.js';
import { AppError } from '../utils/response.js';

export async function listRoutine(filters?: {
  department?: string;
  semester?: number;
  section?: string;
}) {
  let rows = await db
    .select({
      id: classRoutine.id,
      courseId: classRoutine.courseId,
      dayOfWeek: classRoutine.dayOfWeek,
      startTime: classRoutine.startTime,
      endTime: classRoutine.endTime,
      roomNumber: classRoutine.roomNumber,
      section: classRoutine.section,
      shift: classRoutine.shift,
      teacherAcronym: classRoutine.teacherAcronym,
      effectiveFrom: classRoutine.effectiveFrom,
      effectiveTo: classRoutine.effectiveTo,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      department: courses.department,
      semester: courses.semester,
      teacherName: users.name,
    })
    .from(classRoutine)
    .innerJoin(courses, eq(classRoutine.courseId, courses.id))
    .leftJoin(teachers, eq(courses.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .orderBy(classRoutine.dayOfWeek, classRoutine.startTime);

  if (filters?.department) {
    rows = rows.filter((r) => r.department === filters.department);
  }
  if (filters?.semester) {
    rows = rows.filter((r) => r.semester === filters.semester);
  }
  if (filters?.section) {
    rows = rows.filter((r) => !r.section || r.section === filters.section);
  }
  return rows;
}

export async function createRoutineSlot(data: {
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  section?: string;
  shift?: string;
  teacherAcronym?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}) {
  const [slot] = await db.insert(classRoutine).values(data).returning();
  return slot;
}

export async function updateRoutineSlot(
  id: string,
  data: Partial<{
    courseId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomNumber: string;
    section: string;
    shift: string;
    teacherAcronym: string;
    effectiveFrom: string;
    effectiveTo: string;
  }>
) {
  const [existing] = await db.select().from(classRoutine).where(eq(classRoutine.id, id)).limit(1);
  if (!existing) throw new AppError('Routine slot not found', 404);

  const [updated] = await db
    .update(classRoutine)
    .set(data)
    .where(eq(classRoutine.id, id))
    .returning();

  return updated;
}

export async function deleteRoutineSlot(id: string) {
  const [existing] = await db.select().from(classRoutine).where(eq(classRoutine.id, id)).limit(1);
  if (!existing) throw new AppError('Routine slot not found', 404);
  await db.delete(classRoutine).where(eq(classRoutine.id, id));
}

export async function bulkImportRoutineSlots(
  slots: Array<{
    courseId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomNumber?: string;
    section?: string;
    shift?: string;
    teacherAcronym?: string;
  }>
) {
  const created = [];
  const errors: string[] = [];

  for (const [index, slot] of slots.entries()) {
    try {
      if (slot.dayOfWeek < 1 || slot.dayOfWeek > 7) {
        throw new AppError('Invalid day of week', 400);
      }
      const row = await createRoutineSlot(slot);
      created.push(row);
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Failed to import'}`);
    }
  }

  return { created: created.length, errors };
}

export async function getStudentRoutine(userId: string) {
  const { students } = await import('../models/schema.js');
  const { studentCourses } = await import('../models/schema.js');

  const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (!student) throw new AppError('Student not found', 404);

  const rows = await db
    .select({
      id: classRoutine.id,
      dayOfWeek: classRoutine.dayOfWeek,
      startTime: classRoutine.startTime,
      endTime: classRoutine.endTime,
      roomNumber: classRoutine.roomNumber,
      section: classRoutine.section,
      shift: classRoutine.shift,
      teacherAcronym: classRoutine.teacherAcronym,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      teacherName: users.name,
    })
    .from(classRoutine)
    .innerJoin(courses, eq(classRoutine.courseId, courses.id))
    .innerJoin(studentCourses, eq(studentCourses.courseId, courses.id))
    .leftJoin(teachers, eq(courses.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(eq(studentCourses.studentId, student.id))
    .orderBy(classRoutine.dayOfWeek, classRoutine.startTime);

  return rows.filter((row) => !row.section || row.section === student.section);
}
