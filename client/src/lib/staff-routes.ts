import type { AppMode } from '@/config/academic';
import type { UserRole } from '@/types';

export function getStaffHomePath(role: UserRole, appMode: AppMode): string {
  if (role === 'student') return '/student/dashboard';
  if (appMode === 'general') return '/attend';
  return role === 'admin' ? '/admin/dashboard' : '/teacher/dashboard';
}

export function getAdvancedPanelPath(role: UserRole): string {
  return role === 'admin' ? '/admin/students' : '/teacher/students';
}

export function getStaffBasePath(role: UserRole): '/admin' | '/teacher' {
  return role === 'admin' ? '/admin' : '/teacher';
}

export function getStaffAnnouncementsPath(role: UserRole): string {
  return `${getStaffBasePath(role)}/announcements`;
}

export function getStaffRoutinePath(role: UserRole): string {
  return `${getStaffBasePath(role)}/routine`;
}
