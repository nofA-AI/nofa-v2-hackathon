'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  publicPaths?: string[];
}

export function AuthGuard({ children, publicPaths = [] }: AuthGuardProps) {
  const pathname = usePathname();
  const { ready, authenticated, login } = usePrivy();

  // Check if current path is public
  const isPublicPath = publicPaths.some((path) => {
    // Exact match
    if (path === pathname) return true;
    // Wildcard match (e.g., "/blog/*")
    if (path.endsWith('/*')) {
      const basePath = path.slice(0, -2);
      return pathname.startsWith(basePath);
    }
    return false;
  });

  // Loading state
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authenticated) {
    // Allow access to public paths
    if (isPublicPath) {
      return <>{children}</>;
    }

    // Show login prompt for protected paths
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 max-w-md px-6 text-center">
          {/* Logo */}
          <img src="/nofa-logo.svg" alt="NOFA Logo" className="h-12" />

          {/* Title and description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Welcome to NOFA Strategy</h1>
            <p className="text-muted-foreground">
              Please sign in to access the AI Trading Strategy Builder and start building your trading strategies.
            </p>
          </div>

          {/* Login button */}
          <Button
            onClick={login}
            size="lg"
            className="w-full"
          >
            Sign In
          </Button>

          {/* Additional info */}
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated - show children
  return <>{children}</>;
}
