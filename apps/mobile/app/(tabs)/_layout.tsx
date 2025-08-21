import { Tabs } from 'expo-router';
import { LogIn, MessageCircle, UserPlus, Users } from 'lucide-react-native';
import { useAuth } from '../../context/auth-context';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingBottom: 8,
          paddingTop: 8,
          height: 84,
          justifyContent:"center",
          alignItems:"center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sohbetler',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
          // Kullanıcı giriş yapmamışsa gizle
          tabBarButton: user ? undefined : () => null,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Kişiler',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
          // Kullanıcı giriş yapmamışsa gizle
          tabBarButton: user ? undefined : () => null,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          title: 'Giriş Yap',
          tabBarIcon: ({ size, color }) => (
            <LogIn size={size} color={color} />
          ),
          // Kullanıcı giriş yapmışsa gizle
          tabBarButton: !user ? undefined : () => null,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: 'Kayıt Ol',
          tabBarIcon: ({ size, color }) => (
            <UserPlus size={size} color={color} />
          ),
          // Kullanıcı giriş yapmışsa gizle
          tabBarButton: !user ? undefined : () => null,
        }}
      />
    </Tabs>
  );
}