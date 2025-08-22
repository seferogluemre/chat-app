import { AuthService } from "@/lib/api/services/auth";
import { User } from "@/types/chat";
import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { StorageService } from "../lib/storage/storage";
import { ApiUser } from "../lib/types/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string,
    bio?: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// API User'ı App User'a dönüştür
const mapApiUserToAppUser = (apiUser: ApiUser): User => ({
  id: apiUser.id,
  email: apiUser.email,
  firstName: apiUser.firstName,
  lastName: apiUser.lastName,
  username: apiUser.username,
  profileImage: apiUser.profileImage,
  bio: apiUser.bio,
  isOnline: true, // Socket'tan gelecek
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Başlangıçta true (auto-login kontrolü için)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // App başladığında auto-login kontrol et
  useEffect(() => {
    checkAutoLogin();
  }, []);

  /**
   * Auto-login kontrolü
   */
  const checkAutoLogin = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Stored token var mı?
      const token = await StorageService.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Token geçerli mi?
      const isValidToken = await AuthService.verifyToken();
      if (!isValidToken) {
        // Geçersiz token'ı temizle
        await StorageService.clearAll();
        setIsLoading(false);
        return;
      }

      // User bilgilerini getir
      const userProfile = await AuthService.getProfile();
      const appUser = mapApiUserToAppUser(userProfile);
      
      setUser(appUser);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Auto-login error:', error);
      // Hata durumunda storage'ı temizle
      await StorageService.clearAll();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Kullanıcı girişi
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await AuthService.login({ email, password });
      
      // Token'ı kaydet
      await StorageService.setToken(response.token);
      
      // User'ı kaydet ve state'i güncelle
      const appUser = mapApiUserToAppUser(response.user);
      await StorageService.setUser(appUser);
      
      setUser(appUser);
      setIsAuthenticated(true);
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Error message'ı kullanıcıya göster
      const errorMessage = error.response?.data?.message || error.message || 'Giriş başarısız';
      
      // TODO: Toast message göster
      console.log('Login Error:', errorMessage);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Kullanıcı kaydı
   */
  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string,
    bio?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        username,
        bio
      });
      
      // Token'ı kaydet
      await StorageService.setToken(response.token);
      
      // User'ı kaydet ve state'i güncelle
      const appUser = mapApiUserToAppUser(response.user);
      await StorageService.setUser(appUser);
      
      setUser(appUser);
      setIsAuthenticated(true);
      
      return true;
    } catch (error: any) {
      console.error('Register error:', error);
      
      // Error message'ı kullanıcıya göster
      const errorMessage = error.response?.data?.message || error.message || 'Kayıt başarısız';
      
      // TODO: Toast message göster
      console.log('Register Error:', errorMessage);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Çıkış yapma
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Backend'e logout isteği gönder
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Her durumda local storage'ı temizle
      await StorageService.clearAll();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  /**
   * User bilgilerini yenile
   */
  const refreshUser = async (): Promise<void> => {
    try {
      if (!isAuthenticated) return;
      
      const userProfile = await AuthService.getProfile();
      const appUser = mapApiUserToAppUser(userProfile);
      
      setUser(appUser);
      await StorageService.setUser(appUser);
    } catch (error) {
      console.error('Refresh user error:', error);
      // Token geçersizse logout yap
      await logout();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isLoading, 
      isAuthenticated,
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};