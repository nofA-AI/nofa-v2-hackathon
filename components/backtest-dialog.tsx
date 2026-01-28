'use client';

import { Play } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BacktestParams } from '@/lib/types/strategy';

interface BacktestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: BacktestParams;
  onParamsChange: (params: BacktestParams) => void;
  onRun: () => void;
  isRunning?: boolean;
}

export function BacktestDialog({
  open,
  onOpenChange,
  params,
  onParamsChange,
  onRun,
  isRunning = false,
}: BacktestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run Backtest</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={params.startDate}
                onChange={(e) =>
                  onParamsChange({ ...params, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={params.endDate}
                onChange={(e) =>
                  onParamsChange({ ...params, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Initial Capital ($)</Label>
            <Input
              type="number"
              value={params.initialCapital}
              onChange={(e) =>
                onParamsChange({
                  ...params,
                  initialCapital: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Trading Fee (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={params.tradingFee * 100}
              onChange={(e) =>
                onParamsChange({
                  ...params,
                  tradingFee: Number(e.target.value) / 100,
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRunning}>
            Cancel
          </Button>
          <Button onClick={onRun} className="gap-2" disabled={isRunning}>
            {isRunning ? (
              <>
                <Spinner className="w-4 h-4" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" weight="fill" />
                Run Backtest
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
