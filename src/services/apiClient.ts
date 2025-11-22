import { Platform } from 'react-native';

export type QueryParamValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Array<string | number | boolean | null | undefined>;

export interface ApiRequestOptions<TBody = unknown> {
  method?: string;
  body?: TBody | FormData | null;
  headers?: Record<string, string>;
  query?: Record<string, QueryParamValue>;
  withAuth?: boolean;
  signal?: AbortSignal;
}

export class ApiError<T = any> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Get the backend URL from environment or use defaults
// For mobile: use localhost if running on emulator, or use network IP for physical device
// For web: use current origin or localhost
export const DEFAULT_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' 
    ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080')
    : 'http://localhost:8080');

const buildUrl = (path: string, query?: Record<string, QueryParamValue>, baseUrl = DEFAULT_BASE_URL) => {
  const url = path.startsWith('http') ? new URL(path) : new URL(path.replace(/^\//, ''), `${baseUrl.replace(/\/$/, '')}/`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value
          .filter((entry) => entry !== undefined && entry !== null)
          .forEach((entry) => url.searchParams.append(key, String(entry)));
        return;
      }

      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
};

const parseResponse = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text.length ? text : null;
  }
};

export interface ApiClient {
  request: <TResponse = unknown, TBody = unknown>(
    path: string,
    options?: ApiRequestOptions<TBody>
  ) => Promise<TResponse>;
}

export const createApiClient = (
  getAccessToken: () => string | null,
  baseUrl = DEFAULT_BASE_URL,
  onTokenRefresh?: () => Promise<void>
): ApiClient => {
  let isRefreshing = false;
  let refreshPromise: Promise<void> | null = null;

  const request = async <TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {}
  ): Promise<TResponse> => {
    const { method = 'GET', body, headers, query, withAuth = true, signal } = options;
    const url = buildUrl(path, query, baseUrl);

    // Prepare body once (can be reused for retry)
    let payload: BodyInit | undefined;
    const finalHeadersBase: Record<string, string> = {
      Accept: 'application/json',
      ...(headers ?? {}),
    };

    if (body instanceof FormData) {
      payload = body;
    } else if (body !== undefined && body !== null) {
      payload = JSON.stringify(body);
      finalHeadersBase['Content-Type'] = finalHeadersBase['Content-Type'] ?? 'application/json';
    }

    const makeRequest = async (token: string | null): Promise<Response> => {
      const finalHeaders = { ...finalHeadersBase };

      if (withAuth && token) {
        finalHeaders.Authorization = `Bearer ${token}`;
      }

      return fetch(url, {
        method,
        headers: finalHeaders,
        body: payload,
        signal,
      });
    };

    let token = withAuth ? getAccessToken() : null;
    let response = await makeRequest(token);

    // If we get a 401 and have auth enabled, try to refresh the token
    if (response.status === 401 && withAuth && onTokenRefresh) {
      // Wait for any ongoing refresh to complete
      if (isRefreshing && refreshPromise) {
        await refreshPromise;
      } else if (!isRefreshing) {
        // Start a new refresh
        isRefreshing = true;
        refreshPromise = onTokenRefresh()
          .then(() => {
            isRefreshing = false;
            refreshPromise = null;
          })
          .catch((error) => {
            isRefreshing = false;
            refreshPromise = null;
            throw error;
          });
        
        await refreshPromise;
      }

      // Retry the request with the new token
      token = getAccessToken();
      response = await makeRequest(token);
    }

    const parsed = await parseResponse(response);

    if (!response.ok) {
      const message =
        (parsed && typeof parsed === 'object' && 'message' in parsed && parsed.message) ||
        response.statusText ||
        'Unknown API error';
      throw new ApiError(message as string, response.status, parsed);
    }

    return parsed as TResponse;
  };

  return { request };
};

