import { useAuth } from '@/hooks/useAuth';

/** Teachers/CRs can view and create (attendance, announcements) but cannot edit or delete records. */
export function useReadOnlyStaff() {
  const { user } = useAuth();
  return user?.role === 'teacher';
}
