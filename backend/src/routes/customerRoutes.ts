import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { customerSchema, idParamSchema } from '../utils/validators';

const router = Router();
const roles = [Role.ADMIN, Role.MANAGER, Role.CASHIER];

router.use(authenticate, authorize(...roles));
router.get('/', ctrl.getCustomers);
router.get('/:id/history', validate(idParamSchema, 'params'), ctrl.getCustomerHistory);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.getCustomer);
router.post('/', validate(customerSchema), ctrl.createCustomer);
router.put('/:id', validate(idParamSchema, 'params'), validate(customerSchema), ctrl.updateCustomer);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.deleteCustomer);

export default router;
