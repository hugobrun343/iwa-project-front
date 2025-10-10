import * as SecureStore from 'expo-secure-store';

export const storeToken = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Store token error:', error);
    throw error;
  }
};

export const getStoredToken = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Get stored token error:', error);
    return null;
  }
};

export const removeStoredToken = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
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