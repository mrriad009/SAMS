import { Navigate } from 'react-router-dom';
import { useAppMode } from '@/hooks/useAppMode';

export function StaffIndexRedirect({ basePath }: { basePath: '/admin' | '/teacher' }) {
  const mode = useAppMode();
  const segment = mode === 'general' ? 'students' : 'dashboard';
  return <Navigate to={`${basePath}/${segment}`} replace />;
}
