import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Megaphone,
  Calendar,
  Settings,
} from 'lucide-react';
import type { AppMode } from './academic';

export const STAFF_NAV_ITEMS = [
  { segment: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, modes: ['advanced'] as AppMode[] },
  { segment: 'students', label: 'Students', icon: Users, modes: ['general', 'advanced'] as AppMode[] },
  { segment: 'courses', label: 'Courses', icon: BookOpen, modes: ['advanced'] as AppMode[] },
  { segment: 'attendance', label: 'Attendance', icon: ClipboardCheck, modes: ['advanced'] as AppMode[] },
  { segment: 'reports', label: 'Reports', icon: BarChart3, modes: ['general', 'advanced'] as AppMode[] },
  { segment: 'announcements', label: 'Announcements', icon: Megaphone, modes: ['general', 'advanced'] as AppMode[] },
  { segment: 'routine', label: 'Routine', icon: Calendar, modes: ['advanced'] as AppMode[] },
  { segment: 'settings', label: 'Settings', icon: Settings, modes: ['advanced'] as AppMode[] },
] as const;

export function getStaffNavForMode(mode: AppMode, isAdmin = false) {
  return STAFF_NAV_ITEMS.filter((item) => {
    if (item.segment === 'settings' && mode === 'general') return isAdmin;
    return item.modes.includes(mode);
  });
}
