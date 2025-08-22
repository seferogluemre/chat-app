import prisma from '@/core/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/http-errors';
import {
  MessageFilters,
  MessageListItem,
  MessageReactionPayload,
  PaginatedMessages,
  SendMessagePayload,
  UpdateMessagePayload
} from './types';

export class MessageService {       
  async getRoomMessages(filters: MessageFilters, userId: string): Promise<PaginatedMessages> {
    const { 
      roomId, 
      page = 1, 
      limit = 50, 
      search, 
      senderId, 
      isPinned, 
      after, 
      before,
      replyToId,
      sortOrder = 'desc' 
    } = filters;

    // Room üyeliğini kontrol et
    await this.checkRoomMembership(userId, roomId);

    const skip = (page - 1) * limit;

    const where = {
      roomId,
      isDeleted: false,
      ...(search && {
        content: { contains: search, mode: 'insensitive' as const }
      }),
      ...(senderId && { senderId }),
      ...(isPinned !== undefined && { isPinned }),
      ...(after && { createdAt: { gte: after } }),
      ...(before && { createdAt: { lte: before } }),
      ...(replyToId && { replyToId })
    };

    const orderBy = { createdAt: sortOrder };

    const [messages, total, pinnedMessages] = await Promise.all([
      // Regular messages
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              fullName: true,
              profileImage: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      
      // Total count
      prisma.message.count({ where }),
      
      // Pinned messages (always show at top)
      isPinned === undefined ? prisma.message.findMany({
        where: {
          roomId,
          isDeleted: false,
          isPinned: true
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              fullName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // Max 10 pinned messages
      }) : []
    ]);

    const formattedMessages = messages.map(msg => this.formatMessage(msg, userId));
    const formattedPinnedMessages = pinnedMessages.map(msg => this.formatMessage(msg, userId));

    return {
      messages: formattedMessages,
      pinnedMessages: formattedPinnedMessages.length > 0 ? formattedPinnedMessages : undefined,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  async sendMessage(userId: string, payload: SendMessagePayload): Promise<MessageListItem> {
    const { roomId, content, replyToId, attachments } = payload;

    // Room üyeliğini kontrol et
    await this.checkRoomMembership(userId, roomId);

    // Reply mesajı varsa kontrol et
    if (replyToId) {
      const replyMessage = await prisma.message.findFirst({
        where: {
          id: replyToId,
          roomId,
          isDeleted: false
        }
      });

      if (!replyMessage) {
        throw new BadRequestError('Yanıtlanacak mesaj bulunamadı');
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        roomId,
        replyToId,
        // attachments: attachments ? JSON.stringify(attachments) : null
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            fullName: true,
            profileImage: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    return this.formatMessage(message, userId);
  }

  async updateMessage(messageId: string, userId: string, payload: UpdateMessagePayload): Promise<MessageListItem> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { room: true }
    });

    if (!message || message.isDeleted) {
      throw new NotFoundError('Mesaj bulunamadı');
    }

    // Sadece kendi mesajını düzenleyebilir
    if (message.senderId !== userId) {
      throw new ForbiddenError('Sadece kendi mesajınızı düzenleyebilirsiniz');
    }

    // 24 saat geçmişse düzenleme yapılamaz
    const hoursPassed = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursPassed > 24) {
      throw new BadRequestError('24 saatten eski mesajlar düzenlenemez');
    }

    // Room üyeliğini kontrol et
    await this.checkRoomMembership(userId, message.roomId);

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: payload.content,
        isEdited: true,
        updatedAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            fullName: true,
            profileImage: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    return this.formatMessage(updatedMessage, userId);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { 
        room: true,
        sender: true
      }
    });

    if (!message || message.isDeleted) {
      throw new NotFoundError('Mesaj bulunamadı');
    }

    // Room üyeliğini kontrol et
    await this.checkRoomMembership(userId, message.roomId);

    // Kendi mesajı veya admin yetkisi kontrolü
    const canDelete = message.senderId === userId || await this.hasMessageDeletePermission(userId, message.roomId);
    
    if (!canDelete) {
      throw new ForbiddenError('Bu mesajı silme yetkiniz yok');
    }

    // Soft delete
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: '[Bu mesaj silindi]',
        updatedAt: new Date()
      }
    });
  }

  async togglePinMessage(messageId: string, userId: string, pinned: boolean): Promise<MessageListItem> {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message || message.isDeleted) {
      throw new NotFoundError('Mesaj bulunamadı');
    }

    // Room üyeliğini kontrol et
    await this.checkRoomMembership(userId, message.roomId);

    const canPin = await this.hasMessagePinPermission(userId, message.roomId);
    if (!canPin) {
      throw new ForbiddenError('Mesaj pinleme yetkiniz yok');
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { 
        isPinned: pinned,
        updatedAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            fullName: true,
            profileImage: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    return this.formatMessage(updatedMessage, userId);
  }

  async toggleReaction(messageId: string, userId: string, payload: MessageReactionPayload): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message || message.isDeleted) {
      throw new NotFoundError('Mesaj bulunamadı');
    }

    // Room üyeliğini kontrol et
    await this.checkRoomMembership(userId, message.roomId);

    // Bu feature için ayrı bir Reaction tablosu oluşturulabilir
    // Şimdilik basit implementation
    // TODO: Implement reactions with separate table
    
    console.log(`User ${userId} ${payload.action} reaction ${payload.emoji} to message ${messageId}`);
  }

  private async checkRoomMembership(userId: string, roomId: string): Promise<void> {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_roomId: { userId, roomId }
      }
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenError('Bu odaya erişim yetkiniz yok');
    }
  }

  private async hasMessageDeletePermission(userId: string, roomId: string): Promise<boolean> {
    // Global admin kontrolü
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) return false;

    // Global admin veya message delete permission
    const hasGlobalPermission = user.userRoles.some(userRole => {
      if (!userRole.role.isGlobal) return false;
      const permissions = userRole.role.permissions as string[];
      return permissions.includes('*') || permissions.includes('messages:delete-any');
    });

    if (hasGlobalPermission) return true;

    // Room-specific admin/moderator kontrolü
    const roomRole = user.userRoles.find(userRole => userRole.roomId === roomId);
    if (roomRole) {
      const permissions = roomRole.role.permissions as string[];
      return permissions.includes('*') || permissions.includes('messages:delete-any');
    }

    // Room creator kontrolü
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { createdById: true }
    });

    return room?.createdById === userId;
  }

  private async hasMessagePinPermission(userId: string, roomId: string): Promise<boolean> {
    // Global admin kontrolü
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) return false;

    // Global admin veya message pin permission
    const hasGlobalPermission = user.userRoles.some(userRole => {
      if (!userRole.role.isGlobal) return false;
      const permissions = userRole.role.permissions as string[];
      return permissions.includes('*') || permissions.includes('messages:pin');
    });

    if (hasGlobalPermission) return true;

    // Room-specific moderator kontrolü
    const roomRole = user.userRoles.find(userRole => userRole.roomId === roomId);
    if (roomRole) {
      const permissions = roomRole.role.permissions as string[];
      return permissions.includes('*') || permissions.includes('messages:pin');
    }

    // Room creator kontrolü
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { createdById: true }
    });

    return room?.createdById === userId;
  }

  private formatMessage(message: any, currentUserId: string): MessageListItem {
    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        fullName: message.sender.fullName,
        profileImage: message.sender.profileImage
      },
      roomId: message.roomId,
      isEdited: message.isEdited,
      isPinned: message.isPinned,
      isDeleted: message.isDeleted,
      replyToId: message.replyToId,
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content.length > 100 
          ? message.replyTo.content.substring(0, 100) + '...'
          : message.replyTo.content,
        senderName: `${message.replyTo.sender.firstName} ${message.replyTo.sender.lastName}`
      } : undefined,
      // reactions: [], // TODO: Implement reactions
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
  }
}

export const messageService = new MessageService();