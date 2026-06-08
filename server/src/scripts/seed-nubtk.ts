import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import {
  academicFaculty,
  classRoutine,
  courses,
  sectionRepresentatives,
  studentCourses,
  students,
  users,
} from '../models/schema.js';
import { hashPassword } from '../services/auth.service.js';
import { parseNubtkMarkdown, courseTitleFromCode } from '../data/nubtk/parse-markdown.js';
import {
  SECTION_8E_STUDENTS,
  section8EEmail,
  section8EPassword,
} from '../data/nubtk/section-8e-students.js';
import {
  NUBTK_ACADEMIC_TERM,
  NUBTK_DEPARTMENT,
  NUBTK_EFFECTIVE_FROM,
} from '../data/nubtk/types.js';
import { crAccountEmail, crAccountPassword, DEMO_CR_SEMESTER, DEMO_CR_SECTION } from '../data/nubtk/cr-accounts.js';
import { seedCrAccounts } from './seed-cr-accounts.js';

const SECTION_8E_META = {
  semester: 8,
  section: 'E',
  batchYear: 2022,
};

async function clearNubtkData() {
  await db.execute(sql`DELETE FROM class_routine`);
  // Keep courses + class_sessions + attendance — upsertCourses updates by course code
  await db.delete(academicFaculty).where(eq(academicFaculty.academicTerm, NUBTK_ACADEMIC_TERM));
  await db
    .delete(sectionRepresentatives)
    .where(eq(sectionRepresentatives.academicTerm, NUBTK_ACADEMIC_TERM));
}

async function upsertCourses(courseCodes: string[], semesterByCourse: Map<string, number>) {
  const courseMap = new Map<string, string>();

  for (const courseCode of courseCodes) {
    const semester = semesterByCourse.get(courseCode) || 1;
    const [existing] = await db
      .select()
      .from(courses)
      .where(eq(courses.courseCode, courseCode))
      .limit(1);

    if (existing) {
      await db
        .update(courses)
        .set({ courseName: courseTitleFromCode(courseCode), semester })
        .where(eq(courses.id, existing.id));
      courseMap.set(courseCode, existing.id);
      continue;
    }

    const [created] = await db
      .insert(courses)
      .values({
        courseCode,
        courseName: courseTitleFromCode(courseCode),
        creditHours: 3,
        department: NUBTK_DEPARTMENT,
        semester,
      })
      .returning();

    courseMap.set(courseCode, created.id);
  }

  return courseMap;
}

async function seedFaculty(faculty: ReturnType<typeof parseNubtkMarkdown>['faculty']) {
  if (faculty.length === 0) return 0;

  await db.insert(academicFaculty).values(
    faculty.map((member) => ({
      acronym: member.acronym,
      name: member.name,
      designation: member.designation,
      subject: member.subject,
      mobile: member.mobile,
      email: member.email,
      department: NUBTK_DEPARTMENT,
      academicTerm: NUBTK_ACADEMIC_TERM,
    }))
  );

  return faculty.length;
}

async function seedRepresentatives(reps: ReturnType<typeof parseNubtkMarkdown>['representatives']) {
  if (reps.length === 0) return 0;

  await db.insert(sectionRepresentatives).values(
    reps.map((rep) => ({
      department: NUBTK_DEPARTMENT,
      semester: rep.semester,
      section: rep.section,
      role: rep.role,
      studentNumber: rep.studentNumber,
      fullName: rep.fullName,
      mobile: rep.mobile,
      email: rep.email,
      academicTerm: NUBTK_ACADEMIC_TERM,
    }))
  );

  return reps.length;
}

async function seedRoutine(
  routineSlots: ReturnType<typeof parseNubtkMarkdown>['routineSlots'],
  courseMap: Map<string, string>
) {
  const values = routineSlots
    .map((slot) => {
      const courseId = courseMap.get(slot.courseCode);
      if (!courseId) return null;

      return {
        courseId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomNumber: slot.roomNumber,
        section: slot.section,
        shift: slot.shift,
        teacherAcronym: slot.teacherAcronym,
        effectiveFrom: NUBTK_EFFECTIVE_FROM,
      };
    })
    .filter(Boolean) as Array<{
    courseId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomNumber: string;
    section: string;
    shift: '1st' | '2nd';
    teacherAcronym: string;
    effectiveFrom: string;
  }>;

  const chunkSize = 100;
  for (let i = 0; i < values.length; i += chunkSize) {
    await db.insert(classRoutine).values(values.slice(i, i + chunkSize));
  }

  return values.length;
}

async function clearAllStudents() {
  await db.delete(users).where(eq(users.role, 'student'));
}

async function seedSection8EStudents(
  courseMap: Map<string, string>,
  section8ESlots: string[],
  options?: { replaceAll?: boolean }
) {
  if (options?.replaceAll) {
    await clearAllStudents();
  }

  const uniqueCourses = [...new Set(section8ESlots)];
  const courseIds = uniqueCourses
    .map((code) => courseMap.get(code))
    .filter(Boolean) as string[];

  for (const entry of SECTION_8E_STUDENTS) {
    const email = section8EEmail(entry.studentId);
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser && !options?.replaceAll) {
      continue;
    }

    const passwordHash = await hashPassword(section8EPassword(entry.studentId));

    const [user] = await db
      .insert(users)
      .values({
        name: entry.name,
        email,
        passwordHash,
        role: 'student',
      })
      .returning();

    const [student] = await db
      .insert(students)
      .values({
        userId: user.id,
        studentId: entry.studentId,
        department: NUBTK_DEPARTMENT,
        semester: SECTION_8E_META.semester,
        section: SECTION_8E_META.section,
        batchYear: SECTION_8E_META.batchYear,
      })
      .returning();

    if (courseIds.length > 0) {
      await db.insert(studentCourses).values(
        courseIds.map((courseId) => ({
          studentId: student.id,
          courseId,
        }))
      );
    }
  }
}

async function main() {
  const fresh = process.argv.includes('--fresh');
  const parsed = parseNubtkMarkdown();

  console.log(`Parsed ${parsed.routineSlots.length} routine slots`);
  console.log(`Parsed ${parsed.faculty.length} faculty records`);
  console.log(`Parsed ${parsed.representatives.length} CR/ACR records`);
  console.log(`Parsed ${parsed.courseCodes.length} unique courses`);

  if (fresh) {
    console.log('Clearing existing NUBTK routine/courses/reference data...');
    await clearNubtkData();
  }

  const semesterByCourse = new Map<string, number>();
  for (const slot of parsed.routineSlots) {
    const current = semesterByCourse.get(slot.courseCode);
    if (!current || slot.semester > current) {
      semesterByCourse.set(slot.courseCode, slot.semester);
    }
  }

  const courseMap = await upsertCourses(parsed.courseCodes, semesterByCourse);
  const facultyCount = fresh
    ? await seedFaculty(parsed.faculty)
    : parsed.faculty.length;
  const repCount = fresh
    ? await seedRepresentatives(parsed.representatives)
    : parsed.representatives.length;

  if (!fresh) {
    await db.execute(sql`DELETE FROM class_routine`);
  }

  const routineCount = await seedRoutine(parsed.routineSlots, courseMap);

  const section8ECourses = parsed.routineSlots
    .filter((slot) => slot.semester === 8 && slot.section === 'E')
    .map((slot) => slot.courseCode);

  await seedSection8EStudents(courseMap, section8ECourses, { replaceAll: fresh });
  const crStats = await seedCrAccounts();

  console.log('\nNUBTK import completed');
  console.log(`Courses: ${courseMap.size}`);
  console.log(`Routine slots: ${routineCount}`);
  console.log(`Faculty directory: ${facultyCount}`);
  console.log(`CR/ACR records: ${repCount}`);
  console.log(`\nSection 8E students: ${SECTION_8E_STUDENTS.length}`);
  const example = SECTION_8E_STUDENTS[0];
  console.log(`  Email format: {studentId}@gmail.com`);
  console.log(`  Password: same as student ID`);
  console.log(`  Example: ${section8EEmail(example.studentId)} / ${section8EPassword(example.studentId)}`);
  console.log(`  Or email shortcut: student → ${section8EEmail(example.studentId)} (password = student ID)`);
  console.log(`  Enrolled in ${[...new Set(section8ECourses)].length} Section 8E courses`);
  console.log(`\nCR accounts: ${crStats.total} (semester + section scoped)`);
  console.log(`  Format: cr{semester}{section}@gmail.com / same password`);
  console.log(
    `  Example 8E: ${crAccountEmail(DEMO_CR_SEMESTER, DEMO_CR_SECTION)} / ${crAccountPassword(DEMO_CR_SEMESTER, DEMO_CR_SECTION)}`
  );
  console.log(`  Shortcuts: cr8e, teacher, or cr → ${crAccountEmail(DEMO_CR_SEMESTER, DEMO_CR_SECTION)}`);
  console.log(`  Other examples: cr8a@gmail.com, cr7b@gmail.com`);

  process.exit(0);
}

main().catch((error) => {
  console.error('NUBTK seed failed:', error);
  process.exit(1);
});
