import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { Socket } from "socket.io-client";
import { ErrorHandler } from "../lib/utils/toast";
import { socketClient } from "../lib/socket/socket";
import { useAuth } from "./auth-context";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  connect: () => Promise<void>;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user]);

  const connect = async (): Promise<void> => {
    try {
      if (socket?.connected) return;

      const newSocket = await socketClient.connect();
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("✅ Socket connected in context");
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("🔌 Socket disconnected in context");
        setIsConnected(false);
      });

      newSocket.on("user_online", (userId: string) => {
        console.log("👤 User online:", userId);
        setOnlineUsers((prev) => {
          if (!prev.includes(userId)) {
            return [...prev, userId];
          }
          return prev;
        });
      });

      newSocket.on("user_offline", (userId: string) => {
        console.log("👤 User offline:", userId);
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ Socket connection error in context:", error);
        ErrorHandler.showSocketError(error);
        setIsConnected(false);
      });
    } catch (error) {
      console.error("Socket connection failed:", error);
      ErrorHandler.showSocketError(error);
      setIsConnected(false);
    }
  };

  const disconnect = (): void => {
    if (socket) {
      socketClient.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    }
  };

  const joinRoom = (roomId: string): void => {
    socketClient.joinRoom(roomId);
  };
  const leaveRoom = (roomId: string): void => {
    socketClient.leaveRoom(roomId);
  };

  const startTyping = (roomId: string): void => {
    socketClient.startTyping(roomId);
  };

  const stopTyping = (roomId: string): void => {
    socketClient.stopTyping(roomId);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
