import { eq, and, sql, desc, notInArray, lt } from 'drizzle-orm';
import { db } from '../config/db.js';
import { courses, studentCourses, students, teachers, users } from '../models/schema.js';
import { AppError } from '../utils/response.js';

export async function listCourses(filters?: { department?: string; semester?: number }) {
  const conditions = [];
  if (filters?.department) conditions.push(eq(courses.department, filters.department));
  if (filters?.semester) conditions.push(eq(courses.semester, filters.semester));

  const rows = await db
    .select({
      id: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      creditHours: courses.creditHours,
      department: courses.department,
      semester: courses.semester,
      teacherId: courses.teacherId,
      createdAt: courses.createdAt,
      teacherName: users.name,
      enrolledCount: sql<number>`(
        SELECT count(*)::int FROM student_courses sc WHERE sc.course_id = ${courses.id}
      )`,
    })
    .from(courses)
    .leftJoin(teachers, eq(courses.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(courses.courseCode);

  return rows;
}

export async function getCourseById(id: string) {
  const [course] = await db
    .select({
      id: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      creditHours: courses.creditHours,
      department: courses.department,
      semester: courses.semester,
      teacherId: courses.teacherId,
      createdAt: courses.createdAt,
      teacherName: users.name,
    })
    .from(courses)
    .leftJoin(teachers, eq(courses.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(eq(courses.id, id))
    .limit(1);

  if (!course) throw new AppError('Course not found', 404);
  return course;
}

export async function createCourse(data: {
  courseCode: string;
  courseName: string;
  creditHours?: number;
  department: string;
  semester: number;
  teacherId?: string;
}) {
  const existing = await db
    .select()
    .from(courses)
    .where(eq(courses.courseCode, data.courseCode))
    .limit(1);
  if (existing.length) throw new AppError('Course code already exists', 400);

  const [course] = await db.insert(courses).values(data).returning();
  return course;
}

export async function updateCourse(
  id: string,
  data: Partial<{
    courseCode: string;
    courseName: string;
    creditHours: number;
    department: string;
    semester: number;
    teacherId: string | null;
  }>
) {
  await getCourseById(id);
  const [updated] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
  return updated;
}

export async function deleteCourse(id: string) {
  await getCourseById(id);
  await db.delete(courses).where(eq(courses.id, id));
}

export async function enrollStudents(courseId: string, studentIds: string[]) {
  await getCourseById(courseId);

  const enrolled = [];
  for (const studentId of studentIds) {
    const [existing] = await db
      .select()
      .from(studentCourses)
      .where(and(eq(studentCourses.courseId, courseId), eq(studentCourses.studentId, studentId)))
      .limit(1);

    if (!existing) {
      const [row] = await db
        .insert(studentCourses)
        .values({ courseId, studentId })
        .returning();
      enrolled.push(row);
    }
  }

  return enrolled;
}

export async function getEnrolledStudents(courseId: string) {
  return db
    .select({
      id: students.id,
      studentId: students.studentId,
      name: users.name,
      email: users.email,
      department: students.department,
      section: students.section,
    })
    .from(studentCourses)
    .innerJoin(students, eq(studentCourses.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(studentCourses.courseId, courseId));
}

export async function getStudentCourses(userId: string) {
  const [student] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
  if (!student) throw new AppError('Student not found', 404);

  return db
    .select({
      id: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      creditHours: courses.creditHours,
      department: courses.department,
      semester: courses.semester,
      teacherName: users.name,
      enrolledAt: studentCourses.enrolledAt,
    })
    .from(studentCourses)
    .innerJoin(courses, eq(studentCourses.courseId, courses.id))
    .leftJoin(teachers, eq(courses.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(eq(studentCourses.studentId, student.id));
}

async function resolveStudent(userId: string) {
  const { getStudentByUserId } = await import('./student.service.js');
  return getStudentByUserId(userId);
}

export async function getAvailableCoursesForStudent(userId: string) {
  const student = await resolveStudent(userId);

  const enrolled = await db
    .select({ courseId: studentCourses.courseId })
    .from(studentCourses)
    .where(eq(studentCourses.studentId, student.id));

  const enrolledIds = enrolled.map((row) => row.courseId);
  const conditions = [
    eq(courses.department, student.department),
    eq(courses.semester, student.semester),
  ];
  if (enrolledIds.length > 0) {
    conditions.push(notInArray(courses.id, enrolledIds));
  }

  return db
    .select({
      id: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      creditHours: courses.creditHours,
      department: courses.department,
      semester: courses.semester,
      teacherName: users.name,
    })
    .from(courses)
    .leftJoin(teachers, eq(courses.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(and(...conditions))
    .orderBy(courses.courseCode);
}

export async function getRetakeCoursesForStudent(userId: string, filters?: { semester?: number }) {
  const student = await resolveStudent(userId);

  if (student.semester <= 1) {
    return [];
  }

  const enrolled = await db
    .select({ courseId: studentCourses.courseId })
    .from(studentCourses)
    .where(eq(studentCourses.studentId, student.id));

  const enrolledIds = enrolled.map((row) => row.courseId);
  const conditions = [
    eq(courses.department, student.department),
    lt(courses.semester, student.semester),
  ];

  if (filters?.semester != null) {
    if (filters.semester >= student.semester) {
      throw new AppError('Retake is only available for past semesters', 400);
    }
    conditions.push(eq(courses.semester, filters.semester));
  }

  if (enrolledIds.length > 0) {
    conditions.push(notInArray(courses.id, enrolledIds));
  }

  return db
    .select({
      id: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      creditHours: courses.creditHours,
      department: courses.department,
      semester: courses.semester,
      teacherName: users.name,
    })
    .from(courses)
    .leftJoin(teachers, eq(courses.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(and(...conditions))
    .orderBy(courses.semester, courses.courseCode);
}

export async function enrollStudentSelf(
  userId: string,
  courseId: string,
  options?: { retake?: boolean }
) {
  const student = await resolveStudent(userId);
  const course = await getCourseById(courseId);

  if (course.department !== student.department) {
    throw new AppError('This course is not in your department', 400);
  }

  if (options?.retake) {
    if (course.semester >= student.semester) {
      throw new AppError('Retake is only for past semester courses', 400);
    }
  } else if (course.semester !== student.semester) {
    throw new AppError('This course is not for your current semester', 400);
  }

  const [existing] = await db
    .select()
    .from(studentCourses)
    .where(and(eq(studentCourses.courseId, courseId), eq(studentCourses.studentId, student.id)))
    .limit(1);

  if (existing) throw new AppError('Already enrolled in this course', 400);

  const [row] = await db
    .insert(studentCourses)
    .values({ courseId, studentId: student.id })
    .returning();

  return row;
}

export async function unenrollStudentSelf(userId: string, courseId: string) {
  const student = await resolveStudent(userId);

  const deleted = await db
    .delete(studentCourses)
    .where(and(eq(studentCourses.studentId, student.id), eq(studentCourses.courseId, courseId)))
    .returning();

  if (!deleted.length) throw new AppError('You are not enrolled in this course', 404);
  return deleted[0];
}
