import { Platform } from 'react-native';
import * as NativeSecureStore from 'expo-secure-store';

// Custom cross-platform secure store wrapper for Web & Native
const SecureStore = {
  getItemAsync: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    }
    return NativeSecureStore.getItemAsync(key);
  },

  setItemAsync: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('Web storage is not available');
      }
      return;
    }
    return NativeSecureStore.setItemAsync(key, value);
  },

  deleteItemAsync: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('Web storage is not available');
      }
      return;
    }
    return NativeSecureStore.deleteItemAsync(key);
  }
};

export default SecureStore;
