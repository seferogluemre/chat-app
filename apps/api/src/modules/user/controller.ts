import { NextFunction, Response } from 'express';
import { sendSuccessResponse } from '../../middlewares/validation.middleware';
import { AuthenticatedRequest } from '../auth/permissions/middleware';
import { userService } from './service';

export class UserController {
  async searchUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await userService.searchUsers(req.query as any);
      sendSuccessResponse(res, result, 'Kullanıcılar başarıyla getirildi');
    } catch (error) {
      next(error);
    }
  }

  async getUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await userService.getUserProfile(userId, req.user.id);
      sendSuccessResponse(res, user, 'Kullanıcı profili başarıyla getirildi');
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await userService.updateUser(userId, req.user.id, req.body);
      sendSuccessResponse(res, user, 'Kullanıcı başarıyla güncellendi');
    } catch (error) {
      next(error);
    }
  }

  async banUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      await userService.banUser(userId, req.user.id, req.body);
      sendSuccessResponse(res, null, 'Kullanıcı başarıyla banlandı');
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      await userService.unbanUser(userId, req.user.id);
      sendSuccessResponse(res, null, 'Ban başarıyla kaldırıldı');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      await userService.deleteUser(userId, req.user.id);
      sendSuccessResponse(res, null, 'Kullanıcı başarıyla silindi');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();