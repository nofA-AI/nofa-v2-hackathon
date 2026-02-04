'use client';

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { setTokenGetter } from '@/lib/api/client';

/**
 * Provider component to setup API client with Privy token getter
 * Add this to your app layout to enable automatic token injection
 */
export function ApiClientProvider({ children }: { children: React.ReactNode }) {
  const { getAccessToken } = usePrivy();

  useEffect(() => {
    // Set the token getter function for API client
    setTokenGetter(async () => {
      try {
        const token = await getAccessToken();
        return token;
      } catch (error) {
        console.error('Error getting Privy access token:', error);
        return null;
      }
    });
  }, [getAccessToken]);

  return <>{children}</>;
}
