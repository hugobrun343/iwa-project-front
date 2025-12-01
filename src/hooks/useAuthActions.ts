import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { jwtDecode } from 'jwt-decode';
import { KEYCLOAK_CONFIG } from '../config/keycloak';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import { storeToken, getStoredToken, clearAllTokens } from '../utils/tokenStorage';
import { User } from '../types/auth';
import * as Crypto from 'expo-crypto';

// PKCE utilities
// Minimal base64 and base64url helpers (ASCII-safe) for PKCE without Buffer/global
const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const encodeBase64 = (bytes: Uint8Array): string => {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++] ?? 0;
    const b2 = bytes[i++] ?? 0;
    const b3 = bytes[i++] ?? 0;
    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
    const enc3 = ((b2 & 15) << 2) | (b3 >> 6);
    const enc4 = b3 & 63;
    if (isNaN(b2)) {
      out += b64chars.charAt(enc1) + b64chars.charAt(enc2) + '==';
    } else if (isNaN(b3)) {
      out += b64chars.charAt(enc1) + b64chars.charAt(enc2) + b64chars.charAt(enc3) + '=';
    } else {
      out += b64chars.charAt(enc1) + b64chars.charAt(enc2) + b64chars.charAt(enc3) + b64chars.charAt(enc4);
    }
  }
  return out;
};

const toBase64Url = (data: Uint8Array): string => encodeBase64(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64 = (b64: string): Uint8Array => {
  b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '='; // pad
  let str = '';
  let i = 0;
  while (i < b64.length) {
    const e1 = b64chars.indexOf(b64.charAt(i++));
    const e2 = b64chars.indexOf(b64.charAt(i++));
    const e3 = b64chars.indexOf(b64.charAt(i++));
    const e4 = b64chars.indexOf(b64.charAt(i++));
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    str += String.fromCharCode(c1);
    if (e3 !== 64 && e3 !== -1) str += String.fromCharCode(c2);
    if (e4 !== 64 && e4 !== -1) str += String.fromCharCode(c3);
  }
  const out = new Uint8Array(str.length);
  for (let j = 0; j < str.length; j++) out[j] = str.charCodeAt(j);
  return out;
};

const generateCodeVerifier = async (): Promise<string> => {
  const random = await Crypto.getRandomBytesAsync(32);
  return toBase64Url(random);
};

const sha256 = async (plain: string): Promise<Uint8Array> => {
  const digestB64 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    plain,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return fromBase64(digestB64);
};

const base64UrlEncode = (bytes: Uint8Array): string => toBase64Url(bytes);

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const buildAuthUrl = (useGoogle = false, pkce?: { codeChallenge: string; codeChallengeMethod: string }) => {
    const baseUrl = useGoogle 
      ? `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/broker/google/login`
      : `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth`;

    const params = new URLSearchParams({
      client_id: KEYCLOAK_CONFIG.clientId,
      redirect_uri: KEYCLOAK_CONFIG.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
    });

    if (pkce) {
      params.append('code_challenge', pkce.codeChallenge);
      params.append('code_challenge_method', pkce.codeChallengeMethod);
    }

    if (!useGoogle) {
      params.append('kc_idp_hint', 'google');
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const performLogin = async (useGoogle = false): Promise<{ user: User | null; tokens: any }> => {
    try {
      if (isLoading) {
        console.log('⚠️ Login already in progress, ignoring duplicate tap');
        return { user: null, tokens: null };
      }
      setIsLoading(true);

      console.log('� Attempting managed AuthRequest flow (no fallback)...');
      const managed = await AuthService.loginWithAuthRequest(useGoogle);
      const tokens = await AuthService.exchangeCodeForTokens(managed.code, managed.codeVerifier);

      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Store tokens securely
  await storeToken('access_token', tokens.access_token);
  if (tokens.id_token) await storeToken('id_token', tokens.id_token);
  await storeToken('refresh_token', tokens.refresh_token);

      // Get user info
      const user = await AuthService.fetchUserInfo(tokens.access_token);

      return { user, tokens };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const performLogout = async (): Promise<void> => {
    try {
      // Read id_token for id_token_hint if available
      const idToken = await getStoredToken('id_token');

      // Build proper OIDC logout with post_logout_redirect_uri
      const params = new URLSearchParams();
      params.append('client_id', KEYCLOAK_CONFIG.clientId);
      params.append('post_logout_redirect_uri', KEYCLOAK_CONFIG.redirectUri);
      if (idToken) params.append('id_token_hint', idToken);

      const logoutUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout?${params.toString()}`;

      const result = await WebBrowser.openAuthSessionAsync(logoutUrl, KEYCLOAK_CONFIG.redirectUri);
      // Dismiss the browser explicitly to return to the app UI
      try { await WebBrowser.dismissBrowser(); } catch {}
      // Clear tokens after Keycloak confirms
      await clearAllTokens();
      console.log('✅ Logged out, browser closed, tokens cleared:', result.type);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const performTokenRefresh = async (refreshToken: string, silent = false): Promise<{ user: User | null; tokens: any }> => {
    try {
      const tokens = await AuthService.refreshAccessToken(refreshToken, silent);

      if (!tokens.access_token) {
        throw new Error('Failed to refresh token');
      }

      // Store new tokens
      await storeToken('access_token', tokens.access_token);
      await storeToken('refresh_token', tokens.refresh_token);

      // Get updated user info
      const user = await AuthService.fetchUserInfo(tokens.access_token);

      return { user, tokens };
    } catch (error) {
      if (!silent) {
        console.error('Token refresh error:', error);
      }
      throw error;
    }
  };

  const initializeFromStorage = async (): Promise<{ user: User | null; tokens: any }> => {
    try {
      const storedAccessToken = await getStoredToken('access_token');
      const storedRefreshToken = await getStoredToken('refresh_token');

      if (!storedAccessToken) {
        return { user: null, tokens: null };
      }

      const decodedToken = jwtDecode<any>(storedAccessToken);

      // Check if token is expired
      if (decodedToken.exp * 1000 > Date.now()) {
        const user = await AuthService.fetchUserInfo(storedAccessToken);
        return { 
          user, 
          tokens: { 
            access_token: storedAccessToken, 
            refresh_token: storedRefreshToken 
          } 
        };
      } else if (storedRefreshToken) {
        // Try to refresh token silently during initialization
        try {
          return await performTokenRefresh(storedRefreshToken, true);
        } catch (error) {
          // If refresh fails (e.g., invalid token), clear tokens silently
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('invalid_grant') || 
              errorMessage.includes('Invalid token issuer') ||
              errorMessage.includes('invalid grant')) {
            // Silently clear invalid tokens
            await clearAllTokens();
          }
          return { user: null, tokens: null };
        }
      }

      return { user: null, tokens: null };
    } catch (error) {
      // Silently handle initialization errors (expected when tokens are invalid)
      return { user: null, tokens: null };
    }
  };

  const performUpdateProfile = async (accessToken: string, updates: Partial<User>): Promise<boolean> => {
    return await UserService.updateUserProfile(accessToken, updates);
  };

  const performUpdateAttribute = async (accessToken: string, userId: string, attribute: string, value: any): Promise<boolean> => {
    return await UserService.updateUserAttribute(accessToken, userId, attribute, value);
  };

  const checkProfileComplete = async (username: string, accessToken: string): Promise<boolean> => {
    try {
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/api/users/${username}/profile-complete`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to check profile complete:', response.status);
        return false;
      }

      const data = await response.json();
      return data.complete === true;
    } catch (error) {
      console.error('Error checking profile complete:', error);
      return false;
    }
  };

  return {
    isLoading,
    performLogin,
    performLogout,
    performTokenRefresh,
    initializeFromStorage,
    performUpdateProfile,
    performUpdateAttribute,
    checkProfileComplete,
  };
};