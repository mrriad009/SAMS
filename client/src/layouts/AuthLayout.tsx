import { APP_NAME } from '@/config/app';
import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardCheck } from 'lucide-react';
import { StudentSearchBar } from '@/components/shared/StudentSearchBar';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background dark:bg-dark-bg">
      <header className="border-b border-slate-200 p-4 dark:border-slate-700">
        <Link to="/login" className="mx-auto flex w-full max-w-md items-center justify-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <span className="font-display text-base font-bold leading-snug">{APP_NAME}</span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
        <StudentSearchBar />
        <div className="flex flex-1 flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
