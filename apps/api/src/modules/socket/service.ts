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
        origin: process.env.API_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    this.setupMiddleware();
    this.setupEvents();
  }

  private setupMiddleware() {
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

      this.userSockets.set(userId, socket.id);
      this.setUserOnline(userId, true);

      this.joinUserRooms(socket, userId);

      socket.on("join_room", (roomId) => this.handleJoinRoom(socket, roomId));
      socket.on("leave_room", (roomId) => this.handleLeaveRoom(socket, roomId));
      socket.on("typing_start", (data) => this.handleTypingStart(socket, data));
      socket.on("typing_stop", (data) => this.handleTypingStop(socket, data));
      socket.on("message_sent", (data) => this.handleMessageSent(socket, data));

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
    console.log("join_room: kullanıcı odaya girdi", roomId);
    socket.join(roomId);
  }

  private handleLeaveRoom(socket: any, roomId: string) {
    console.log("leave_room: kullanıcı odadan ayrıldı", roomId);
    socket.leave(roomId);
  }

  private handleTypingStart(socket: any, data: { roomId: string }) {
    console.log("typing_start: kullanıcı yazıyor", data);
    socket.to(data.roomId).emit("user_typing", {
      userId: socket.data.userId,
      username: socket.data.user.username,
      roomId: data.roomId,
    });
  }

  private handleTypingStop(socket: any, data: { roomId: string }) {
    console.log("typing_stop: kullanıcı yazmayı bıraktı", data);
    socket.to(data.roomId).emit("user_stop_typing", {
      userId: socket.data.userId,
      roomId: data.roomId,
    });
  }

  private handleMessageSent(socket: any, message: any) {
    console.log("message_sent: mesaj gönderildi", message);
    socket.to(message.roomId).emit("new_message", message);
  }

  public emitToRoom(roomId: string, event: string, data: any) {
    console.log("emitToRoom: odaya mesaj gönderildi", roomId, event, data);
    this.io.to(roomId).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any) {
    console.log(
      "emitToUser: kullanıcıya mesaj gönderildi",
      userId,
      event,
      data
    );
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
      console.log("setUserOnline: kullanıcı online", userId);
      console.log("userSockets: kullanıcılar", this.userSockets);
    } else {
      await cache.removeFromSet("online_users", userId);
      await cache.setValue(
        `user:${userId}:last_seen`,
        new Date().toISOString()
      );
      console.log("setUserOnline: kullanıcı offline", userId);
      console.log("userSockets: kullanıcılar", this.userSockets);
    }
  }

  public async getOnlineUsers(): Promise<string[]> {
    console.log(
      "getOnlineUsers: çevrimiçi kullanıcılar",
      await cache.getSetMembers("online_users")
    );
    return await cache.getSetMembers("online_users");
  }
}

export let socketService: SocketService;

export const initializeSocket = (httpServer: HttpServer) => {
  socketService = new SocketService(httpServer);
  return socketService;
};
