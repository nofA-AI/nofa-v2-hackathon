'use client';

import { useState } from 'react';
import { PencilSimple, Trash, TrendUp, TrendDown } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ActionBlock,
  OrderDirection,
  AllocateMode,
  Symbol as SymbolType,
  AVAILABLE_SYMBOLS,
} from '@/lib/types/strategy';

interface ActionBlockNodeProps {
  nodeId: string;
  action: ActionBlock;
  onUpdate: (action: ActionBlock) => void;
  onDelete: () => void;
}

export function ActionBlockNode({
  nodeId,
  action,
  onUpdate,
  onDelete,
}: ActionBlockNodeProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState(action);

  const handleSave = () => {
    onUpdate(editValues);
    setEditDialogOpen(false);
  };

  const isLong = action.direction === 'LONG';

  return (
    <>
      <div className="mt-2">
        <div
          className={cn(
            'group flex items-center gap-2 p-2 rounded-md cursor-pointer border',
            isLong
              ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
              : 'bg-red-50 border-red-200 hover:bg-red-100'
          )}
        >
          <div
            className={cn(
              'w-5 h-5 rounded flex items-center justify-center',
              isLong ? 'bg-emerald-500' : 'bg-red-500'
            )}
          >
            {isLong ? (
              <TrendUp className="w-3 h-3 text-white" weight="bold" />
            ) : (
              <TrendDown className="w-3 h-3 text-white" weight="bold" />
            )}
          </div>

          <span
            className={cn(
              'text-sm font-medium flex-1 truncate',
              isLong ? 'text-emerald-900' : 'text-red-900'
            )}
          >
            {action.name}
          </span>

          <span
            className={cn(
              'text-xs',
              isLong ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {action.direction} {action.symbol}{' '}
            {action.allocate.mode === 'WEIGHT'
              ? `${action.allocate.value}%`
              : `$${action.allocate.value}`}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6',
                isLong
                  ? 'hover:bg-emerald-200 text-emerald-700'
                  : 'hover:bg-red-200 text-red-700'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setEditValues(action);
                setEditDialogOpen(true);
              }}
            >
              <PencilSimple className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6',
                isLong
                  ? 'hover:bg-emerald-200 text-emerald-700'
                  : 'hover:bg-red-200 text-red-700'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
            >
              <Trash className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Allocate Block</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action Name</Label>
              <Input
                value={editValues.name}
                onChange={(e) =>
                  setEditValues({ ...editValues, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Select
                  value={editValues.symbol}
                  onValueChange={(v: SymbolType) =>
                    setEditValues({ ...editValues, symbol: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_SYMBOLS.map((sym) => (
                      <SelectItem key={sym} value={sym}>
                        {sym}
                      </SelectItem>
                    ))}
                    {editValues.symbol && !AVAILABLE_SYMBOLS.includes(editValues.symbol) && (
                      <SelectItem value={editValues.symbol}>
                        {editValues.symbol}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={editValues.direction}
                  onValueChange={(v: OrderDirection) =>
                    setEditValues({ ...editValues, direction: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LONG">LONG</SelectItem>
                    <SelectItem value="SHORT">SHORT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Allocation Mode</Label>
                <Select
                  value={editValues.allocate.mode}
                  onValueChange={(v: AllocateMode) =>
                    setEditValues({
                      ...editValues,
                      allocate: { ...editValues.allocate, mode: v },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEIGHT">Weight (%)</SelectItem>
                    <SelectItem value="MARGIN">Margin ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {editValues.allocate.mode === 'WEIGHT'
                    ? 'Weight (%)'
                    : 'Margin ($)'}
                </Label>
                <Input
                  type="number"
                  value={editValues.allocate.value}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      allocate: {
                        ...editValues.allocate,
                        value: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Leverage (1-100x)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={editValues.leverage}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    leverage: Math.min(100, Math.max(1, Number(e.target.value))),
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Allocate Block</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this action? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
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
