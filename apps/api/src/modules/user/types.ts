import { Role, User } from "@prisma/client";

// User with roles
export interface UserWithRoles extends User {
  userRoles: Array<{
    role: Pick<Role, "id" | "name" | "slug" | "permissions" | "isGlobal">;
    roomId?: string | null;
  }>;
}

// User profile (public info)
export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImage: string | null;
  bio: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  // Private fields (only for self/admin)
  email?: string;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: Date | null;
}

// User list item (lighter version)
export interface UserListItem {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImage: string | null;
  bio: string | null;
  emailVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  lastSeenAt?: Date;
  isOnline?: boolean;
  createdAt: Date;
}

// User search filters
export interface UserSearchFilters {
  query?: string;
  isActive?: boolean;
  isBanned?: boolean;
  emailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: "username" | "firstName" | "createdAt" | "lastSeenAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// User update payload (extended from auth)
export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  profileImage?: string;
  // Admin only fields
  email?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

// User ban payload
export interface BanUserPayload {
  reason: string;
  expiresAt?: Date | null; // null = permanent ban
  duration?: number; // days
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  verifiedUsers: number;
  onlineUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  mostActiveUsers: Array<{
    id: string;
    username: string;
    fullName: string;
    messageCount: number;
  }>;
}

export interface PaginatedUsers {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserOnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeenAt: Date;
  currentRoom?: string;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    mentions: boolean;
    directMessages: boolean;
  };
  privacy: {
    showEmail: boolean;
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
  };
  preferences: {
    theme: "light" | "dark" | "auto";
    language: string;
    timezone: string;
  };
}
