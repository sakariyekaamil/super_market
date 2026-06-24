import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { paymentSchema, idParamSchema, updatePaymentSchema } from '../utils/validators';

const router = Router();
const roles = [Role.ADMIN, Role.MANAGER, Role.CASHIER];

router.use(authenticate, authorize(...roles));
router.get('/', ctrl.getPayments);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.getPayment);
router.post('/', validate(paymentSchema), ctrl.createPayment);
router.put('/:id', validate(idParamSchema, 'params'), validate(updatePaymentSchema), ctrl.updatePayment);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.deletePayment);

export default router;
