import * as AuthSession from 'expo-auth-session';

const getKeycloakConfig = () => {
  const keycloakUrl = process.env.EXPO_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
  const realm = process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'Homeguard';
  const clientId = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || 'homeguard-mobile';
  const redirectUriScheme = process.env.EXPO_PUBLIC_REDIRECT_URI_SCHEME || 'guardhomereactnative';
  
  // Générer l'URI de redirection selon l'environnement
  const getRedirectUri = () => {
    // Pour les tests web
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    
    // Pour mobile
    if (__DEV__) {
      // En développement : utiliser Expo Go avec l'IP locale
      return AuthSession.makeRedirectUri({
        scheme: redirectUriScheme,
        path: 'auth',
      });
    } else {
      // En production : utiliser le schéma personnalisé
      return `${redirectUriScheme}://auth`;
    }
  };

  const redirectUri = getRedirectUri();

  console.log("🔗 Redirect URI configuré:", redirectUri);
  console.log("📱 Environment:", __DEV__ ? 'development' : 'production');
  console.log("🌐 Platform:", typeof window !== 'undefined' ? 'web' : 'mobile');

  return {
    realm,
    clientId,
    url: keycloakUrl,
    redirectUri,
    
    // OAuth configuration
    scopes: ['openid', 'profile', 'email'],
    
    // API endpoints
    endpoints: {
      auth: `/realms/${realm}/protocol/openid-connect/auth`,
      token: `/realms/${realm}/protocol/openid-connect/token`,
      logout: `/realms/${realm}/protocol/openid-connect/logout`,
      userInfo: `/realms/${realm}/protocol/openid-connect/userinfo`,
    }
  };
};

export const KEYCLOAK_CONFIG = getKeycloakConfig();

// Helper function to build full URLs
export const buildKeycloakUrl = (endpoint: string): string => {
  return `${KEYCLOAK_CONFIG.url}${KEYCLOAK_CONFIG.endpoints[endpoint as keyof typeof KEYCLOAK_CONFIG.endpoints]}`;
};
