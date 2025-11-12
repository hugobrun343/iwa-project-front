import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { jwtDecode } from 'jwt-decode';
import { KEYCLOAK_CONFIG } from '../config/keycloak';
import { User } from '../types/auth';

export class AuthService {
  private static lastIssuer: string | null = null;
  private static sessionInProgress = false;
  static async openAuthSession(authUrl: string): Promise<string | null> {
    try {
      if (AuthService.sessionInProgress) {
        console.warn('⚠️ Auth session already in progress, ignoring new request');
        return null;
      }
      AuthService.sessionInProgress = true;
      console.log('🔗 Opening auth session. authUrl=', authUrl);
      console.log('🔁 Using redirectUri=', KEYCLOAK_CONFIG.redirectUri);

      // Prefer Expo AuthSession.startAsync which returns parsed params across platforms
      const startAsyncFn = (AuthSession as any).startAsync;
      if (typeof startAsyncFn === 'function') {
        try {
          const result = await startAsyncFn({ authUrl });
          console.log('📲 AuthSession.startAsync result=', result);
          if (result && (result as any).params && (result as any).params.code) {
            return (result as any).params.code;
          }
          if (result && (result as any).url) {
            try {
              const urlParsed = new URL((result as any).url);
              return urlParsed.searchParams.get('code');
            } catch (e) {
              console.warn('Could not parse URL from startAsync result:', e);
            }
          }
        } catch (e) {
          console.warn('AuthSession.startAsync failed; will use WebBrowser fallback:', e);
        }
      } else {
        console.warn('startAsync not available, using WebBrowser fallback');
      }

      // Fallback to WebBrowser for platforms where startAsync is not available
      const wbResult = await WebBrowser.openAuthSessionAsync(authUrl, KEYCLOAK_CONFIG.redirectUri);
      console.log('📲 WebBrowser.openAuthSessionAsync result=', wbResult);

      if (wbResult.type === 'success' && wbResult.url) {
        const url = new URL(wbResult.url);
        const issuer = url.searchParams.get('iss');
        if (issuer) {
          AuthService.lastIssuer = decodeURIComponent(issuer);
          console.log('🌐 Captured issuer from redirect:', AuthService.lastIssuer);
        } else {
          console.warn('⚠️ No issuer (iss) param found in redirect URL');
        }
        return url.searchParams.get('code');
      }

      return null;
    } catch (error) {
      console.error('Auth session error:', error);
      throw error;
    }
    finally {
      try { await WebBrowser.dismissBrowser(); } catch {}
      AuthService.sessionInProgress = false;
    }
  }

  /**
   * Managed OAuth flow using AuthSession.AuthRequest (handles PKCE automatically)
   */
  static async loginWithAuthRequest(useGoogle = false): Promise<{ code: string; codeVerifier?: string }> {
    try {
      const issuerBase = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}`;
      console.log('🔍 Fetching discovery from', issuerBase);
      const discovery = await AuthSession.fetchDiscoveryAsync(issuerBase);
      console.log('📜 Discovery loaded endpoints:', Object.keys(discovery || {}));

      if (!discovery.authorizationEndpoint || !discovery.tokenEndpoint) {
        throw new Error('Discovery document incomplete (missing authorization/token endpoints)');
      }

      AuthService.lastIssuer = (discovery as any).issuer || issuerBase;

      const extraParams: Record<string,string> = {};
      if (useGoogle) {
        // Use broker login (Keycloak social provider) OR kc_idp_hint fallback
        extraParams['kc_idp_hint'] = 'google';
      }

      const request = new AuthSession.AuthRequest({
        clientId: KEYCLOAK_CONFIG.clientId,
        redirectUri: KEYCLOAK_CONFIG.redirectUri,
        scopes: KEYCLOAK_CONFIG.scopes || ['openid','profile','email'],
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams
      });

      console.log('🛠 Preparing AuthRequest (PKCE enabled)');
      await request.makeAuthUrlAsync(discovery);
      console.log('🔗 Auth URL generated:', request.url);

      const result = await request.promptAsync(discovery);
      console.log('📲 promptAsync result type=', result.type, 'params=', (result as any).params);
      if (result.type !== 'success') {
        const err = (result as any).params?.error;
        const errDesc = (result as any).params?.error_description;
        throw new Error(`Auth flow not successful: ${result.type}${err ? ' :: '+err : ''}${errDesc ? ' - '+errDesc : ''}`);
      }
      const params = (result as any).params || {};
      const authCode: string | undefined = params.code;
      if (!authCode) {
        console.error('❌ No code in result.params; full params:', params);
        throw new Error('No authorization code returned by AuthRequest');
      }
      const codeVerifier: string | undefined = (request as any).codeVerifier;
      console.log('✅ Authorization code (snippet):', authCode.substring(0,6)+'…', ' PKCE verifier present:', !!codeVerifier);
      return { code: authCode, codeVerifier };
    } catch (e) {
      console.error('Managed AuthRequest login error:', e);
      throw e;
    }
  }

  static async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<any> {
    try {
      // Prefer dynamic issuer captured from redirect to avoid mismatches
      const tokenUrl = AuthService.lastIssuer 
        ? `${AuthService.lastIssuer}/protocol/openid-connect/token`
        : `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
      
      const bodyParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KEYCLOAK_CONFIG.clientId,
        code,
        redirect_uri: KEYCLOAK_CONFIG.redirectUri,
      });

      if (codeVerifier) {
        bodyParams.append('code_verifier', codeVerifier);
      }

      // Optional client secret (if client is confidential)
      const clientSecret = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_SECRET;
      if (clientSecret) {
        bodyParams.append('client_secret', clientSecret);
      }

      console.log('🔁 Exchanging code for tokens at', tokenUrl);
      console.log('🔁 Payload (without sensitive values):', {
        grant_type: 'authorization_code',
        client_id: KEYCLOAK_CONFIG.clientId,
        codeSnippet: code.substring(0, 6) + '…',
        redirect_uri: KEYCLOAK_CONFIG.redirectUri,
        has_code_verifier: !!codeVerifier,
        using_dynamic_issuer: !!AuthService.lastIssuer,
        has_client_secret: !!clientSecret
      });

      const bodyString = bodyParams.toString();
      console.log('📝 Token request body (truncated):', bodyString.slice(0, 160));
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        body: bodyString,
      });
      const text = await response.text();
      if (!response.ok) {
        const headersObj: Record<string,string> = {};
        response.headers.forEach((v,k)=>{headersObj[k]=v;});
        console.error('❌ Token exchange failed', {
          status: response.status,
          statusText: response.statusText || '(empty)',
            body: text,
            headers: headersObj
        });
        // Try to parse JSON error if any
        try {
          const jsonErr = JSON.parse(text);
          throw new Error(`Token exchange failed: ${response.status} ${response.statusText} :: ${jsonErr.error || ''} ${jsonErr.error_description || ''}`.trim());
        } catch {
          throw new Error(`Token exchange failed: ${response.status} ${response.statusText} :: ${text}`);
        }
      }
      console.log('✅ Token exchange success raw:', text.substring(0, 120) + (text.length > 120 ? '…' : ''));
      try {
        return JSON.parse(text);
      } catch (e) {
        console.warn('Response not JSON parseable, returning raw text');
        return text;
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  static async fetchUserInfo(token: string): Promise<User> {
    try {
      const userInfoUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/userinfo`;
      
      const response = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        return this.mapUserInfo(userInfo);
      } else {
        // Fallback to token data
        return this.mapUserInfoFromToken(token);
      }
    } catch (error) {
      console.error('Fetch user info error:', error);
      // Fallback to token data
      return this.mapUserInfoFromToken(token);
    }
  }
  static async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      const tokenUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
      const refreshParams = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: KEYCLOAK_CONFIG.clientId,
        refresh_token: refreshToken,
      });
      const body = refreshParams.toString();
      console.log('� Refresh token request body (truncated):', body.slice(0,140));
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'Accept': 'application/json'
        },
        body
      });
      const text = await response.text();
      if (!response.ok) {
        console.error('❌ Token refresh failed', { status: response.status, body: text });
        throw new Error(`Token refresh failed: ${response.status} :: ${text}`);
      }
      try { return JSON.parse(text); } catch { return text; }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  private static mapUserInfo(userInfo: any): User {
    return {
      id: userInfo.sub,
      email: userInfo.email || '',
      firstName: userInfo.given_name || userInfo.firstName || '',
      lastName: userInfo.family_name || userInfo.lastName || '',
      username: userInfo.preferred_username || userInfo.username || '',
      telephone: userInfo.telephone || '',
      localisation: userInfo.localisation || '',
      description: userInfo.description,
      photo_profil: userInfo.picture || userInfo.photo_profil,
      verification_identite: userInfo.verification_identite === 'true' || userInfo.verification_identite === true,
      preferences: userInfo.preferences,
      date_inscription: userInfo.created_timestamp ? new Date(userInfo.created_timestamp * 1000).toISOString() : new Date().toISOString(),
      fullName: `${userInfo.given_name || userInfo.firstName || ''} ${userInfo.family_name || userInfo.lastName || ''}`.trim(),
      isVerified: userInfo.verification_identite === 'true' || userInfo.verification_identite === true,
    };
  }

  private static mapUserInfoFromToken(token: string): User {
    const decodedToken = jwtDecode<any>(token);
    return {
      id: decodedToken.sub,
      email: decodedToken.email || '',
      firstName: decodedToken.given_name || decodedToken.firstName || '',
      lastName: decodedToken.family_name || decodedToken.lastName || '',
      username: decodedToken.preferred_username || decodedToken.username || '',
      telephone: decodedToken.telephone || '',
      localisation: decodedToken.localisation || '',
      description: decodedToken.description,
      photo_profil: decodedToken.picture || decodedToken.photo_profil,
      verification_identite: decodedToken.verification_identite === 'true' || decodedToken.verification_identite === true,
      preferences: decodedToken.preferences,
      date_inscription: decodedToken.iat ? new Date(decodedToken.iat * 1000).toISOString() : new Date().toISOString(),
      fullName: `${decodedToken.given_name || decodedToken.firstName || ''} ${decodedToken.family_name || decodedToken.lastName || ''}`.trim(),
      isVerified: decodedToken.verification_identite === 'true' || decodedToken.verification_identite === true,
    };
  }
}