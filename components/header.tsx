'use client';

import React from "react"

import { useRef, useEffect, useState } from 'react';
import { ArrowCounterClockwise, ArrowClockwise, User } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStrategyStore } from '@/lib/store/strategy-store';

export function Header() {
  const { 
    history, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    updateStrategyName,
    currentStrategyId 
  } = useStrategyStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const nameRef = useRef<HTMLSpanElement>(null);

  const strategyName = history.present.name;

  useEffect(() => {
    if (nameRef.current && !isEditing) {
      nameRef.current.textContent = strategyName;
    }
  }, [strategyName, isEditing]);

  const handleNameBlur = () => {
    setIsEditing(false);
    const newName = nameRef.current?.textContent?.trim() || 'Untitled Strategy';
    if (newName !== strategyName) {
      updateStrategyName(newName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nameRef.current?.blur();
    }
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-foreground"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <span className="font-semibold text-foreground">StrategyForge</span>
        </div>

        {/* Strategy Name (Editable) */}
        {currentStrategyId && (
          <>
            <div className="w-px h-6 bg-border" />
            <span
              ref={nameRef}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => setIsEditing(true)}
              onBlur={handleNameBlur}
              onKeyDown={handleKeyDown}
              className="text-sm text-muted-foreground hover:text-foreground focus:text-foreground focus:outline-none cursor-text px-2 py-1 rounded hover:bg-muted focus:bg-muted min-w-[100px]"
            >
              {strategyName}
            </span>
          </>
        )}

        {/* Undo/Redo Buttons */}
        {currentStrategyId && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo()}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowCounterClockwise className="w-4 h-4 mr-1" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo()}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowClockwise className="w-4 h-4 mr-1" />
              Redo
            </Button>
          </div>
        )}
      </div>

      {/* Right Side - User Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 bg-amber-500 hover:bg-amber-600">
            <User className="w-5 h-5 text-white" weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile Settings</DropdownMenuItem>
          <DropdownMenuItem>API Keys</DropdownMenuItem>
          <DropdownMenuItem>Connected Exchanges</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Help & Support</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
