import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { HomeRedirect } from '@/routes/HomeRedirect';
import { StaffIndexRedirect } from '@/routes/StaffIndexRedirect';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { TeacherLayout } from '@/layouts/TeacherLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { GeneralLayout } from '@/layouts/GeneralLayout';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

const LookupPage = lazy(() => import('@/pages/public/LookupPage'));
const PublicStudentProfilePage = lazy(() => import('@/pages/public/PublicStudentProfilePage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminStudents = lazy(() => import('@/pages/admin/StudentsPage'));
const StaffStudentProfile = lazy(() => import('@/pages/admin/StaffStudentProfilePage'));
const AdminCourses = lazy(() => import('@/pages/admin/CoursesPage'));
const AdminAttendance = lazy(() => import('@/pages/admin/AttendancePage'));
const AdminReports = lazy(() => import('@/pages/admin/ReportsPage'));
const AdminAnnouncements = lazy(() => import('@/pages/admin/AnnouncementsPage'));
const AdminRoutine = lazy(() => import('@/pages/admin/RoutinePage'));
const AdminSettings = lazy(() => import('@/pages/admin/SettingsPage'));
const GeneralAttendance = lazy(() => import('@/pages/general/GeneralAttendancePage'));
const StudentDashboard = lazy(() => import('@/pages/student/DashboardPage'));
const StudentAttendance = lazy(() => import('@/pages/student/AttendancePage'));
const StudentCourses = lazy(() => import('@/pages/student/CoursesPage'));
const StudentAnnouncements = lazy(() => import('@/pages/student/AnnouncementsPage'));
const StudentRoutine = lazy(() => import('@/pages/student/RoutinePage'));
const StudentProfile = lazy(() => import('@/pages/student/ProfilePage'));
const StudentNotifications = lazy(() => import('@/pages/student/NotificationsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function PageLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />

            <Route
              path="/attend"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <GeneralLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<GeneralAttendance />} />
            </Route>

            <Route element={<PublicLayout />}>
              <Route path="/lookup" element={<LookupPage />} />
              <Route path="/lookup/:studentId" element={<PublicStudentProfilePage />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StaffIndexRedirect basePath="/admin" />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="students/:studentId" element={<StaffStudentProfile />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="routine" element={<AdminRoutine />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StaffIndexRedirect basePath="/teacher" />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="students/:studentId" element={<StaffStudentProfile />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="routine" element={<AdminRoutine />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="announcements" element={<StudentAnnouncements />} />
              <Route path="routine" element={<StudentRoutine />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="notifications" element={<StudentNotifications />} />
            </Route>

            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ErrorBoundary>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
