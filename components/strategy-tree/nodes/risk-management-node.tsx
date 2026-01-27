'use client';

import { useState } from 'react';
import { CaretDown, CaretRight, PencilSimple, ShieldCheck } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { RiskManagement, ValueMode } from '@/lib/types/strategy';

interface RiskManagementNodeProps {
  risk: RiskManagement;
  onUpdate: (risk: RiskManagement) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function RiskManagementNode({
  risk,
  onUpdate,
  expanded,
  onToggle,
}: RiskManagementNodeProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState(risk);

  const handleSave = () => {
    onUpdate(editValues);
    setEditDialogOpen(false);
  };

  const formatValue = (mode: ValueMode, value: number) => {
    return mode === 'PCT' ? `${(value * 100).toFixed(1)}%` : value.toFixed(2);
  };

  return (
    <>
      <div className="ml-6 mt-2">
        <div
          className="group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer border border-orange-200 bg-orange-50"
          onClick={onToggle}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="w-4 h-4 flex items-center justify-center text-orange-600"
          >
            {expanded ? (
              <CaretDown className="w-3 h-3" weight="bold" />
            ) : (
              <CaretRight className="w-3 h-3" weight="bold" />
            )}
          </button>

          <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center">
            <ShieldCheck className="w-3 h-3 text-white" weight="bold" />
          </div>

          <span className="text-sm font-medium flex-1 text-orange-900">
            {risk.name}
          </span>

          <span className="text-xs text-orange-600">
            SL: {formatValue(risk.stopLoss.mode, risk.stopLoss.value)} | TP:{' '}
            {formatValue(risk.takeProfit.mode, risk.takeProfit.value)}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
            onClick={(e) => {
              e.stopPropagation();
              setEditValues(risk);
              setEditDialogOpen(true);
            }}
          >
            <PencilSimple className="w-3.5 h-3.5" />
          </Button>
        </div>

        {expanded && (
          <div className="ml-10 mt-2 space-y-1 text-sm text-muted-foreground">
            <div>Scope: {risk.scope}</div>
            <div>
              Stop Loss: {formatValue(risk.stopLoss.mode, risk.stopLoss.value)} (
              {risk.stopLoss.mode})
            </div>
            <div>
              Take Profit:{' '}
              {formatValue(risk.takeProfit.mode, risk.takeProfit.value)} (
              {risk.takeProfit.mode})
            </div>
          </div>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Risk Management</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editValues.name}
                onChange={(e) =>
                  setEditValues({ ...editValues, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stop Loss Mode</Label>
                <Select
                  value={editValues.stopLoss.mode}
                  onValueChange={(v: ValueMode) =>
                    setEditValues({
                      ...editValues,
                      stopLoss: { ...editValues.stopLoss, mode: v },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCT">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stop Loss Value</Label>
                <Input
                  type="number"
                  step={editValues.stopLoss.mode === 'PCT' ? '0.01' : '1'}
                  value={
                    editValues.stopLoss.mode === 'PCT'
                      ? editValues.stopLoss.value * 100
                      : editValues.stopLoss.value
                  }
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      stopLoss: {
                        ...editValues.stopLoss,
                        value:
                          editValues.stopLoss.mode === 'PCT'
                            ? Number(e.target.value) / 100
                            : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Take Profit Mode</Label>
                <Select
                  value={editValues.takeProfit.mode}
                  onValueChange={(v: ValueMode) =>
                    setEditValues({
                      ...editValues,
                      takeProfit: { ...editValues.takeProfit, mode: v },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCT">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Take Profit Value</Label>
                <Input
                  type="number"
                  step={editValues.takeProfit.mode === 'PCT' ? '0.01' : '1'}
                  value={
                    editValues.takeProfit.mode === 'PCT'
                      ? editValues.takeProfit.value * 100
                      : editValues.takeProfit.value
                  }
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      takeProfit: {
                        ...editValues.takeProfit,
                        value:
                          editValues.takeProfit.mode === 'PCT'
                            ? Number(e.target.value) / 100
                            : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
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
    </>
  );
}
