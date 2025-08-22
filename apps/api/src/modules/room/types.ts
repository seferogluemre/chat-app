import { Room, User } from '@prisma/client';

export interface RoomWithDetails extends Room {
  createdBy: Pick<User, 'id' | 'username' | 'firstName' | 'lastName' | 'profileImage'>;
  memberships: Array<{
    user: Pick<User, 'id' | 'username' | 'firstName' | 'lastName' | 'profileImage'>;
    joinedAt: Date;
    isActive: boolean;
  }>;
  _count: {
    memberships: number;
    messages: number;
  };
}

export interface RoomListItem {
  id: string;
  name: string | null;
  description: string | null;
  isDM: boolean;
  isPrivate: boolean;
  isArchived: boolean;
  roomImage: string | null;
  maxMembers: number | null;
  memberCount: number;
  lastMessageAt?: Date;
  lastMessage?: {
    content: string;
    senderName: string;
  };
  unreadCount?: number;
  createdAt: Date;
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
  isPrivate: boolean;
  maxMembers?: number;
  roomImage?: string;
  memberIds?: string[];
}

export interface UpdateRoomPayload {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  maxMembers?: number;
  roomImage?: string;
}

export interface CreateDMPayload {
  participantId: string; 
}

export interface RoomSearchFilters {
  query?: string;
  isPrivate?: boolean;
  isArchived?: boolean;
  createdById?: string;
  memberCount?: {
    min?: number;
    max?: number;
  };
  sortBy?: 'name' | 'memberCount' | 'createdAt' | 'lastMessageAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RoomMember {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  joinedAt: Date;
  isActive: boolean;
  role?: {
    name: string;
    slug: string;
    permissions: string[];
  };
}

export interface RoomStats {
  totalRooms: number;
  publicRooms: number;
  privateRooms: number;
  dmRooms: number;
  archivedRooms: number;
  averageMembersPerRoom: number;
  mostActiveRoom?: {
    id: string;
    name: string;
    messageCount: number;
  };
}

export interface PaginatedRooms {
  rooms: RoomListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}