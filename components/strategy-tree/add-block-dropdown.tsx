'use client';

import { Plus, GitBranch, ChartLine, Scales, FunnelSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AddBlockDropdownProps {
  onAddIfElse: () => void;
  onAddAction: () => void;
  showAction?: boolean;
}

export function AddBlockDropdown({
  onAddIfElse,
  onAddAction,
  showAction = true,
}: AddBlockDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <div className="w-5 h-5 rounded-full border border-dashed border-current flex items-center justify-center">
            <Plus className="w-3 h-3" />
          </div>
          <span className="text-sm">Add a Block</span>
          <span className="text-xs text-muted-foreground">
            Conditions, Actions...
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Add Block
        </div>

        {showAction && (
          <DropdownMenuItem onClick={onAddAction} className="gap-3 py-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <ChartLine className="w-4 h-4 text-primary" weight="bold" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Allocate Block</div>
              <div className="text-xs text-muted-foreground">
                Add trading action (Long/Short)
              </div>
            </div>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={onAddIfElse} className="gap-3 py-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-blue-500" weight="bold" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">If/Else (Conditional)</div>
            <div className="text-xs text-muted-foreground">
              Use technical indicators to create if/then logic
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
