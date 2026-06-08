import { Link, Outlet } from 'react-router-dom';
import { Calendar, ClipboardCheck, LogOut, Megaphone, PanelRightOpen } from 'lucide-react';
import { APP_NAME } from '@/config/app';
import { CSE_DEPARTMENT } from '@/config/academic';
import { useAuth } from '@/hooks/useAuth';
import { getAdvancedPanelPath, getStaffAnnouncementsPath, getStaffRoutinePath } from '@/lib/staff-routes';
import { Button } from '@/components/ui/button';

export function GeneralLayout() {
  const { user, logout } = useAuth();
  const advancedPath = user ? getAdvancedPanelPath(user.role) : '/login';
  const announcementsPath = user ? getStaffAnnouncementsPath(user.role) : '/login';
  const routinePath = user ? getStaffRoutinePath(user.role) : '/login';

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-surface/90 backdrop-blur dark:border-slate-700 dark:bg-dark-surface/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardCheck className="h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold">{APP_NAME}</p>
              <p className="truncate text-[11px] text-muted-foreground">{CSE_DEPARTMENT}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="outline" size="sm" asChild>
              <Link to={routinePath}>
                <Calendar className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Routine</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={announcementsPath}>
                <Megaphone className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Announcements</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={advancedPath}>
                <PanelRightOpen className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">More</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => logout()} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}
