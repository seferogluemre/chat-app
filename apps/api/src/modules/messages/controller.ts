import { NextFunction, Response } from "express";
import { sendSuccessResponse } from "../../middlewares/validation.middleware";
import { AuthenticatedRequest } from "../auth/permissions/middleware";
import { messageService } from "./service";

export class MessageController {
  async getRoomMessages(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId } = req.params;
      const filters = { ...req.query, roomId };
      const result = await messageService.getRoomMessages(filters, req.user.id);
      sendSuccessResponse(res, result, "Mesajlar başarıyla getirildi");
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const message = await messageService.sendMessage(req.user.id, req.body);
      sendSuccessResponse(res, message, "Mesaj başarıyla gönderildi", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { messageId } = req.params;
      const message = await messageService.updateMessage(
        messageId,
        req.user.id,
        req.body
      );
      sendSuccessResponse(res, message, "Mesaj başarıyla güncellendi");
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { messageId } = req.params;
      await messageService.deleteMessage(messageId, req.user.id);
      sendSuccessResponse(res, null, "Mesaj başarıyla silindi");
    } catch (error) {
      next(error);
    }
  }

  async togglePinMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { messageId } = req.params;
      const { pinned } = req.body;
      const message = await messageService.togglePinMessage(
        messageId,
        req.user.id,
        pinned
      );
      const action = pinned ? "pinlendi" : "pin kaldırıldı";
      sendSuccessResponse(res, message, `Mesaj başarıyla ${action}`);
    } catch (error) {
      next(error);
    }
  }

  async toggleReaction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { messageId } = req.params;
      await messageService.toggleReaction(messageId, req.user.id, req.body);
      const action = req.body.action === "add" ? "eklendi" : "kaldırıldı";
      sendSuccessResponse(res, null, `Reaction başarıyla ${action}`);
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();