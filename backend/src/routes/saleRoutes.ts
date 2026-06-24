import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/saleController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { saleSchema, idParamSchema } from '../utils/validators';

const router = Router();
const roles = [Role.ADMIN, Role.MANAGER, Role.CASHIER];

router.use(authenticate, authorize(...roles));
router.get('/', ctrl.getSales);
router.get('/:id/receipt', validate(idParamSchema, 'params'), ctrl.getReceipt);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.getSale);
router.post('/', validate(saleSchema), ctrl.createSale);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.deleteSale);

export default router;
