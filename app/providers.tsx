'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Missing NEXT_PUBLIC_PRIVY_APP_ID for PrivyProvider.');
    }
  }

  return (
    <PrivyProvider appId={appId || ''}>
      {children}
    </PrivyProvider>
  );
}
