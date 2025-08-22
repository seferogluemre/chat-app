import { useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/auth-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("yunus@example.com");
  const [password, setPassword] = useState("Emre123.");
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Hata", "Lütfen email ve şifrenizi girin.");
      return;
    }

    try {
      const response = await login(email, password);
      console.log("response", response);
      if (response) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Hata", "Giriş yapılamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      Alert.alert("Hata", "Giriş yapılamadı. Lütfen tekrar deneyin.");
    } 
  };

  const navigateToRegister = () => {
    router.push("/register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MessageCircle size={48} color="#007AFF" />
          </View>
          <Text style={styles.title}>ChatApp&apos;e Hoş Geldin</Text>
          <Text style={styles.subtitle}>Hesabına giriş yap</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor="#8E8E93"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Şifreniz"
              placeholderTextColor="#8E8E93"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Hesabın yok mu? </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.registerLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#E3F2FD",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1D1D1F",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1D1F",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  registerText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  registerLink: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
