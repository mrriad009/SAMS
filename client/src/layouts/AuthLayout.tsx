import { APP_NAME } from '@/config/app';
import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardCheck } from 'lucide-react';
import { StudentSearchBar } from '@/components/shared/StudentSearchBar';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background dark:bg-dark-bg">
      <header className="border-b border-slate-200 p-4 dark:border-slate-700">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3">
          <Link to="/login" className="flex items-center justify-center gap-2">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            <span className="font-display text-base font-bold leading-snug">{APP_NAME}</span>
          </Link>
          <StudentSearchBar />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
