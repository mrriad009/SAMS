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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/student/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/student/attendance', label: 'Attendance', icon: ClipboardCheck },
  { path: '/student/courses', label: 'Courses', icon: BookOpen },
  { path: '/student/announcements', label: 'News', icon: Megaphone },
  { path: '/student/routine', label: 'Routine', icon: Calendar },
  { path: '/student/profile', label: 'Profile', icon: User },
];

const mobileNav = navItems.slice(0, 5);

export function StudentLayout() {
  const location = useLocation();
  const { logout } = useAuth();

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

      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-surface/80 px-4 backdrop-blur dark:border-slate-700 dark:bg-dark-surface/80">
          <span className="min-w-0 max-w-[52vw] truncate font-display text-xs font-semibold leading-snug sm:max-w-none lg:hidden">
            {APP_NAME}
          </span>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 ml-auto">
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

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-surface dark:border-slate-700 dark:bg-dark-surface lg:hidden">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
                  active ? 'text-primary' : 'text-slate-500'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
