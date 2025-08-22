import { sendErrorResponse, sendSuccessResponse } from "@/middlewares/validation.middleware";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../../utils/http-errors";
import { AuthenticatedRequest } from "../permissions/middleware";
import { authService } from "./service";

export class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await authService.register(req.body);

      sendSuccessResponse(res, result, "Kayıt başarılı", 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");

      const result = await authService.login(
        req.body,
        ipAddress,
        userAgent
      );

      sendSuccessResponse(res, result, "Giriş başarılı");
    } catch (error) {
      next(error);
    }
  }

  async logout(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const sessionId = req.body.sessionId || req.headers["x-session-id"];

      if (!sessionId) {
        sendErrorResponse(res, "Session ID gerekli");
      }

      await authService.logout(sessionId);

      sendSuccessResponse(res, "Çıkış başarılı");
    } catch (error) {
      next(error);
    }
  }

  async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await authService.getUserProfile(req.user.id);

      sendSuccessResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updatedUser = await authService.updateUserProfile(
        req.user.id,
        req.body
      );

      sendSuccessResponse(res, updatedUser, "Profil güncellendi");
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {

      await authService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );

      sendSuccessResponse(res, "Şifre başarıyla değiştirildi");
    } catch (error) {
      next(error);
    }
  }

  async getSessions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const sessions = await authService.getUserSessions(req.user.id);

      sendSuccessResponse(res, sessions);
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sessionId } = req.params;

      await authService.revokeSession(req.user.id, sessionId);

      sendSuccessResponse(res, "Session sonlandırıldı");
    } catch (error) {
      next(error);
    }
  }

  async revokeAllSessions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const currentSessionId = req.body.currentSessionId;

      await authService.revokeAllSessions(req.user.id, currentSessionId);

      sendSuccessResponse(res, "Tüm cihazlardan çıkış yapıldı");
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {  
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new BadRequestError("Token gerekli");
      }

      const token = authHeader.substring(7);
      const payload = await authService.verifyToken(token);

      sendSuccessResponse(res, { valid: true, payload }, "Token geçerli");
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
