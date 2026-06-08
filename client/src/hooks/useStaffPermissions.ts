import { useAuth } from '@/hooks/useAuth';
import type { TeacherProfile } from '@/types';
import { toDateKey } from '@/lib/calendar-strip';

/** UI + API alignment for teacher/CR scope and today-only attendance */
export function useStaffPermissions() {
  const { user, isAdmin } = useAuth();
  const profile = user?.profile as TeacherProfile | undefined;
  const isTeacher = user?.role === 'teacher';

  return {
    isAdmin,
    isTeacher,
    /** Teachers/CRs: fixed semester from profile */
    lockedSemester: isTeacher && profile?.semester != null ? profile.semester : null,
    /** Teachers/CRs: fixed section from profile */
    lockedSection: isTeacher && profile?.section ? profile.section : null,
    /** Teachers/CRs cannot mark past or future dates */
    attendanceTodayOnly: isTeacher,
    today: toDateKey(new Date()),
  };
}
