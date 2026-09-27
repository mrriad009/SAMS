import { useState } from 'react';
import { APP_NAME } from '@/config/app';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  Megaphone,
  Calendar,
  User,
  Bell,
  LogOut,
  QrCode,
  CalendarClock,
  MoreHorizontal,
} from 'lucide-react';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/student/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/student/attendance', label: 'Attendance', icon: ClipboardCheck },
  { path: '/student/courses', label: 'Courses', icon: BookOpen },
  { path: '/student/announcements', label: 'News', icon: Megaphone },
  { path: '/student/routine', label: 'Routine', icon: Calendar },
  { path: '/student/check-in', label: 'QR', icon: QrCode },
  { path: '/student/leave', label: 'Leave', icon: CalendarClock },
  { path: '/student/profile', label: 'Profile', icon: User },
];

const mobileBar = [
  navItems[0],
  navItems[5],
  navItems[6],
  navItems[1],
];

const mobileMore = [navItems[2], navItems[3], navItems[4], navItems[7]];

export function StudentLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = mobileMore.some((item) => location.pathname.startsWith(item.path));

  return (
    <div className="flex min-h-screen bg-background dark:bg-dark-bg">
      <aside className="hidden w-56 flex-col border-r border-slate-200 bg-surface dark:border-slate-700 dark:bg-dark-surface lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6 dark:border-slate-700">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          <span className="font-display text-sm font-bold leading-snug">{APP_NAME}</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/student/notifications"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              location.pathname.startsWith('/student/notifications')
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
          >
            <Bell className="h-5 w-5" />
            Notifications
          </Link>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-surface/80 px-4 backdrop-blur dark:border-slate-700 dark:bg-dark-surface/80">
          <span className="min-w-0 max-w-[52vw] truncate font-display text-xs font-semibold leading-snug sm:max-w-none lg:hidden">
            {APP_NAME}
          </span>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 ml-auto">
            <InstallPrompt />
            <Link to="/student/notifications" className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-w-0"
          >
            <Outlet />
          </motion.div>
        </main>

        {moreOpen && (
          <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-4 gap-2 border-t border-slate-200 bg-surface p-3 dark:border-slate-700 dark:bg-dark-surface lg:hidden">
            {mobileMore.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px]',
                    active ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-surface pb-[env(safe-area-inset-bottom)] dark:border-slate-700 dark:bg-dark-surface lg:hidden">
          {mobileBar.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 text-[11px] font-medium',
                  active ? 'text-primary' : 'text-slate-500'
                )}
              >
                <Icon className={cn('h-5 w-5', item.path === '/student/check-in' && 'h-6 w-6')} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              'flex flex-col items-center gap-1 py-2 text-[11px] font-medium',
              moreOpen || moreActive ? 'text-primary' : 'text-slate-500'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            More
          </button>
        </nav>
      </div>
    </div>
  );
}
