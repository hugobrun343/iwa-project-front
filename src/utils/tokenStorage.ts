import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Détection de la plateforme web
const isWeb = Platform.OS === 'web';

// Stockage web via localStorage
const webStorage = {
  setItemAsync: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  getItemAsync: async (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  deleteItemAsync: async (key: string): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

export const storeToken = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) {
      await webStorage.setItemAsync(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error('Store token error:', error);
    throw error;
  }
};

export const getStoredToken = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      return await webStorage.getItemAsync(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error('Get stored token error:', error);
    return null;
  }
};

export const removeStoredToken = async (key: string): Promise<void> => {
  try {
    if (isWeb) {
      await webStorage.deleteItemAsync(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('Remove stored token error:', error);
  }
};

export const clearAllTokens = async (): Promise<void> => {
  await Promise.all([
    removeStoredToken('access_token'),
    removeStoredToken('refresh_token'),
    removeStoredToken('id_token'),
    removeStoredToken('code_verifier')
  ]);
};