import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { courses, studentCourses, students, teachers, users } from '../models/schema.js';
import { getStudentAttendanceSummaryByDbId } from './attendance.service.js';
import { getStudentByRollNumber } from './student.service.js';

export async function getPublicStudentProfile(rollNumber: string) {
  const student = await getStudentByRollNumber(rollNumber);

  const enrolledCourses = await db
    .select({
      id: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      department: courses.department,
      semester: courses.semester,
      teacherName: users.name,
      enrolledAt: studentCourses.enrolledAt,
    })
    .from(studentCourses)
    .innerJoin(courses, eq(studentCourses.courseId, courses.id))
    .leftJoin(teachers, eq(courses.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(eq(studentCourses.studentId, student.id))
    .orderBy(courses.courseCode);

  const attendance = await getStudentAttendanceSummaryByDbId(student.id);

  return {
    profile: {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      phone: student.phone,
      avatarUrl: student.avatarUrl,
      department: student.department,
      semester: student.semester,
      section: student.section,
      batchYear: student.batchYear,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      address: student.address,
    },
    courses: enrolledCourses,
    attendance,
  };
}
