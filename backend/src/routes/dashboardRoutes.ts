import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ctrl from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const roles = [Role.ADMIN, Role.MANAGER, Role.CASHIER];

router.use(authenticate, authorize(...roles));
router.get('/stats', ctrl.getDashboardStats);
router.get('/charts/monthly-sales', ctrl.getMonthlySalesChart);
router.get('/charts/top-products', ctrl.getTopSellingProducts);
router.get('/charts/purchases-by-month', ctrl.getPurchasesByMonth);

export default router;
