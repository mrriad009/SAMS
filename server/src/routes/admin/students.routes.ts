import { Router } from 'express';
import * as studentController from '../../controllers/student.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin, requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'teacher'), studentController.listStudents);
router.get('/:id/profile', requireRole('admin', 'teacher'), studentController.getStudentProfile);
router.get('/:id', requireRole('admin', 'teacher'), studentController.getStudent);
router.post('/', requireAdmin, studentController.createStudent);
router.patch('/:id', requireAdmin, studentController.updateStudent);
router.delete('/:id', requireAdmin, studentController.deleteStudent);

export default router;
