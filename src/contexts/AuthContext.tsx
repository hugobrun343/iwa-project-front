import React, { createContext, useContext, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { AuthContextType, AuthProviderProps, User } from '../types/auth';
import { useAuthActions } from '../hooks/useAuthActions';

// Configure WebBrowser for better UX
WebBrowser.maybeCompleteAuthSession();

const ENABLE_SIMULATED_LOGIN = process.env.EXPO_PUBLIC_ENABLE_SIMULATED_LOGIN === 'true';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);

  const authActions = useAuthActions();

  const isAuthenticated = !!user && !!accessToken;

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const { user, tokens } = await authActions.initializeFromStorage();
      
      if (user && tokens) {
        setUser(user);
        setAccessToken(tokens.access_token);
        setRefreshTokenValue(tokens.refresh_token);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      const { user, tokens } = await authActions.performLogin(false);
      
      if (user && tokens) {
        setUser(user);
        setAccessToken(tokens.access_token);
        setRefreshTokenValue(tokens.refresh_token);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const simulateLogin = async () => {
    if (!ENABLE_SIMULATED_LOGIN) {
      throw new Error('Simulated login is disabled by configuration');
    }
    try {
      setIsLoading(true);
      const fakeUser: User = {
        id: 'dev-user-1',
        email: 'dev.user@example.com',
        firstName: 'Dev',
        lastName: 'User',
        username: 'devuser',
        telephone: '0000000000',
        localisation: 'DevVille',
        description: 'Utilisateur simulé pour le développement',
        photo_profil: undefined,
        verification_identite: true,
        preferences: undefined,
        date_inscription: new Date().toISOString(),
        fullName: 'Dev User',
        isVerified: true,
      };
      setUser(fakeUser);
      setAccessToken('dev-access-token');
      setRefreshTokenValue('dev-refresh-token');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { user, tokens } = await authActions.performLogin(true);
      
      if (user && tokens) {
        setUser(user);
        setAccessToken(tokens.access_token);
        setRefreshTokenValue(tokens.refresh_token);
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const logout = async () => {
    try {
      await authActions.performLogout();
      
      // Clear state
      setUser(null);
      setAccessToken(null);
      setRefreshTokenValue(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshToken = async () => {
    if (!refreshTokenValue) return;

    try {
      const { user, tokens } = await authActions.performTokenRefresh(refreshTokenValue);
      
      if (user && tokens) {
        setUser(user);
        setAccessToken(tokens.access_token);
        setRefreshTokenValue(tokens.refresh_token);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!accessToken) return;

    try {
      const success = await authActions.performUpdateProfile(accessToken, updates);
      
      if (success) {
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  const updateUserAttribute = async (attribute: string, value: any): Promise<boolean> => {
    if (!accessToken || !user) return false;

    try {
      const success = await authActions.performUpdateAttribute(accessToken, user.id, attribute, value);
      
      if (success) {
        setUser(prev => {
          if (!prev) return null;
          
          const updatedUser = { ...prev };
          (updatedUser as any)[attribute] = value;
          
          // Update computed fields
          if (attribute === 'firstName' || attribute === 'lastName') {
            updatedUser.fullName = `${updatedUser.firstName} ${updatedUser.lastName}`.trim();
          }
          if (attribute === 'verification_identite') {
            updatedUser.isVerified = value;
          }
          
          return updatedUser;
        });
      }
      
      return success;
    } catch (error) {
      console.error('Update user attribute error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoading || authActions.isLoading,
    isAuthenticated,
    login,
    simulateLogin: ENABLE_SIMULATED_LOGIN ? simulateLogin : undefined,
    loginWithGoogle,
    logout,
    refreshToken,
    updateUserProfile,
    updateUserAttribute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
