import { Router } from 'express';
import * as routineController from '../../controllers/routine.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin, requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'teacher'), routineController.listRoutine);
router.post('/import', requireAdmin, routineController.importRoutineSlots);
router.post('/', requireAdmin, routineController.createSlot);
router.patch('/:id', requireAdmin, routineController.updateSlot);
router.delete('/:id', requireAdmin, routineController.deleteSlot);

export default router;
