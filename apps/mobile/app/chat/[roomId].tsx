import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Hash, MoveVertical as MoreVertical, Phone, Send, Users, Video } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { currentUser, mockMessages, mockRooms, mockUsers } from '../../data/data';
import { Message, Room } from '../../types/chat';


export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load room data
    const foundRoom = mockRooms.find(r => r.id === roomId);
    if (foundRoom) {
      setRoom(foundRoom);
    } else {
      if (roomId?.startsWith('dm-')) {
        const userId = roomId.split('-')[1];
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
          const dmRoom: Room = {
            id: roomId,
            isDM: true,
            createdAt: new Date(),
            participants: [user],
          };
          setRoom(dmRoom);
        }
      }
    }

    const roomMessages = mockMessages[roomId || ''] || [];
    setMessages(roomMessages);
  }, [roomId]);

  const sendMessage = () => {
    if (!message.trim() || !room) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      roomId: room.id,
      senderId: currentUser.id,
      content: message.trim(),
      createdAt: new Date(),
      sender: currentUser,
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getRoomDisplayName = () => {
    if (!room) return 'Chat';
    
    if (room.isDM && room.participants && room.participants.length > 0) {
      const participant = room.participants[0];
      return `${participant.firstName} ${participant.lastName}`;
    }
    return room.name || 'Group Chat';
  };

  const getRoomImage = () => {
    if (!room) return null;
    
    if (room.isDM && room.participants && room.participants.length > 0) {
      return room.participants[0].profileImage;
    }
    return 'https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg?auto=compress&cs=tinysrgb&w=150';
  };

  const isParticipantOnline = () => {
    if (!room || !room.isDM || !room.participants) return false;
    return room.participants[0]?.isOnline || false;
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUser.id;
    const sender = item.sender || mockUsers.find(u => u.id === item.senderId);

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && !room?.isDM && (
          <View style={styles.senderInfo}>
            {sender?.profileImage ? (
              <Image source={{ uri: sender.profileImage }} style={styles.senderAvatar} />
            ) : (
              <View style={[styles.senderAvatar, styles.senderAvatarPlaceholder]}>
                <Text style={styles.senderAvatarText}>
                  {sender?.firstName.charAt(0)}{sender?.lastName.charAt(0)}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          {!isMyMessage && !room?.isDM && (
            <Text style={styles.senderName}>
              {sender?.firstName} {sender?.lastName}
            </Text>
          )}
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderRoomInfoModal = () => {
    if (!room) return null;

    return (
      <Modal
        visible={showRoomInfo}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRoomInfo(false)}>
              <Text style={styles.modalCloseButton}>Kapat</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Grup Bilgileri</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.roomInfoHeader}>
              <Image 
                source={{ uri: getRoomImage() || 'https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg?auto=compress&cs=tinysrgb&w=150' }} 
                style={styles.roomInfoImage} 
              />
              <Text style={styles.roomInfoName}>{getRoomDisplayName()}</Text>
              {!room.isDM && (
                <View style={styles.roomInfoTypeContainer}>
                  <Hash size={16} color="#8E8E93" />
                  <Text style={styles.roomInfoType}>Grup</Text>
                </View>
              )}
            </View>

            <View style={styles.roomInfoSection}>
              <View style={styles.roomInfoItem}>
                <Calendar size={20} color="#007AFF" />
                <Text style={styles.roomInfoItemText}>
                  Oluşturulma: {room.createdAt.toLocaleDateString('tr-TR')}
                </Text>
              </View>
              
              {room.participants && (
                <View style={styles.roomInfoItem}>
                  <Users size={20} color="#007AFF" />
                  <Text style={styles.roomInfoItemText}>
                    {room.participants.length + 1} üye
                  </Text>
                </View>
              )}
            </View>

            {room.participants && (
              <View style={styles.participantsSection}>
                <Text style={styles.participantsSectionTitle}>Üyeler</Text>
                {room.participants.map((participant) => (
                  <View key={participant.id} style={styles.participantItem}>
                    <View style={styles.participantAvatarContainer}>
                      {participant.profileImage ? (
                        <Image source={{ uri: participant.profileImage }} style={styles.participantAvatar} />
                      ) : (
                        <View style={[styles.participantAvatar, styles.participantAvatarPlaceholder]}>
                          <Text style={styles.participantAvatarText}>
                            {participant.firstName.charAt(0)}{participant.lastName.charAt(0)}
                          </Text>
                        </View>
                      )}
                      {participant.isOnline && <View style={styles.participantOnlineIndicator} />}
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>
                        {participant.firstName} {participant.lastName}
                      </Text>
                      <Text style={styles.participantUsername}>@{participant.username}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Chat bulunamadı</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerInfo}
            onPress={() => !room.isDM && setShowRoomInfo(true)}
          >
            <View style={styles.headerAvatarContainer}>
              {getRoomImage() ? (
                <Image source={{ uri: getRoomImage()! }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                  <Text style={styles.headerAvatarText}>
                    {getRoomDisplayName().charAt(0)}
                  </Text>
                </View>
              )}
              {room.isDM && isParticipantOnline() && (
                <View style={styles.headerOnlineIndicator} />
              )}
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{getRoomDisplayName()}</Text>
              <Text style={styles.headerStatus}>
                {room.isDM 
                  ? (isParticipantOnline() ? 'Çevrimiçi' : 'Çevrimdışı')
                  : `${(room.participants?.length || 0) + 1} üye`
                }
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {room.isDM && (
              <>
                <TouchableOpacity style={styles.headerActionButton}>
                  <Phone size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionButton}>
                  <Video size={20} color="#007AFF" />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => setShowRoomInfo(true)}
            >
              <MoreVertical size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Mesaj yaz..."
            placeholderTextColor="#8E8E93"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, message.trim() ? styles.sendButtonActive : null]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Send size={20} color={message.trim() ? 'white' : '#8E8E93'} />
          </TouchableOpacity>
        </View>

        {renderRoomInfoModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  headerOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: 'white',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerStatus: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionButton: {
    padding: 4,
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  senderInfo: {
    marginRight: 8,
    alignItems: 'center',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  senderAvatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
    marginLeft: 48,
  },
  otherMessageBubble: {
    backgroundColor: 'white',
    marginRight: 48,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#1D1D1F',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#8E8E93',
  },
  inputContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  roomInfoHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  roomInfoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  roomInfoName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  roomInfoTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomInfoType: {
    fontSize: 16,
    color: '#8E8E93',
  },
  roomInfoSection: {
    marginBottom: 32,
  },
  roomInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  roomInfoItemText: {
    fontSize: 16,
    color: '#1D1D1F',
  },
  participantsSection: {
    flex: 1,
  },
  participantsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  participantAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  participantAvatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  participantOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: 'white',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  participantUsername: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },
});