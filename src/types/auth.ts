export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  telephone: string;
  localisation: string;
  description?: string;
  photo_profil?: string;
  verification_identite: boolean;
  preferences?: string;
  date_inscription: string;
  // Computed fields
  fullName: string;
  isVerified: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  simulateLogin?: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  updateUserAttribute: (attribute: string, value: any) => Promise<boolean>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}