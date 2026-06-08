import { useLocation } from 'react-router-dom';

export function useStaffBasePath(): '/admin' | '/teacher' {
  const location = useLocation();
  return location.pathname.startsWith('/teacher') ? '/teacher' : '/admin';
}
