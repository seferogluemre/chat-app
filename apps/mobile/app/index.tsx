import { Redirect } from 'expo-router';
import { useAuth } from '../context/auth-context';

export default function RootIndex() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Redirect to appropriate screen based on auth state
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(tabs)/login" />;
}