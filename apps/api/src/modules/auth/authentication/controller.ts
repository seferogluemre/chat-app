import { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../../../utils/http-errors';
import { AuthenticatedRequest } from '../permissions/middleware';
import {
  changePasswordDto,
  loginDto,
  registerDto,
  updateProfileDto,
  validateDto
} from './dtos';
import { authService } from './service';

export class AuthController {
  /**
   * POST /auth/register
   * Kullanıcı kaydı
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validation
      const validatedData = validateDto(registerDto, req.body);
      
      // Service çağrısı
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

  /**
   * POST /auth/login
   * Kullanıcı girişi
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validation
      const validatedData = validateDto(loginDto, req.body);
      
      // IP ve User Agent bilgilerini al
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      // Service çağrısı
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

  /**
   * POST /auth/logout
   * Kullanıcı çıkışı
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // JWT'den session ID'yi al
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

  /**
   * GET /auth/me
   * Kullanıcı profil bilgileri
   */
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

  /**
   * PUT /auth/profile
   * Profil güncelleme
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validation
      const validatedData = validateDto(updateProfileDto, req.body);
      
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

  /**
   * POST /auth/change-password
   * Şifre değiştirme
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validation
      const validatedData = validateDto(changePasswordDto, req.body);
      
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

  /**
   * GET /auth/sessions
   * Kullanıcının aktif session'larını listele
   */
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

  /**
   * DELETE /auth/sessions/:sessionId
   * Belirli bir session'ı sonlandır
   */
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

  /**
   * DELETE /auth/sessions
   * Tüm session'ları sonlandır (logout from all devices)
   */
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

  /**
   * GET /auth/verify
   * Token doğrulama endpoint'i
   */
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

// Singleton instance
export const authController = new AuthController();