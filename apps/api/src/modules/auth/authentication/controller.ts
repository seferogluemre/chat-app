import { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../../../utils/http-errors';
import { AuthenticatedRequest } from '../permissions/middleware';
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema, validateSchema } from './dtos';
import { authService } from './service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(registerSchema, req.body);
      
      const result = await authService.register(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Kayıt başarılı',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(loginSchema, req.body);
      
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      const result = await authService.login(validatedData, ipAddress, userAgent);
      
      res.json({
        success: true,
        message: 'Giriş başarılı',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.body.sessionId || req.headers['x-session-id'];
      
      if (!sessionId) {
        throw new BadRequestError('Session ID gerekli');
      }
      
      await authService.logout(sessionId);
      
      res.json({
        success: true,
        message: 'Çıkış başarılı'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getUserProfile(req.user.id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(updateProfileSchema, req.body);
      
      const updatedUser = await authService.updateUserProfile(req.user.id, validatedData);
      
      res.json({
        success: true,
        message: 'Profil güncellendi',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateSchema(changePasswordSchema, req.body);
      
      await authService.changePassword(
        req.user.id, 
        validatedData.currentPassword, 
        validatedData.newPassword
      );
      
      res.json({
        success: true,
        message: 'Şifre başarıyla değiştirildi'
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await authService.getUserSessions(req.user.id);
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      await authService.revokeSession(req.user.id, sessionId);
      
      res.json({
        success: true,
        message: 'Session sonlandırıldı'
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeAllSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentSessionId = req.body.currentSessionId;
      
      await authService.revokeAllSessions(req.user.id, currentSessionId);
      
      res.json({
        success: true,
        message: 'Tüm cihazlardan çıkış yapıldı'
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new BadRequestError('Token gerekli');
      }

      const token = authHeader.substring(7);
      const payload = await authService.verifyToken(token);
      
      res.json({
        success: true,
        message: 'Token geçerli',
        data: { valid: true, payload }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();