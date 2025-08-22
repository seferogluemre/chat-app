import { NextFunction, Response } from "express";
import { sendSuccessResponse } from "../../middlewares/validation.middleware";
import { AuthenticatedRequest } from "../auth/permissions/middleware";
import { RoomFormatter } from "./formatters";
import { roomService } from "./service";

export class RoomController {
  async getUserRooms(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rooms = await roomService.getUserRooms(req.user.id);
      const formattedRooms = RoomFormatter.formatRoomList(rooms);
      sendSuccessResponse(res, formattedRooms, "Odalar başarıyla getirildi");
    } catch (error) {
      next(error);
    }
  }

  async getPublicRooms(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = req.query;
      const result = await roomService.getPublicRooms(filters);

      const formattedResult = {
        rooms: RoomFormatter.formatRoomList(result.rooms),
        pagination: result.pagination,
      };

      sendSuccessResponse(
        res,
        formattedResult,
        "Public odalar başarıyla getirildi"
      );
    } catch (error) {
      next(error);
    }
  }

  async searchRooms(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = req.query;
      const result = await roomService.getPublicRooms(filters);

      const formattedResult = {
        rooms: RoomFormatter.formatRoomList(result.rooms),
        pagination: result.pagination,
      };

      sendSuccessResponse(
        res,
        formattedResult,
        "Arama sonuçları başarıyla getirildi"
      );
    } catch (error) {
      next(error);
    }
  }

  async getRoomById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = await roomService.getRoomById(roomId, req.user.id);
      const formattedRoom = RoomFormatter.formatRoomDetails(room, req.user.id);
      sendSuccessResponse(
        res,
        formattedRoom,
        "Oda detayları başarıyla getirildi"
      );
    } catch (error) {
      next(error);
    }
  }

  async createRoom(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const room = await roomService.createRoom(req.user.id, req.body);
      const formattedRoom = RoomFormatter.formatRoomDetails(room, req.user.id);
      sendSuccessResponse(res, formattedRoom, "Oda başarıyla oluşturuldu", 201);
    } catch (error) {
      next(error);
    }
  }

  async createDMRoom(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const room = await roomService.createDMRoom(req.user.id, req.body);
      const formattedRoom = RoomFormatter.formatRoomDetails(room, req.user.id);
      sendSuccessResponse(
        res,
        formattedRoom,
        "DM odası başarıyla oluşturuldu",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async updateRoom(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = await roomService.updateRoom(roomId, req.user.id, req.body);
      const formattedRoom = RoomFormatter.formatRoomDetails(room, req.user.id);
      sendSuccessResponse(res, formattedRoom, "Oda başarıyla güncellendi");
    } catch (error) {
      next(error);
    }
  }

  async deleteRoom(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId } = req.params;
      await roomService.deleteRoom(roomId, req.user.id);
      sendSuccessResponse(res, null, "Oda başarıyla silindi");
    } catch (error) {
      next(error);
    }
  }

  async toggleArchiveRoom(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId } = req.params;
      const { archived } = req.body;
      const room = await roomService.toggleArchiveRoom(
        roomId,
        req.user.id,
        archived
      );
      const formattedRoom = RoomFormatter.formatRoomDetails(room, req.user.id); // FORMATTER KULLAN
      const message = archived
        ? "Oda başarıyla arşivlendi"
        : "Oda arşivden çıkarıldı";
      sendSuccessResponse(res, formattedRoom, message);
    } catch (error) {
      next(error);
    }
  }

  async getRoomMembers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { roomId } = req.params;

      await roomService.getRoomById(roomId, req.user.id);

      const members = await roomService.getRoomMembers(roomId);
      const formattedMembers = RoomFormatter.formatRoomMembers(members); 
      sendSuccessResponse(
        res,
        formattedMembers,
        "Oda üyeleri başarıyla getirildi"
      );
    } catch (error) {
      next(error);
    }
  }
}

export const roomController = new RoomController();