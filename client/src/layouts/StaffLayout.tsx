import { APP_NAME } from '@/config/app';
import { getStaffNavForMode } from '@/config/staff-nav';
import { useAppMode } from '@/hooks/useAppMode';
import { LayoutGrid } from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardCheck, Menu, X, Bell, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { TeacherProfile } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface StaffLayoutProps {
  basePath: '/admin' | '/teacher';
  panelLabel: string;
}

export function StaffLayout({ basePath, panelLabel }: StaffLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const profile = user?.profile as TeacherProfile | undefined;

  const appMode = useAppMode();
  const navItems = getStaffNavForMode(appMode, user?.role === 'admin').map((item) => ({
    ...item,
    path: `${basePath}/${item.segment}`,
  }));

  const currentNav = navItems.find((item) => location.pathname.startsWith(item.path));

  const scopeLabel =
    profile?.section && profile?.semester != null
      ? `Semester ${profile.semester} · Section ${profile.section}`
      : profile?.department;

  return (
    <div className="flex min-h-screen bg-background dark:bg-dark-bg">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-surface transition-transform duration-200 dark:border-slate-700 dark:bg-dark-surface lg:relative lg:z-auto lg:translate-x-0',
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full pointer-events-none lg:pointer-events-auto'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6 dark:border-slate-700">
          <ClipboardCheck className="h-7 w-7 text-primary" />
          <span className="font-display text-sm font-bold leading-snug">{APP_NAME}</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {appMode === 'general' && (
            <Link
              to="/attend"
              onClick={() => setSidebarOpen(false)}
              className="mb-2 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary"
            >
              <LayoutGrid className="h-5 w-5" />
              Take attendance
            </Link>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
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
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-surface/80 px-4 backdrop-blur dark:border-slate-700 dark:bg-dark-surface/80 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{panelLabel}</p>
              <h1 className="truncate font-display text-sm font-semibold">{currentNav?.label || 'Dashboard'}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {basePath === '/admin' && (
              <Link to="/admin/settings">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                {scopeLabel && basePath === '/teacher' && (
                  <p className="truncate text-xs text-muted-foreground">{scopeLabel}</p>
                )}
              </div>
            </div>
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="min-w-0"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
