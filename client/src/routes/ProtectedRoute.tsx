import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'teacher' | 'student'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading, hasHydrated } = useAuth();
  const location = useLocation();

  if (!hasHydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home =
      user.role === 'admin'
        ? '/admin/dashboard'
        : user.role === 'teacher'
          ? '/teacher/dashboard'
          : '/student/dashboard';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
