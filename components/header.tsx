'use client';

import React from "react"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { User } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import { publicPaths } from '@/app/(main)/config';

export function Header() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const pathname = usePathname();
  const openLoginModal = useAuthStore((state) => state.openLoginModal);

  // Check if current path is public
  const isPublicPath = publicPaths.some((path) => {
    if (path === pathname) return true;
    if (path.endsWith('/*')) {
      const basePath = path.slice(0, -2);
      return pathname.startsWith(basePath);
    }
    return false;
  });

  // Handle sign in based on current path
  const handleSignIn = () => {
    if (isPublicPath) {
      // For public paths like /community, use custom login modal
      openLoginModal('human');
    } else {
      // For protected paths, use Privy login directly
      login();
    }
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/nofa-logo.svg" alt="NOFA Logo" className="h-[27px]" />
        </div>

      </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              pathname === '/'
                ? 'text-foreground bg-accent'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Create
          </Link>
          <Link
            href="/community"
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              pathname?.startsWith('/community')
                ? 'text-foreground bg-accent'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Community
          </Link>
        </nav>

      {/* Right Side - User Avatar or Login Button */}
      {!ready ? (
        <div className="w-9 h-9" />
      ) : authenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 bg-amber-500 hover:bg-amber-600">
              <User className="w-5 h-5 text-white" weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {user?.email?.address || user?.wallet?.address || 'My Account'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="justify-between">
              <span>Profile Settings</span>
              <span className="text-xs text-muted-foreground">Soon</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="justify-between">
              <span>API Keys</span>
              <span className="text-xs text-muted-foreground">Soon</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="justify-between">
              <span>Connected Exchanges</span>
              <span className="text-xs text-muted-foreground">Soon</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="justify-between">
              <span>Help & Support</span>
              <span className="text-xs text-muted-foreground">Soon</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={logout}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          onClick={handleSignIn}
          variant="default"
        >
          Sign In
        </Button>
      )}
    </header>
  );
}
