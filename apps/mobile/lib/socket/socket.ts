import { io, Socket } from 'socket.io-client';
import { StorageService } from '../storage/storage';
import { SocketMessage, TypingData, UserStatusData } from '../types/api';
import { API_CONFIG } from '../utils/constants';

export interface SocketEvents {
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;

  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;

  new_message: (message: SocketMessage) => void;
  message_updated: (message: SocketMessage) => void;
  message_deleted: (messageId: string) => void;
  message_pinned: (message: SocketMessage) => void;

  user_typing: (data: TypingData) => void;
  user_stop_typing: (data: { userId: string; roomId: string }) => void;

  // Room events
  room_updated: (room: any) => void;
  member_joined: (data: { userId: string; roomId: string }) => void;
  member_left: (data: { userId: string; roomId: string }) => void;
}

export class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<Socket> {
    const token = await StorageService.getToken();
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    this.socket = io(API_CONFIG.SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();

    return new Promise((resolve, reject) => {
      this.socket!.on('connect', () => {
        console.log('✅ Socket connected');
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket!.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error(`Connection failed after ${this.maxReconnectAttempts} attempts`));
        }
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected');
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
    });
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    this.socket?.on(event, callback);
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  joinRoom(roomId: string): void {
    this.emit('join_room', roomId);
  }

  leaveRoom(roomId: string): void {
    this.emit('leave_room', roomId);
  }

  startTyping(roomId: string): void {
    this.emit('typing_start', { roomId });
  }

  stopTyping(roomId: string): void {
    this.emit('typing_stop', { roomId });
  }

  messageSent(message: any): void {
    this.emit('message_sent', message);
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketClient = new SocketClient();