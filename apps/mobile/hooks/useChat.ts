import { useSocket } from '@/context/socket-context';
import { ApiMessage, MessageService } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

export const useChat = (roomId: string) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; username: string }>>([]);

  // Room'a katıl ve mesajları yükle
  useEffect(() => {
    if (!roomId) return;

    loadMessages();
    
    if (socket) {
      socket.emit('join_room', roomId);
    }

    return () => {
      if (socket) {
        socket.emit('leave_room', roomId);
      }
    };
  }, [roomId, socket]);

  // Socket event'lerini dinle
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message: ApiMessage) => {
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Typing events
    socket.on('user_typing', ({ userId, username, roomId: eventRoomId }) => {
      if (eventRoomId === roomId) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.userId === userId)) {
            return [...prev, { userId, username }];
          }
          return prev;
        });
      }
    });

    socket.on('user_stop_typing', ({ userId, roomId: eventRoomId }) => {
      if (eventRoomId === roomId) {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket, roomId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await MessageService.getRoomMessages(roomId, {
        limit: 50,
        sortOrder: 'asc'
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string): Promise<boolean> => {
    try {
      const message = await MessageService.sendMessage({
        roomId,
        content
      });

      setMessages(prev => [...prev, message]);

      if (socket) {
        socket.emit('message_sent', message);
      }

      return true;
    } catch (error) {
      console.error('Send message error:', error);
      return false;
    }
  };

  const startTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('typing_start', { roomId });
    }
  }, [socket, isConnected, roomId]);

  const stopTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { roomId });
    }
  }, [socket, isConnected, roomId]);

  return {
    messages,
    loading,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    loadMessages,
    isConnected
  };
};