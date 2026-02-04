'use client';

import React from "react"
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

export function Header() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/nofa-logo.svg" alt="NOFA Logo" className="h-[27px]" />
        </div>
      </div>

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
          onClick={login}
          variant="default"
        >
          Sign In
        </Button>
      )}
    </header>
  );
}
