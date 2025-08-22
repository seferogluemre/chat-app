import { RoomListItem, RoomMember, RoomWithDetails } from "./types";

export class RoomFormatter {
  static formatRoomList(rooms: RoomListItem[]) {
    return rooms.map((room) => ({
      id: room.id,
      name: room.isDM ? null : room.name,
      description: room.description,
      type: room.isDM ? "dm" : room.isPrivate ? "private" : "public",
      isArchived: room.isArchived,
      roomImage: room.roomImage,
      memberCount: room.memberCount,
      maxMembers: room.maxMembers,
      lastMessage: room.lastMessage
        ? {
            content:
              room.lastMessage.content.length > 100
                ? room.lastMessage.content.substring(0, 100) + "..."
                : room.lastMessage.content,
            senderName: room.lastMessage.senderName,
            timestamp: room.lastMessageAt,
          }
        : null,
      unreadCount: room.unreadCount || 0,
      createdAt: room.createdAt,
    }));
  }

  static formatRoomDetails(room: RoomWithDetails, currentUserId: string) {
    return {
      id: room.id,
      name: room.isDM ? null : room.name,
      description: room.description,
      type: room.isDM ? "dm" : room.isPrivate ? "private" : "public",
      isArchived: room.isArchived,
      roomImage: room.roomImage,
      maxMembers: room.maxMembers,
      settings: {
        canEdit: room.createdById === currentUserId,
        canDelete: room.createdById === currentUserId,
        canInvite: !room.isDM,
        canArchive: room.createdById === currentUserId,
      },
      creator: {
        id: room.createdBy.id,
        username: room.createdBy.username,
        name: `${room.createdBy.firstName} ${room.createdBy.lastName}`,
        profileImage: room.createdBy.profileImage,
      },
      stats: {
        memberCount: room._count.memberships,
        messageCount: room._count.messages,
      },
      members: room.memberships.map((membership) => ({
        id: membership.user.id,
        username: membership.user.username,
        name: `${membership.user.firstName} ${membership.user.lastName}`,
        profileImage: membership.user.profileImage,
        joinedAt: membership.joinedAt,
      })),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  static formatRoomMembers(members: RoomMember[]) {
    return members.map((member) => ({
        id: member.id,
        username: member.username,
        name: `${member.firstName} ${member.lastName}`,
        profileImage: member.profileImage,
        joinedAt: member.joinedAt,
        isActive: member.isActive,
        role: member.role
          ? {
              name: member.role.name,
              permissions: member.role.permissions,
            }
          : null,
      }));
  }

  static generateDMRoomName(participants: Array<{ firstName: string; lastName: string }>) {
    return participants.map((p) => `${p.firstName} ${p.lastName}`).join(", ");
  }
}