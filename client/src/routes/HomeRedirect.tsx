import { Navigate } from 'react-router-dom';
import { useAppConfig } from '@/hooks/useAppMode';
import { useAuth } from '@/hooks/useAuth';
import { getStaffHomePath } from '@/lib/staff-routes';
import { Skeleton } from '@/components/ui/skeleton';

export function HomeRedirect() {
  const { data: config, isLoading } = useAppConfig();
  const { isAuthenticated, user, hasHydrated } = useAuth();

  if (!hasHydrated || isLoading || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/lookup" replace />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={getStaffHomePath(user.role, config.appMode)} replace />;
}
