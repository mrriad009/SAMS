import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    hasHydrated,
    login,
    logout,
    fetchMe,
  } = useAuthStore();

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    hasHydrated,
    login,
    logout,
    fetchMe,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
  };
}
