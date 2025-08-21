import { Router } from 'express';
import { authenticate } from '../permissions/middleware';
import { authController } from './controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify', authController.verifyToken);

router.use(authenticate); 

router.post('/logout', authController.logout);
router.get('/me', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.get('/sessions', authController.getSessions);
router.delete('/sessions/:sessionId', authController.revokeSession);
router.delete('/sessions', authController.revokeAllSessions);

export { router as authRoutes };

