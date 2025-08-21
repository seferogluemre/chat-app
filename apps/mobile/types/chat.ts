export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Room {
  id: string;
  name?: string;
  isDM: boolean;
  createdAt: Date;
  lastMessage?: Message;
  unreadCount?: number;
  participants?: User[];
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender?: User;
}

export interface Membership {
  userId: string;
  roomId: string;
  joinedAt: Date;
  user: User;
  room: Room;
}
