import { Router } from 'express';
import { Role } from '@prisma/client';
import * as authController from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/helpers';
import { loginSchema, registerSchema, changePasswordSchema, updateUserSchema, idParamSchema } from '../utils/validators';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/register', authenticate, authorize(Role.ADMIN), validate(registerSchema), authController.register);
router.get('/profile', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/users', authenticate, authorize(Role.ADMIN), authController.getUsers);
router.put('/users/:id', authenticate, authorize(Role.ADMIN), validate(idParamSchema, 'params'), validate(updateUserSchema), authController.updateUser);
router.delete('/users/:id', authenticate, authorize(Role.ADMIN), validate(idParamSchema, 'params'), authController.deleteUser);

export default router;
