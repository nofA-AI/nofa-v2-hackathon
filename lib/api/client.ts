import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Store for token getter function
let tokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Set the function to get access token from Privy
 * Call this once in your app with Privy's getAccessToken function
 */
export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
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
      let token: string | null = null;

      // Try to get token from the token getter first (Privy's getAccessToken)
      if (tokenGetter) {
        try {
          token = await tokenGetter();
        } catch (error) {
          console.error('Error getting token from tokenGetter:', error);
        }
      }

      // Fallback to cookie if no token getter or it failed
      if (!token) {
        token = getTokenFromCookie();
      }

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
        console.error('Unauthorized request - token may be expired');
        // You can add redirect to login or token refresh logic here
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Get Privy token from cookies (fallback method)
 */
function getTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const possibleCookieNames = [
    'privy-access-token',
    'privy-token',
    'privy-id-token',
    'privy-session',
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
