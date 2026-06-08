import { APP_NAME } from '@/config/app';
import { Link, Outlet } from 'react-router-dom';
import { ClipboardCheck, LogIn } from 'lucide-react';
import { StudentSearchBar } from '@/components/shared/StudentSearchBar';
import { Button } from '@/components/ui/button';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background dark:bg-dark-bg">
      <header className="border-b border-slate-200 bg-surface/80 backdrop-blur dark:border-slate-700 dark:bg-dark-surface/80">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Link to="/lookup" className="flex shrink-0 items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-primary" />
            <span className="font-display text-sm font-bold leading-snug">{APP_NAME}</span>
          </Link>
          <StudentSearchBar className="sm:flex-1" />
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link to="/login">
              <LogIn className="mr-1.5 h-4 w-4" />
              Sign in
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
