import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/employeeController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { employeeSchema, idParamSchema } from '../utils/validators';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));
router.get('/', ctrl.getEmployees);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.getEmployee);
router.post('/', validate(employeeSchema), ctrl.createEmployee);
router.put('/:id', validate(idParamSchema, 'params'), validate(employeeSchema), ctrl.updateEmployee);
router.patch('/:id/deactivate', validate(idParamSchema, 'params'), ctrl.deactivateEmployee);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.deleteEmployee);

export default router;
