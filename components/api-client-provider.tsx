'use client';

import { useEffect } from 'react';
import { getIdentityToken, usePrivy } from '@privy-io/react-auth';
import { setTokenGetter, clearTokenCache } from '@/lib/api/client';

/**
 * Provider component to setup API client with Privy token getter
 * Add this to your app layout to enable automatic token injection
 */
export function ApiClientProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, ready } = usePrivy();

  useEffect(() => {
    // Set the token getter function for API client
    // Use getIdentityToken for server-side authentication
    // This returns the ID token that can be verified by the server
    setTokenGetter(async () => {
      try {
        const token = await getIdentityToken();
        return token;
      } catch (error) {
        console.error('Error getting Privy identity token:', error);
        return null;
      }
    });
  }, []);

  // Clear token cache when user logs out
  useEffect(() => {
    if (ready && !authenticated) {
      console.log('[ApiClientProvider] User logged out - clearing token cache');
      clearTokenCache();
    }
  }, [authenticated, ready]);

  return <>{children}</>;
}
