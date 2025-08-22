import prisma from "@/core/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/utils/http-errors";

export class MembershipService {
  async inviteMembers(inviterId: string, payload: any) {
    const { roomId, userIds } = payload;

    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: inviterId, roomId } },
      include: { room: true },
    });

    if (!membership?.isActive) {
      throw new ForbiddenError("Bu odaya üye davet etme yetkiniz yok");
    }

    await prisma.membership.createMany({
      data: userIds.map((userId: string) => ({
        userId,
        roomId,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }

  async kickMember(
    kickerId: string,
    roomId: string,
    targetUserId: string,
    reason?: string
  ) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundError("Oda bulunamadı");

    if (room.createdById !== kickerId) {
      throw new ForbiddenError("Bu işlem için yetkiniz yok");
    }

    if (kickerId === targetUserId) {
      throw new BadRequestError("Kendinizi çıkaramazsınız");
    }

    await prisma.membership.update({
      where: { userId_roomId: { userId: targetUserId, roomId } },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });
  }

  async leaveRoom(userId: string, roomId: string) {
    await prisma.membership.update({
      where: { userId_roomId: { userId, roomId } },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });
  }
}

export const membershipService = new MembershipService();
