import { Message, Room, User } from "@prisma/client";

export interface MessageWithDetails extends Message {
  sender: Pick<
    User,
    "id" | "username" | "firstName" | "lastName" | "profileImage"
  >;
  room: Pick<Room, "id" | "name" | "isDM">;
  replyTo?: {
    id: string;
    content: string;
    sender: Pick<User, "id" | "username" | "firstName" | "lastName">;
  };
  replies?: Array<{
    id: string;
    content: string;
    sender: Pick<User, "id" | "username" | "firstName" | "lastName">;
    createdAt: Date;
  }>;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: Array<Pick<User, "id" | "username">>;
  }>;
}

export interface MessageListItem {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
    profileImage: string | null;
  };
  roomId: string;
  isEdited: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  replyToId?: string | null;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessagePayload {
  roomId: string;
  content: string;
  replyToId?: string;
  attachments?: Array<{
    url: string;
    type: "image" | "file" | "video";
    name: string;
    size: number;
  }>;
}

export interface UpdateMessagePayload {
  content: string;
}

export interface MessageFilters {
  roomId: string;
  search?: string;
  senderId?: string;
  isPinned?: boolean;
  hasAttachments?: boolean;
  after?: Date; // Messages after this date
  before?: Date; // Messages before this date
  replyToId?: string; // Get replies to specific message
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedMessages {
  messages: MessageListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  pinnedMessages?: MessageListItem[];
}

export interface MessageReactionPayload {
  emoji: string;
  action: "add" | "remove";
}

export interface MessageStats {
  totalMessages: number;
  messagesThisWeek: number;
  mostActiveRoom: {
    id: string;
    name: string;
    messageCount: number;
  };
  topSenders: Array<{
    userId: string;
    username: string;
    fullName: string;
    messageCount: number;
  }>;
}

export interface MessageSearchResult {
  message: MessageListItem;
  room: {
    id: string;
    name: string;
    isDM: boolean;
  };
  context: {
    beforeMessages: MessageListItem[];
    afterMessages: MessageListItem[];
  };
}

export interface MessageEvent {
  type:
    | "message_sent"
    | "message_updated"
    | "message_deleted"
    | "message_pinned"
    | "reaction_added"
    | "reaction_removed";
  message: MessageListItem;
  roomId: string;
  userId: string;
}
