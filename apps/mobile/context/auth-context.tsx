import { User } from "@/types/chat";
import React, { ReactNode, createContext, useContext, useState } from "react";
import { currentUser } from "../data/data";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(currentUser);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email.trim() && password.trim()) {
      setUser(currentUser);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ): Promise<boolean> => {
    setIsLoading(true);

    // Şuanlık api call yapmıyoruz backend bitince baglıyacagız
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (
      email.trim() &&
      password.trim() &&
      firstName.trim() &&
      lastName.trim() &&
      username.trim()
    ) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        firstName,
        lastName,
        username,
        profileImage:
          "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150",
        bio: "New user",
        isOnline: true,
      };
      setUser(newUser);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  console.log("user", user);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
