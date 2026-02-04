import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Store for token getter function
let tokenGetter: (() => Promise<string | null>) | null = null;

// Token cache
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

// Token cache duration (5 minutes)
const TOKEN_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Set the function to get identity token from Privy
 * Call this once in your app with Privy's getIdentityToken function
 */
export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

/**
 * Clear the cached token (call this on 401 errors or logout)
 */
export function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

/**
 * Get token with caching
 */
async function getCachedToken(): Promise<string | null> {
  const now = Date.now();

  // Return cached token if it's still valid
  if (cachedToken && tokenExpiresAt > now) {
    return cachedToken;
  }

  // Token expired or not cached, fetch new one
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        cachedToken = token;
        tokenExpiresAt = now + TOKEN_CACHE_DURATION;
        return token;
      }
    } catch (error) {
      console.error('Error getting token from tokenGetter:', error);
    }
  }

  // Fallback to cookie
  const cookieToken = getTokenFromCookie();
  if (cookieToken) {
    cachedToken = cookieToken;
    tokenExpiresAt = now + TOKEN_CACHE_DURATION;
    return cookieToken;
  }

  return null;
}

/**
 * Create an axios instance with authentication
 */
export function createAuthenticatedClient(baseURL?: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Request interceptor to add authorization token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getCachedToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.log('[Auth] 401 Unauthorized - clearing token cache');
        // Clear the cached token on 401 errors
        clearTokenCache();

        // Clear React Query cache for user data
        if (typeof window !== 'undefined') {
          // Dispatch a custom event that useUser can listen to
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Get Privy ID token from cookies (fallback method)
 * Note: ID token is required for server-side authentication
 */
function getTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  // Priority order: ID token is what the server needs
  const possibleCookieNames = [
    'privy-id-token',      // Primary: ID token for server verification
    'privy-token',         // Legacy fallback
    'privy-access-token',  // Access token (not ideal for server auth)
    'privy-session',       // Session fallback
  ];

  for (const cookieName of possibleCookieNames) {
    const cookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`));
    if (cookie) {
      return cookie.split('=')[1];
    }
  }

  return null;
}

/**
 * Default authenticated client for API calls
 */
export const apiClient = createAuthenticatedClient();

/**
 * Helper function to create a client with custom token
 * Useful when you have the token from Privy's getAccessToken()
 */
export function createClientWithToken(token: string, baseURL?: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    timeout: 30000,
  });

  return client;
}
