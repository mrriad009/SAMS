import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  date,
  time,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student']);
export const staffTypeEnum = pgEnum('staff_type', ['teacher', 'cr']);
export const sessionStatusEnum = pgEnum('session_status', ['scheduled', 'completed', 'cancelled']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'excused']);
export const targetAudienceEnum = pgEnum('target_audience', ['all', 'department', 'section']);
export const notificationTypeEnum = pgEnum('notification_type', [
  'low_attendance',
  'announcement',
  'session_reminder',
  'leave_update',
  'general',
]);
export const markSourceEnum = pgEnum('mark_source', ['manual', 'qr']);
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  avatarUrl: text('avatar_url'),
  phone: varchar('phone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  studentId: varchar('student_id', { length: 50 }).notNull().unique(),
  department: varchar('department', { length: 100 }).notNull(),
  semester: integer('semester').notNull(),
  section: varchar('section', { length: 10 }).notNull(),
  batchYear: integer('batch_year').notNull(),
  guardianName: varchar('guardian_name', { length: 255 }),
  guardianPhone: varchar('guardian_phone', { length: 20 }),
  address: text('address'),
});

export const teachers = pgTable('teachers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  teacherId: varchar('teacher_id', { length: 50 }).notNull().unique(),
  designation: varchar('designation', { length: 100 }).notNull(),
  department: varchar('department', { length: 100 }).notNull(),
  staffType: staffTypeEnum('staff_type').notNull().default('teacher'),
  semester: integer('semester'),
  section: varchar('section', { length: 10 }),
});

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseCode: varchar('course_code', { length: 20 }).notNull().unique(),
  courseName: varchar('course_name', { length: 255 }).notNull(),
  creditHours: integer('credit_hours').notNull().default(3),
  department: varchar('department', { length: 100 }).notNull(),
  semester: integer('semester').notNull(),
  teacherId: uuid('teacher_id').references(() => teachers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studentCourses = pgTable(
  'student_courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('student_course_unique').on(table.studentId, table.courseId)]
);

export const classSessions = pgTable('class_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id').references(() => teachers.id),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  topic: varchar('topic', { length: 255 }),
  roomNumber: varchar('room_number', { length: 20 }),
  status: sessionStatusEnum('status').notNull().default('scheduled'),
});

export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => classSessions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull().default('absent'),
    markSource: markSourceEnum('mark_source').notNull().default('manual'),
    markedAt: timestamp('marked_at').defaultNow().notNull(),
    markedBy: uuid('marked_by').references(() => users.id),
    remarks: text('remarks'),
  },
  (table) => [uniqueIndex('attendance_session_student_unique').on(table.sessionId, table.studentId)]
);

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  targetAudience: targetAudienceEnum('target_audience').notNull().default('all'),
  department: varchar('department', { length: 100 }),
  section: varchar('section', { length: 10 }),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const classRoutine = pgTable('class_routine', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  roomNumber: varchar('room_number', { length: 20 }),
  section: varchar('section', { length: 10 }),
  shift: varchar('shift', { length: 10 }),
  teacherAcronym: varchar('teacher_acronym', { length: 20 }),
  effectiveFrom: date('effective_from'),
  effectiveTo: date('effective_to'),
});

export const academicFaculty = pgTable(
  'academic_faculty',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    acronym: varchar('acronym', { length: 20 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    designation: varchar('designation', { length: 150 }),
    subject: varchar('subject', { length: 50 }),
    mobile: varchar('mobile', { length: 20 }),
    email: varchar('email', { length: 255 }),
    department: varchar('department', { length: 100 }).notNull(),
    academicTerm: varchar('academic_term', { length: 50 }).notNull().default('Spring 2026'),
  },
  (table) => [uniqueIndex('academic_faculty_acronym_term').on(table.acronym, table.academicTerm)]
);

export const sectionRepresentatives = pgTable('section_representatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  department: varchar('department', { length: 100 }).notNull(),
  semester: integer('semester').notNull(),
  section: varchar('section', { length: 10 }).notNull(),
  role: varchar('role', { length: 10 }).notNull(),
  studentNumber: varchar('student_number', { length: 50 }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  mobile: varchar('mobile', { length: 20 }),
  email: varchar('email', { length: 255 }),
  academicTerm: varchar('academic_term', { length: 50 }).notNull().default('Spring 2026'),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').notNull().default('general'),
  isRead: boolean('is_read').notNull().default(false),
  referenceId: uuid('reference_id'),
  referenceType: varchar('reference_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  dateFrom: date('date_from').notNull(),
  dateTo: date('date_to').notNull(),
  reason: text('reason').notNull(),
  note: text('note'),
  status: leaveStatusEnum('status').notNull().default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNote: text('review_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaveRequestCourses = pgTable(
  'leave_request_courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leaveRequestId: uuid('leave_request_id')
      .notNull()
      .references(() => leaveRequests.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
  },
  (table) => [uniqueIndex('leave_request_course_unique').on(table.leaveRequestId, table.courseId)]
);

export const sessionQrTokens = pgTable('session_qr_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => classSessions.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 80 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  pushEnabled: boolean('push_enabled').notNull().default(true),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  smsEnabled: boolean('sms_enabled').notNull().default(false),
  lowAttendance: boolean('low_attendance').notNull().default(true),
  announcements: boolean('announcements').notNull().default(true),
  reminders: boolean('reminders').notNull().default(true),
  leaveUpdates: boolean('leave_updates').notNull().default(true),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  teacher: one(teachers, { fields: [users.id], references: [teachers.userId] }),
  announcements: many(announcements),
  notifications: many(notifications),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  enrollments: many(studentCourses),
  attendanceRecords: many(attendance),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(teachers, { fields: [courses.teacherId], references: [teachers.id] }),
  enrollments: many(studentCourses),
  sessions: many(classSessions),
  routineSlots: many(classRoutine),
}));

export const studentCoursesRelations = relations(studentCourses, ({ one }) => ({
  student: one(students, { fields: [studentCourses.studentId], references: [students.id] }),
  course: one(courses, { fields: [studentCourses.courseId], references: [courses.id] }),
}));

export const classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  course: one(courses, { fields: [classSessions.courseId], references: [courses.id] }),
  teacher: one(teachers, { fields: [classSessions.teacherId], references: [teachers.id] }),
  attendanceRecords: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  session: one(classSessions, { fields: [attendance.sessionId], references: [classSessions.id] }),
  student: one(students, { fields: [attendance.studentId], references: [students.id] }),
  markedByUser: one(users, { fields: [attendance.markedBy], references: [users.id] }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, { fields: [announcements.authorId], references: [users.id] }),
}));

export const classRoutineRelations = relations(classRoutine, ({ one }) => ({
  course: one(courses, { fields: [classRoutine.courseId], references: [courses.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
