import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

export class StorageService {
  static async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  static async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // User data management
  static async setUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  static async getUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user:', error);
      return null;
    }
  }

  static async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.SETTINGS,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}