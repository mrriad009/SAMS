import axios from 'axios';
import api from './api';
import type {
  ApiResponse,
  Student,
  Course,
  ClassSession,
  AttendanceRecord,
  AttendanceSummary,
  Announcement,
  RoutineSlot,
  Notification,
  User,
  PublicStudentProfile,
} from '@/types';

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface AppConfig {
  appMode: 'general' | 'advanced';
  department: string;
  currentSemester: number;
  attendanceThreshold: number;
  academicYear: string;
}

export const publicApi = {
  getConfig: () => publicClient.get<ApiResponse<AppConfig>>('/public/config'),
  getStudentProfile: (studentId: string) =>
    publicClient.get<ApiResponse<PublicStudentProfile>>(
      `/public/students/${encodeURIComponent(studentId)}`
    ),
};

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
  registerStudent: (data: {
    name: string;
    email: string;
    password: string;
    studentId: string;
    department: string;
    section: string;
    batchYear: number;
    phone?: string;
  }) => api.post('/auth/register-student', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

export const teacherApi = {
  dashboard: () => api.get('/teacher/dashboard'),
  profile: () => api.get('/teacher/profile'),
};

export const adminAcademicApi = {
  faculty: (params?: { department?: string }) =>
    api.get('/admin/academic/faculty', { params }),
  representatives: (params?: { department?: string; semester?: number; section?: string }) =>
    api.get('/admin/academic/representatives', { params }),
};

export const adminStudentsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<ApiResponse<Student[]>>('/admin/students', { params }),
  get: (id: string) => api.get<ApiResponse<Student>>(`/admin/students/${id}`),
  getProfile: (id: string) =>
    api.get<ApiResponse<PublicStudentProfile>>(`/admin/students/${encodeURIComponent(id)}/profile`),
  create: (data: Partial<Student>) => api.post('/admin/students', data),
  update: (id: string, data: Partial<Student>) => api.patch(`/admin/students/${id}`, data),
  delete: (id: string) => api.delete(`/admin/students/${id}`),
};

export const adminCoursesApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<ApiResponse<Course[]>>('/admin/courses', { params }),
  create: (data: Partial<Course>) => api.post('/admin/courses', data),
  update: (id: string, data: Partial<Course>) => api.patch(`/admin/courses/${id}`, data),
  delete: (id: string) => api.delete(`/admin/courses/${id}`),
  enroll: (id: string, studentIds: string[]) =>
    api.post(`/admin/courses/${id}/enroll`, { studentIds }),
  getStudents: (id: string) => api.get(`/admin/courses/${id}/students`),
};

export const adminSessionsApi = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<ClassSession[]>>('/admin/sessions', { params }),
  create: (data: Partial<ClassSession>) => api.post('/admin/sessions', data),
  getAttendance: (id: string) => api.get(`/admin/sessions/${id}/attendance`),
  submitAttendance: (id: string, records: Array<{ studentId: string; status: string; remarks?: string }>) =>
    api.post(`/admin/sessions/${id}/attendance`, { records }),
};

export const adminAttendanceApi = {
  patch: (id: string, data: { status?: string; remarks?: string }) =>
    api.patch(`/admin/attendance/${id}`, data),
};

export const adminAnnouncementsApi = {
  list: () => api.get<ApiResponse<Announcement[]>>('/admin/announcements'),
  create: (data: Partial<Announcement>) => api.post('/admin/announcements', data),
  update: (id: string, data: Partial<Announcement>) => api.patch(`/admin/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/admin/announcements/${id}`),
};

export const adminRoutineApi = {
  list: (params?: { department?: string; semester?: number; section?: string }) =>
    api.get<ApiResponse<RoutineSlot[]>>('/admin/routine', { params }),
  create: (data: Partial<RoutineSlot>) => api.post('/admin/routine', data),
  update: (id: string, data: Partial<RoutineSlot>) => api.patch(`/admin/routine/${id}`, data),
  delete: (id: string) => api.delete(`/admin/routine/${id}`),
  importSlots: (slots: Array<{
    courseId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomNumber?: string;
    section?: string;
    shift?: string;
    teacherAcronym?: string;
  }>) => api.post('/admin/routine/import', { slots }),
};

export const adminReportsApi = {
  dashboard: () => api.get('/admin/reports/dashboard'),
  trend: (days?: number) => api.get('/admin/reports/trend', { params: { days } }),
  lowAttendance: () => api.get('/admin/reports/low-attendance'),
  todaySessions: () => api.get('/admin/reports/today-sessions'),
  report: (params?: Record<string, string>) => api.get('/admin/reports/attendance', { params }),
  getSettings: () => api.get('/admin/reports/settings'),
  updateSettings: (data: Record<string, string>) => api.patch('/admin/reports/settings', data),
  updateProfile: (data: Partial<User>) => api.patch('/admin/reports/profile', data),
};

export const studentApi = {
  profile: () => api.get<ApiResponse<User>>('/student/profile'),
  updateProfile: (data: {
    name: string;
    phone?: string;
    department: string;
    section: string;
    address?: string;
  }) => api.patch('/student/profile', data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/student/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  courses: () => api.get<ApiResponse<Course[]>>('/student/courses'),
  availableCourses: () => api.get<ApiResponse<Course[]>>('/student/courses/available'),
  retakeCourses: (semester?: number) =>
    api.get<ApiResponse<Course[]>>('/student/courses/retake-available', {
      params: semester != null ? { semester } : undefined,
    }),
  enrollCourse: (id: string, options?: { retake?: boolean }) =>
    api.post(`/student/courses/${id}/enroll`, options ?? {}),
  dropCourse: (id: string) => api.delete(`/student/courses/${id}/enroll`),
  attendance: (courseId?: string) =>
    api.get<ApiResponse<AttendanceRecord[]>>('/student/attendance', { params: { courseId } }),
  summary: () => api.get<ApiResponse<AttendanceSummary>>('/student/attendance/summary'),
  announcements: () => api.get<ApiResponse<Announcement[]>>('/student/announcements'),
  routine: () => api.get<ApiResponse<RoutineSlot[]>>('/student/routine'),
  notifications: () => api.get<ApiResponse<Notification[]>>('/student/notifications'),
  unreadCount: () => api.get<ApiResponse<{ count: number }>>('/student/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/student/notifications/${id}/read`),
  markAllRead: () => api.patch('/student/notifications/read-all'),
};
