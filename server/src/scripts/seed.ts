import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { courses, studentCourses, students, teachers, users } from '../models/schema.js';
import { hashPassword } from '../services/auth.service.js';
import { seedDefaultSettings } from '../services/settings.service.js';
import {
  SECTION_8E_STUDENTS,
  section8EEmail,
  section8EPassword,
} from '../data/nubtk/section-8e-students.js';
import { crAccountEmail, crAccountPassword, DEMO_CR_SEMESTER, DEMO_CR_SECTION } from '../data/nubtk/cr-accounts.js';
import { seedCrAccounts } from './seed-cr-accounts.js';

const DEPARTMENT = 'Computer Science & Engineering';

const DEMO_COURSES = [
  { courseCode: 'CSE 3201', courseName: 'Software Engineering', semester: 8 },
  { courseCode: 'CSE 3203', courseName: 'Computer Networks', semester: 8 },
  { courseCode: 'CSE 3205', courseName: 'Artificial Intelligence', semester: 8 },
  { courseCode: 'CSE 3207(C)', courseName: 'Artificial Intelligence Lab', semester: 8 },
];

async function ensureAdmin() {
  const [existing] = await db.select().from(users).where(eq(users.email, 'admin@admin.com')).limit(1);
  if (existing) return existing;

  const [adminUser] = await db
    .insert(users)
    .values({
      name: 'System Admin',
      email: 'admin@admin.com',
      passwordHash: await hashPassword('admin'),
      role: 'admin',
    })
    .returning();

  return adminUser;
}

async function ensureCourses() {
  const created = [];
  for (const course of DEMO_COURSES) {
    const [existing] = await db
      .select()
      .from(courses)
      .where(eq(courses.courseCode, course.courseCode))
      .limit(1);

    if (existing) {
      created.push(existing);
      continue;
    }

    const [row] = await db
      .insert(courses)
      .values({
        courseCode: course.courseCode,
        courseName: course.courseName,
        creditHours: 3,
        department: DEPARTMENT,
        semester: course.semester,
      })
      .returning();
    created.push(row);
  }
  return created;
}

async function seedSection8EStudents(createdCourses: Array<{ id: string }>) {
  await db.delete(users).where(eq(users.role, 'student'));

  for (const entry of SECTION_8E_STUDENTS) {
    const [user] = await db
      .insert(users)
      .values({
        name: entry.name,
        email: section8EEmail(entry.studentId),
        passwordHash: await hashPassword(section8EPassword(entry.studentId)),
        role: 'student',
      })
      .returning();

    const [student] = await db
      .insert(students)
      .values({
        userId: user.id,
        studentId: entry.studentId,
        department: DEPARTMENT,
        semester: 8,
        section: 'E',
        batchYear: 2022,
      })
      .returning();

    for (const course of createdCourses) {
      await db.insert(studentCourses).values({
        studentId: student.id,
        courseId: course.id,
      });
    }
  }
}

async function main() {
  console.log('Legacy seed — quick demo data (use seed-nubtk.ts for full routine/faculty import)\n');

  await seedDefaultSettings();
  await ensureAdmin();
  const createdCourses = await ensureCourses();
  await seedSection8EStudents(createdCourses);
  const crStats = await seedCrAccounts();

  console.log('Seed completed');
  console.log('Admin: admin / admin');
  console.log(`CR accounts: ${crStats.total} · e.g. ${crAccountEmail(DEMO_CR_SEMESTER, DEMO_CR_SECTION)} / ${crAccountPassword(DEMO_CR_SEMESTER, DEMO_CR_SECTION)}`);
  const example = SECTION_8E_STUDENTS[0];
  console.log(`Student email: {studentId}@gmail.com · password = student ID`);
  console.log(`Example: ${section8EEmail(example.studentId)} / ${section8EPassword(example.studentId)}`);
  console.log(`Section 8E students: ${SECTION_8E_STUDENTS.length}`);

  process.exit(0);
}

main().catch((error) => {
  console.error('Legacy seed failed:', error);
  process.exit(1);
});
