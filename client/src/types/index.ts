export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: StudentProfile | TeacherProfile | null;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentId: string;
  department: string;
  semester: number;
  section: string;
  batchYear: number;
  guardianName?: string | null;
  guardianPhone?: string | null;
  address?: string | null;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  teacherId: string;
  designation: string;
  department: string;
  staffType: 'teacher' | 'cr';
  semester?: number | null;
  section?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  department: string;
  semester: number;
  section: string;
  batchYear: number;
  guardianName?: string | null;
  guardianPhone?: string | null;
  address?: string | null;
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  creditHours: number;
  department: string;
  semester: number;
  teacherId?: string | null;
  teacherName?: string | null;
  enrolledCount?: number;
}

export interface ClassSession {
  id: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic?: string | null;
  roomNumber?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  courseCode?: string;
  courseName?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  status: AttendanceStatus;
  markedAt: string;
  remarks?: string | null;
  sessionDate: string;
  sessionTopic?: string | null;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  courseId: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'department' | 'section';
  department?: string | null;
  section?: string | null;
  isPinned: boolean;
  createdAt: string;
  authorName?: string;
  authorId?: string;
}

export interface RoutineSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
  section?: string | null;
  shift?: string | null;
  teacherAcronym?: string | null;
  courseCode: string;
  courseName: string;
  teacherName?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'low_attendance' | 'announcement' | 'session_reminder' | 'general';
  isRead: boolean;
  createdAt: string;
}

export interface PublicStudentProfile {
  profile: {
    id: string;
    studentId: string;
    name: string;
    email?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    department: string;
    semester: number;
    section: string;
    batchYear: number;
    guardianName?: string | null;
    guardianPhone?: string | null;
    address?: string | null;
  };
  courses: Array<{
    id: string;
    courseCode: string;
    courseName: string;
    department: string;
    semester: number;
    teacherName?: string | null;
    enrolledAt: string;
  }>;
  attendance: AttendanceSummary;
}

export interface AttendanceSummary {
  courses: Array<{
    courseId: string;
    courseCode: string;
    courseName: string;
    total: number;
    present: number;
    percentage: number;
    belowThreshold: boolean;
  }>;
  overall: {
    total: number;
    present: number;
    percentage: number;
    belowThreshold: boolean;
  };
  threshold: number;
}
