import { Router } from 'express';
import * as departmentController from '../../controllers/department.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin, requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('admin', 'teacher'), departmentController.list);
router.post('/', requireAdmin, departmentController.create);

export default router;
