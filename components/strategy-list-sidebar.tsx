'use client';

import { useState } from 'react';
import { Plus, CaretLeft, CaretRight, Trash, DotsThree } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStrategyStore } from '@/lib/store/strategy-store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function StrategyListSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);

  const {
    strategies,
    currentStrategyId,
    createStrategy,
    deleteStrategy,
    setCurrentStrategy,
  } = useStrategyStore();

  const handleCreateStrategy = () => {
    createStrategy();
  };

  const handleDeleteStrategy = () => {
    if (strategyToDelete) {
      deleteStrategy(strategyToDelete);
      setStrategyToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const confirmDelete = (id: string) => {
    setStrategyToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-border bg-card flex flex-col items-center py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-3"
        >
          <CaretRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCreateStrategy}
          className="text-primary"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border h-[49px]">
          <h2 className="font-medium text-sm">Strategies</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateStrategy}
              className="h-7 w-7 text-primary"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-7 w-7"
            >
              <CaretLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {strategies.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No strategies yet. Create your first one to get started.
              </p>
              <Button onClick={handleCreateStrategy} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Strategy
              </Button>
            </div>
          ) : (
            <div className="p-2">
              {[...strategies].reverse().map((strategy) => (
                <div
                  key={strategy.id}
                  className={cn(
                    'group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
                    currentStrategyId === strategy.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => setCurrentStrategy(strategy.id)}
                >
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {strategy.strategyTree.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {dayjs(strategy.updatedAt).fromNow()}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DotsThree className="w-4 h-4" weight="bold" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(strategy.id);
                        }}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this strategy? This action cannot
              be undone and will also delete all associated chat history and
              backtest results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStrategy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
