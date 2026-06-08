import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminStudents from './admin/students.routes.js';
import adminCourses from './admin/courses.routes.js';
import adminSessions from './admin/sessions.routes.js';
import adminAnnouncements from './admin/announcements.routes.js';
import adminRoutine from './admin/routine.routes.js';
import adminReports from './admin/reports.routes.js';
import adminAcademic from './admin/academic.routes.js';
import adminAttendance from './admin/attendance.routes.js';
import teacherRoutes from './teacher/index.routes.js';
import studentRoutes from './student/index.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/admin/students', adminStudents);
router.use('/admin/courses', adminCourses);
router.use('/admin/sessions', adminSessions);
router.use('/admin/announcements', adminAnnouncements);
router.use('/admin/routine', adminRoutine);
router.use('/admin/reports', adminReports);
router.use('/admin/academic', adminAcademic);
router.use('/admin/attendance', adminAttendance);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);

export default router;
