import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/supplierController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { supplierSchema, idParamSchema } from '../utils/validators';

const router = Router();
const roles = [Role.ADMIN, Role.MANAGER];

router.use(authenticate, authorize(...roles));
router.get('/', ctrl.getSuppliers);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.getSupplier);
router.post('/', validate(supplierSchema), ctrl.createSupplier);
router.put('/:id', validate(idParamSchema, 'params'), validate(supplierSchema), ctrl.updateSupplier);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.deleteSupplier);

export default router;
