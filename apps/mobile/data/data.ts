import { Message, Room, User } from "../types/chat";

export const mockUsers: User[] = [
  {
    id: "1",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    profileImage:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
    bio: "Software Developer",
    isOnline: true,
  },
  {
    id: "2",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Smith",
    username: "janesmith",
    profileImage:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    bio: "UI/UX Designer",
    isOnline: true,
  },
  {
    id: "3",
    email: "mike@example.com",
    firstName: "Mike",
    lastName: "Johnson",
    username: "mikej",
    profileImage:
      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
    bio: "Product Manager",
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: "4",
    email: "sarah@example.com",
    firstName: "Sarah",
    lastName: "Wilson",
    username: "sarahw",
    profileImage:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
    bio: "Marketing Specialist",
    isOnline: true,
  },
];

export const mockRooms: Room[] = [
  {
    id: "1",
    name: "Development Team",
    isDM: false,
    createdAt: new Date("2024-01-15"),
    unreadCount: 3,
    participants: [mockUsers[0], mockUsers[1], mockUsers[2]],
  },
  {
    id: "2",
    isDM: true,
    createdAt: new Date("2024-01-20"),
    unreadCount: 1,
    participants: [mockUsers[1]],
  },
  {
    id: "3",
    name: "Marketing Team",
    isDM: false,
    createdAt: new Date("2024-01-10"),
    unreadCount: 0,
    participants: [mockUsers[3], mockUsers[0]],
  },
  {
    id: "4",
    isDM: true,
    createdAt: new Date("2024-01-25"),
    unreadCount: 0,
    participants: [mockUsers[2]],
  },
];

export const mockMessages: { [roomId: string]: Message[] } = {
  "1": [
    {
      id: "1",
      roomId: "1",
      senderId: "1",
      content: "Hey everyone! How is the project going?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      sender: mockUsers[0],
    },
    {
      id: "2",
      roomId: "1",
      senderId: "2",
      content: "Pretty good! Just finished the design mockups.",
      createdAt: new Date(Date.now() - 1000 * 60 * 50), // 50 minutes ago
      sender: mockUsers[1],
    },
    {
      id: "3",
      roomId: "1",
      senderId: "3",
      content: "Great work Jane! I'll review them tomorrow.",
      createdAt: new Date(Date.now() - 1000 * 60 * 40), // 40 minutes ago
      sender: mockUsers[2],
    },
  ],
  "2": [
    {
      id: "4",
      roomId: "2",
      senderId: "2",
      content: "Hi! Are you available for a quick call?",
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      sender: mockUsers[1],
    },
    {
      id: "5",
      roomId: "2",
      senderId: "1",
      content: "Sure! Let me join in 5 minutes.",
      createdAt: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
      sender: mockUsers[0],
    },
  ],
  "3": [
    {
      id: "6",
      roomId: "3",
      senderId: "4",
      content: "The new campaign is ready for review!",
      createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      sender: mockUsers[3],
    },
  ],
  "4": [
    {
      id: "7",
      roomId: "4",
      senderId: "3",
      content: "Thanks for the feedback on the roadmap.",
      createdAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
      sender: mockUsers[2],
    },
  ],
};

// Update rooms with last messages
mockRooms.forEach((room) => {
  const roomMessages = mockMessages[room.id];
  if (roomMessages && roomMessages.length > 0) {
    room.lastMessage = roomMessages[roomMessages.length - 1];
  }
});

export const currentUser: User = {
  id: "current",
  email: "me@example.com",
  firstName: "Me",
  lastName: "User",
  username: "meuser",
  profileImage:
    "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150",
  bio: "Chat App User",
  isOnline: true,
};
