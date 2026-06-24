import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/salaryPaymentController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { salaryPaymentSchema, idParamSchema } from '../utils/validators';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));
router.get('/', ctrl.getSalaryPayments);
router.get('/employee/:employeeId', ctrl.getEmployeeSalaryHistory);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.getSalaryPayment);
router.post('/', validate(salaryPaymentSchema), ctrl.createSalaryPayment);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.deleteSalaryPayment);

export default router;
