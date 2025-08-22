import prisma from '@/core/prisma';
import { ForbiddenError, UnauthorizedError } from '@/utils/http-errors';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userHasPermission } from './helpers';
import {
  PermissionIdentifier,
  UserWithPermissions
} from './types';

export interface AuthenticatedRequest extends Request {
  user: UserWithPermissions;
  roomId?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token gerekli');
    }

    const token = authHeader.substring(7); 
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string; 
      sessionId: string; 
    };
    
    const session = await prisma.session.findUnique({
      where: { 
        id: decoded.sessionId,
        userId: decoded.userId,
        expiresAt: { gt: new Date() } 
      }
    });

    if (!session) {
      throw new UnauthorizedError('Session süresi dolmuş veya geçersiz');
    }
    
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true,
        deletedAt: null
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                permissions: true,
                isGlobal: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedError('Kullanıcı bulunamadı');
    }

    if (user.isBanned && (!user.banExpiresAt || user.banExpiresAt > new Date())) {
      throw new ForbiddenError('Hesabınız yasaklanmış');
    }

    req.user = user as UserWithPermissions;
    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Geçersiz token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token süresi dolmuş'));
    }
    next(error);
  }
};

export const requirePermission = (
  permission: PermissionIdentifier,
  options?: {
    requireRoomAccess?: boolean;
    roomIdParam?: string;
  }
) => {
  return async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> => {
    try {
      let roomId: string | undefined;

      if (options?.requireRoomAccess) {
        const paramName = options.roomIdParam || 'roomId';
        roomId = req.params[paramName] || req.body[paramName] || req.query[paramName] as string;
        
        if (!roomId) {
          throw new ForbiddenError('Room ID gerekli');
        }
        
        req.roomId = roomId;
      }

      const hasPermission = await userHasPermission(req.user, permission, roomId);
      
      if (!hasPermission) {
        throw new ForbiddenError('Bu işlem için yetkiniz yok');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireRoomMembership = (roomIdParam: string = 'roomId') => {
  return async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> => {
    try {
      const roomId = req.params[roomIdParam] || req.body[roomIdParam] || req.query[roomIdParam] as string;
      
      if (!roomId) {
        throw new ForbiddenError('Room ID gerekli');
      }

      const membership = await prisma.membership.findUnique({
        where: {
          userId_roomId: {
            userId: req.user.id,
            roomId: roomId
          }
        }
      });

      if (!membership || !membership.isActive) {
        throw new ForbiddenError('Bu odaya erişim yetkiniz yok');
      }

      req.roomId = roomId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAdmin = requirePermission('admin:panel-access');

export const requireRoomOwnership = (roomIdParam: string = 'roomId') => {
  return async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> => {
    try {
      const roomId = req.params[roomIdParam] as string;
      
      if (!roomId) {
        throw new ForbiddenError('Room ID gerekli');
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { createdById: true }
      });

      if (!room) {
        throw new ForbiddenError('Oda bulunamadı');
      }

      if (room.createdById !== req.user.id) {
        throw new ForbiddenError('Bu odanın sahibi değilsiniz');
      }

      req.roomId = roomId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Self or Admin Middleware
 * Kendi bilgilerini veya admin yetkisi olanlar erişebilir
 */
export const requireSelfOrAdmin = (userIdParam: string = 'userId') => {
  return async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> => {
    try {
      const targetUserId = req.params[userIdParam] as string;
      
      // Kendi bilgileri mi?
      if (req.user.id === targetUserId) {
        return next();
      }

      // Admin yetkisi var mı?
      const hasAdminPermission = await userHasPermission(req.user, 'admin:user-management');
      if (!hasAdminPermission) {
        throw new ForbiddenError('Bu işlem için yetkiniz yok');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};