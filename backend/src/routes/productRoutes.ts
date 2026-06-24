import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { productSchema, idParamSchema } from '../utils/validators';

const router = Router();
const roles = [Role.ADMIN, Role.MANAGER];

router.use(authenticate, authorize(...roles));
router.get('/low-stock', ctrl.getLowStockProducts);
router.get('/barcode/:barcode', ctrl.getProductByBarcode);
router.get('/', ctrl.getProducts);
router.get('/:id', validate(idParamSchema, 'params'), ctrl.getProduct);
router.post('/', validate(productSchema), ctrl.createProduct);
router.put('/:id', validate(idParamSchema, 'params'), validate(productSchema), ctrl.updateProduct);
router.delete('/:id', validate(idParamSchema, 'params'), ctrl.deleteProduct);

export default router;
