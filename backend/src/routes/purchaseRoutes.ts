import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/purchaseController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { purchaseSchema, idParamSchema } from '../utils/validators';

const router = Router();
const roles = [Role.ADMIN, Role.MANAGER];

router.use(authenticate, authorize(...roles));
router.get('/', ctrl.getPurchases);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.getPurchase);
router.post('/', validate(purchaseSchema), ctrl.createPurchase);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.deletePurchase);

export default router;
