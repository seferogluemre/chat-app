import prisma from '@/core/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/http-errors';
import {
  CreateDMPayload,
  CreateRoomPayload,
  PaginatedRooms,
  RoomListItem,
  RoomMember,
  RoomSearchFilters,
  RoomWithDetails,
  UpdateRoomPayload
} from './types';

export class RoomService {
  async getUserRooms(userId: string): Promise<RoomListItem[]> {
    const rooms = await prisma.room.findMany({
      where: {
        memberships: {
          some: {
            userId,
            isActive: true
          }
        },
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            memberships: {
              where: { isActive: true }
            },
            messages: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
            sender: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: [
        { messages: { _count: 'desc' } }, // Son mesaj olan odalar önce
        { createdAt: 'desc' }
      ]
    });

    return rooms.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      isDM: room.isDM,
      isPrivate: room.isPrivate,
      isArchived: room.isArchived,
      roomImage: room.roomImage,
      maxMembers: room.maxMembers,
      memberCount: room._count.memberships,
      lastMessageAt: room.messages[0]?.createdAt,
      lastMessage: room.messages[0] ? {
        content: room.messages[0].content,
        senderName: `${room.messages[0].sender.firstName} ${room.messages[0].sender.lastName}`
      } : undefined,
      createdAt: room.createdAt
    }));
  }

  async getPublicRooms(filters: RoomSearchFilters): Promise<PaginatedRooms> {
    const { page = 1, limit = 20, query, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const skip = (page - 1) * limit;

    const where = {
      isPrivate: false,
      isArchived: false,
      isDM: false,
      deletedAt: null,
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { description: { contains: query, mode: 'insensitive' as const } }
        ]
      })
    };

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: {
          _count: {
            select: {
              memberships: { where: { isActive: true } },
              messages: true
            }
          }
        },
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        skip,
        take: limit
      }),
      prisma.room.count({ where })
    ]);

    const roomList: RoomListItem[] = rooms.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      isDM: room.isDM,
      isPrivate: room.isPrivate,
      isArchived: room.isArchived,
      roomImage: room.roomImage,
      maxMembers: room.maxMembers,
      memberCount: room._count.memberships,
      createdAt: room.createdAt
    }));

    return {
      rooms: roomList,
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

  /**
   * Oda detayı getir
   */
  async getRoomById(roomId: string, userId: string): Promise<RoomWithDetails> {
    const room = await prisma.room.findUnique({
      where: { id: roomId, deletedAt: null },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        memberships: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        },
        _count: {
          select: {
            memberships: { where: { isActive: true } },
            messages: true
          }
        }
      }
    });

    if (!room) {
      throw new NotFoundError('Oda bulunamadı');
    }

    // Kullanıcının bu odaya erişimi var mı kontrol et
    const membership = await prisma.membership.findUnique({
      where: {
        userId_roomId: { userId, roomId }
      }
    });

    if (!membership || !membership.isActive) {
      if (room.isPrivate) {
        throw new ForbiddenError('Bu odaya erişim yetkiniz yok');
      }
    }

    return room as RoomWithDetails;
  }

  /**
   * Yeni oda oluştur
   */
  async createRoom(userId: string, payload: CreateRoomPayload): Promise<RoomWithDetails> {
    const { name, description, isPrivate, maxMembers, roomImage, memberIds = [] } = payload;

    // DM değil ama isim yoksa hata
    if (!name && !isPrivate) {
      throw new BadRequestError('Public odalar için isim gereklidir');
    }

    const room = await prisma.$transaction(async (tx) => {
      // Oda oluştur
      const newRoom = await tx.room.create({
        data: {
          name,
          description,
          isPrivate,
          maxMembers,
          roomImage,
          isDM: false,
          createdById: userId
        }
      });

      // Oluşturan kişiyi üye yap
      await tx.membership.create({
        data: {
          userId,
          roomId: newRoom.id,
          isActive: true
        }
      });

      // Diğer üyeleri ekle (varsa)
      if (memberIds.length > 0) {
        const memberships = memberIds
          .filter((id: string) => id !== userId) 
          .map((memberId: string) => ({
            userId: memberId,
            roomId: newRoom.id,
            isActive: true
          }));

        if (memberships.length > 0) {
          await tx.membership.createMany({
            data: memberships,
            skipDuplicates: true
          });
        }
      }

      return newRoom;
    });

    // Oluşturulan odayı detaylarıyla döndür
    return await this.getRoomById(room.id, userId);
  }

  /**
   * DM odası oluştur
   */
  async createDMRoom(userId: string, payload: CreateDMPayload): Promise<RoomWithDetails> {
    const { participantId } = payload;

    if (userId === participantId) {
      throw new BadRequestError('Kendinizle DM oluşturamazsınız');
    }

    // Var olan DM kontrolü
    const existingDM = await prisma.room.findFirst({
      where: {
        isDM: true,
        deletedAt: null,
        memberships: {
          every: {
            userId: { in: [userId, participantId] },
            isActive: true
          }
        },
        _count: {
          memberships: { equals: 2 }
        }
      }
    });

    if (existingDM) {
      return await this.getRoomById(existingDM.id, userId);
    }

    // Yeni DM oluştur
    const dmRoom = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          name: null,
          isDM: true,
          isPrivate: true,
          createdById: userId
        }
      });

      // Her iki kullanıcıyı da üye yap
      await tx.membership.createMany({
        data: [
          { userId, roomId: newRoom.id, isActive: true },
          { userId: participantId, roomId: newRoom.id, isActive: true }
        ]
      });

      return newRoom;
    });

    return await this.getRoomById(dmRoom.id, userId);
  }

  /**
   * Oda güncelle
   */
  async updateRoom(roomId: string, userId: string, payload: UpdateRoomPayload): Promise<RoomWithDetails> {
    const room = await prisma.room.findUnique({
      where: { id: roomId, deletedAt: null }
    });

    if (!room) {
      throw new NotFoundError('Oda bulunamadı');
    }

    if (room.createdById !== userId) {
      throw new ForbiddenError('Bu odayı sadece oluşturan kişi düzenleyebilir');
    }

    if (room.isDM) {
      throw new BadRequestError('DM odaları düzenlenemez');
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...payload,
        updatedAt: new Date()
      }
    });

    return await this.getRoomById(updatedRoom.id, userId);
  }

  /**
   * Oda sil
   */
  async deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = await prisma.room.findUnique({
      where: { id: roomId, deletedAt: null }
    });

    if (!room) {
      throw new NotFoundError('Oda bulunamadı');
    }

    if (room.createdById !== userId) {
      throw new ForbiddenError('Bu odayı sadece oluşturan kişi silebilir');
    }

    // Soft delete
    await prisma.room.update({
      where: { id: roomId },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Oda arşivle/arşivden çıkar
   */
  async toggleArchiveRoom(roomId: string, userId: string, archived: boolean): Promise<RoomWithDetails> {
    const room = await prisma.room.findUnique({
      where: { id: roomId, deletedAt: null }
    });

    if (!room) {
      throw new NotFoundError('Oda bulunamadı');
    }

    if (room.createdById !== userId) {
      throw new ForbiddenError('Bu odayı sadece oluşturan kişi arşivleyebilir');
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        isArchived: archived,
        updatedAt: new Date()
      }
    });

    return await this.getRoomById(updatedRoom.id, userId);
  }

  /**
   * Oda üyelerini getir
   */
  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const members = await prisma.membership.findMany({
      where: {
        roomId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    return members.map(member => ({
      id: member.userId,
      username: member.user.username,
      firstName: member.user.firstName,
      lastName: member.user.lastName, 
      profileImage: member.user.profileImage,
      joinedAt: member.joinedAt,
      isActive: member.isActive
    }));
  }

  /**
   * Order by helper
   */
  private buildOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    switch (sortBy) {
      case 'name':
        return { name: order };
      case 'memberCount':
        return { memberships: { _count: order } };
      case 'lastMessageAt':
        return { messages: { _count: order } };
      default:
        return { createdAt: order };
    }
  }
}

export const roomService = new RoomService();