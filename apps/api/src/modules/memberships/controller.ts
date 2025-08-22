import { NextFunction, Response } from "express";
import { sendSuccessResponse } from "../../middlewares/validation.middleware";
import { AuthenticatedRequest } from "../auth/permissions/middleware";
import { membershipService } from "./service";

export class MembershipController {
  async inviteMembers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await membershipService.inviteMembers(req.user.id, req.body);
      sendSuccessResponse(res, null, "Üyeler başarıyla davet edildi");
    } catch (error) {
      next(error);
    }
  }

  async kickMember(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId, userId } = req.params;
      await membershipService.kickMember(
        req.user.id,
        roomId,
        userId,
        req.body.reason
      );
      sendSuccessResponse(res, null, "Üye başarıyla çıkarıldı");
    } catch (error) {
      next(error);
    }
  }

  async leaveRoom(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId } = req.params;
      await membershipService.leaveRoom(req.user.id, roomId);
      sendSuccessResponse(res, null, "Odadan başarıyla ayrıldınız");
    } catch (error) {
      next(error);
    }
  }
}

export const membershipController = new MembershipController();
