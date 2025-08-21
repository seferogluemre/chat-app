import { useRouter } from 'expo-router';
import { MessageCircle, Plus, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { mockUsers } from '../../data/data';
import { User } from '../../types/chat';

export default function ContactsScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(mockUsers);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredUsers(mockUsers);
    } else {
      const filtered = mockUsers.filter(user =>
        user.firstName.toLowerCase().includes(text.toLowerCase()) ||
        user.lastName.toLowerCase().includes(text.toLowerCase()) ||
        user.username.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const formatLastSeen = (user: User) => {
    if (user.isOnline) {
      return 'Çevrimiçi';
    }
    if (user.lastSeen) {
      const now = new Date();
      const diff = now.getTime() - user.lastSeen.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 0) {
        return `${days} gün önce görülme`;
      } else if (hours > 0) {
        return `${hours} saat önce görülme`;
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} dakika önce görülme`;
      }
    }
    return 'Uzun zaman önce görülme';
  };

  const startChat = (user: User) => {
    const dmRoomId = `dm-${user.id}`;
    router.push(`/chat/${dmRoomId}`);
  };

  const renderContactItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.contactItem}>
      <View style={styles.avatarContainer}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {item.firstName.charAt(0)}{item.lastName.charAt(0)}
            </Text>
          </View>
        )}
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.lastSeen}>{formatLastSeen(item)}</Text>
        {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
      </View>
      
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => startChat(item)}
      >
        <MessageCircle size={20} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kişiler</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Kişi ara..."
            placeholderTextColor="#8E8E93"
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        contentContainerStyle={styles.contactList}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
  },
  contactList: {
    paddingVertical: 8,
  },
  contactItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: 'white',
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  username: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  lastSeen: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bio: {
    fontSize: 14,
    color: '#6D6D80',
    fontStyle: 'italic',
    marginTop: 2,
  },
  chatButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 12,
  },
});