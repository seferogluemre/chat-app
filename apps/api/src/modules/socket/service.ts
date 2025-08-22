import cache from "@/core/cache";
import prisma from "@/core/prisma";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

export class SocketService {
  private io: Server;
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    this.setupMiddleware();
    this.setupEvents();
  }

  private setupMiddleware() {
    // Socket authentication
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) throw new Error("No token provided");

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user || !user.isActive) throw new Error("Invalid user");

        socket.data.userId = user.id;
        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });
  }

  private setupEvents() {
    this.io.on("connection", (socket) => {
      const userId = socket.data.userId;

      // User online status
      this.userSockets.set(userId, socket.id);
      this.setUserOnline(userId, true);

      // Join user rooms
      this.joinUserRooms(socket, userId);

      socket.on("join_room", (roomId) => this.handleJoinRoom(socket, roomId));
      socket.on("leave_room", (roomId) => this.handleLeaveRoom(socket, roomId));
      socket.on("typing_start", (data) => this.handleTypingStart(socket, data));
      socket.on("typing_stop", (data) => this.handleTypingStop(socket, data));
      socket.on("message_sent", (data) => this.handleMessageSent(socket, data));

      // Disconnect
      socket.on("disconnect", () => {
        this.userSockets.delete(userId);
        this.setUserOnline(userId, false);
      });
    });
  }

  private async joinUserRooms(socket: any, userId: string) {
    const memberships = await prisma.membership.findMany({
      where: { userId, isActive: true },
      select: { roomId: true },
    });

    memberships.forEach((membership) => {
      socket.join(membership.roomId);
    });
  }

  private handleJoinRoom(socket: any, roomId: string) {
    socket.join(roomId);
  }

  private handleLeaveRoom(socket: any, roomId: string) {
    socket.leave(roomId);
  }

  private handleTypingStart(socket: any, data: { roomId: string }) {
    socket.to(data.roomId).emit("user_typing", {
      userId: socket.data.userId,
      username: socket.data.user.username,
      roomId: data.roomId,
    });
  }

  private handleTypingStop(socket: any, data: { roomId: string }) {
    socket.to(data.roomId).emit("user_stop_typing", {
      userId: socket.data.userId,
      roomId: data.roomId,
    });
  }

  private handleMessageSent(socket: any, message: any) {
    // Broadcast new message to room members
    socket.to(message.roomId).emit("new_message", message);
  }

  // Public methods for emitting events
  public emitToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  private async setUserOnline(userId: string, isOnline: boolean) {
    if (isOnline) {
      await cache.addToSet("online_users", userId);
      await cache.setValue(
        `user:${userId}:last_seen`,
        new Date().toISOString()
      );
    } else {
      await cache.removeFromSet("online_users", userId);
      await cache.setValue(
        `user:${userId}:last_seen`,
        new Date().toISOString()
      );
    }
  }

  public async getOnlineUsers(): Promise<string[]> {
    return await cache.getSetMembers("online_users");
  }
}

export let socketService: SocketService;

export const initializeSocket = (httpServer: HttpServer) => {
  socketService = new SocketService(httpServer);
  return socketService;
};
