import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const roles = [Role.ADMIN, Role.MANAGER];

router.use(authenticate, authorize(...roles));
router.get('/daily-sales', ctrl.dailySalesReport);
router.get('/monthly-sales', ctrl.monthlySalesReport);
router.get('/revenue', ctrl.revenueReport);
router.get('/purchases', ctrl.purchaseReport);
router.get('/inventory', ctrl.inventoryReport);
router.get('/profit', ctrl.profitReport);
router.get('/salary', ctrl.salaryReport);
router.get('/export', ctrl.exportReport);

export default router;
