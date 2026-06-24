import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { categorySchema, idParamSchema } from '../utils/validators';

const router = Router();
const roles = [Role.ADMIN, Role.MANAGER];

router.use(authenticate, authorize(...roles));
router.get('/', ctrl.getCategories);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.getCategory);
router.post('/', validate(categorySchema), ctrl.createCategory);
router.put('/:id', validate(idParamSchema, 'params'), validate(categorySchema), ctrl.updateCategory);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.deleteCategory);

export default router;
