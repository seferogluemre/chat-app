import { ChatSkeleton } from '@/components/ui/SkeletonLoader';
import { useChat } from '@/hooks/useChat';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { RoomService } from '@/lib/api/services/rooms';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MoreVertical, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/auth-context';
import { ApiRoom } from '../../lib/types/api';

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { isConnected: isNetworkConnected } = useNetworkStatus();
  
  const { 
    messages, 
    loading, 
    typingUsers, 
    sendMessage, 
    startTyping, 
    stopTyping,
    isConnected 
  } = useChat(roomId!);

  const [inputText, setInputText] = useState('');
  const [room, setRoom] = useState<ApiRoom | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRoomDetails();
  }, [roomId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        stopTyping();
      }
    };
  }, [isTyping, stopTyping]);

  const loadRoomDetails = async () => {
    try {
      if (!roomId) return;
      const roomDetails = await RoomService.getRoomDetails(roomId);
      setRoom(roomDetails);
    } catch (error) {
      console.error('Load room details error:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const messageContent = inputText.trim();
    setInputText(''); 

    try {
      const success = await sendMessage(messageContent);
      if (!success) {
        setInputText(messageContent);
      }
    } catch (error) {
      console.error('Send message error:', error);
      setInputText(messageContent);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Typing logic
    if (text.length > 0 && !isTyping) {
      startTyping();
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        stopTyping();
        setIsTyping(false);
      }
    }, 1000);
  };

  /**
   * Room display name
   */
  const getRoomDisplayName = () => {
    if (!room) return 'Chat';
    
    if (room.type === 'dm') {
      return 'DM User'; 
    }
    
    return room.name || 'Unnamed Room';
  };

  const renderMessage = ({ item: message }: { item: any }) => {
    const isOwnMessage = message.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Image
            source={{
              uri: message.sender.profileImage || 
                   'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150'
            }}
            style={styles.messageAvatar}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{message.sender.fullName}</Text>
          )}
          
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
          
          <Text style={styles.messageTime}>
            {new Date(message.createdAt).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
            {message.isEdited && <Text style={styles.editedText}> (düzenlendi)</Text>}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header skeleton */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Chat</Text>
            <Text style={styles.headerSubtitle}>Yükleniyor...</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {/* Chat skeleton */}
        <ChatSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{getRoomDisplayName()}</Text>
          <Text style={styles.headerSubtitle}>
            {isConnected && isNetworkConnected ? 'Bağlı' : 'Bağlantı yok'} • {messages.length} mesaj
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => setShowRoomInfo(true)} 
          style={styles.moreButton}
        >
          <MoreVertical size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {typingUsers.length > 0 && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {typingUsers.map((u: { username: string }) => u.username).join(', ')} yazıyor...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Mesaj yazın..."
            style={styles.textInput}
            multiline
            maxLength={4000}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              { opacity: (inputText.trim() && isConnected && isNetworkConnected) ? 1 : 0.5 }
            ]}
            disabled={!inputText.trim() || !isConnected || !isNetworkConnected}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  moreButton: {
    marginLeft: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#1D1D1F',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  editedText: {
    fontStyle: 'italic',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});