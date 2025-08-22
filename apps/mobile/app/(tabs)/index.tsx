import { formatTime } from "@/lib/utils/date-helper";
import { useRouter } from "expo-router";
import { LogOut, MessageSquarePlus } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/auth-context";
import { useSocket } from "../../context/socket-context";
import { RoomService } from "../../lib/api/services/rooms";
import { ApiRoom } from "../../lib/types/api";

export default function ChatsScreen() {
  const { user, logout } = useAuth();
  const { isConnected, socket } = useSocket();
  const router = useRouter();

  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Yeni mesaj geldiğinde room list'i güncelle (sadece o room için)
    socket.on("new_message", (message) => {
      updateRoomLastMessage(message.roomId, message);
    });

    // Room güncellendiğinde
    socket.on("room_updated", (updatedRoom) => {
      updateRoomInList(updatedRoom);
    });

    return () => {
      socket.off("new_message");
      socket.off("room_updated");
    };
  }, [socket]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const userRooms = await RoomService.getUserRooms();
      setRooms(userRooms);
    } catch (error) {
      console.error("Load rooms error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  }, []);

  const updateRoomLastMessage = (roomId: string, message: any) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              lastMessage: {
                content: message.content,
                senderName: message.sender.fullName,
                timestamp: message.createdAt,
              },
            }
          : room
      )
    );
  };

  const updateRoomInList = (updatedRoom: ApiRoom) => {
    setRooms((prev) =>
      prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room))
    );
  };

  const handleRoomPress = (room: ApiRoom) => {
    router.push(`/chat/${room.id}`);
  };

  const renderRoom = ({ item: room }: { item: ApiRoom }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleRoomPress(room)}
    >
      <Image
        source={{
          uri:
            room.roomImage ||
            "https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg?auto=compress&cs=tinysrgb&w=150",
        }}
        style={styles.avatar}
      />

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>
            {room.type === "dm" ? "DM User" : room.name || "Unnamed Room"}
          </Text>
          <Text style={styles.chatTime}>
            {room.lastMessage?.timestamp
              ? formatTime(new Date(room.lastMessage.timestamp))
              : ""}
          </Text>
        </View>

        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {room.lastMessage?.content || "Henüz mesaj yok"}
          </Text>
          {room.unreadCount && room.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {room.unreadCount > 99 ? "99+" : room.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with connection status */}
      <View style={styles.header}>
        <Text style={styles.title}>Sohbetler</Text>
        <View style={styles.headerRight}>
          {/* Connection indicator */}
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? "#4CAF50" : "#F44336" },
            ]}
          />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Rooms List */}
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007bff"]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <React.Fragment>
              <Text style={styles.emptyText}>Yükleniyor...</Text>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Text style={styles.emptyText}>Henüz sohbet yok</Text>
            </React.Fragment>
          )
        }
      />

      <TouchableOpacity style={styles.fab}>
        <MessageSquarePlus size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1D1D1F",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  logoutButton: {
    padding: 4,
  },
  chatList: {
    paddingVertical: 8,
  },
  chatItem: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 16,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1D1F",
    flex: 1,
  },
  chatTime: {
    fontSize: 14,
    color: "#8E8E93",
    marginLeft: 8,
  },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 15,
    color: "#8E8E93",
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 50,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
