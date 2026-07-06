import { Router } from 'express';
import * as authController from './controller';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { registerSchema, loginSchema } from './validation';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
