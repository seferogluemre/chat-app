export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  profileImage?: string;
  bio?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: ApiUser;
  token: string;
  expiresAt: string;
}

export interface ApiRoom {
  id: string;
  name?: string;
  description?: string;
  type: "public" | "private" | "dm";
  isArchived: boolean;
  roomImage?: string;
  memberCount: number;
  maxMembers?: number;
  lastMessage?: {
    content: string;
    senderName: string;
    timestamp: string;
  };
  unreadCount?: number;
  createdAt: string;
}

export interface ApiMessage {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
    profileImage?: string;
  };
  roomId: string;
  isEdited: boolean;
  isPinned: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  status: string;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}
