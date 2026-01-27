'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, ArrowsClockwise, ChartLine, Calendar, Wallet, Warning } from '@phosphor-icons/react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useStrategyStore } from '@/lib/store/strategy-store';
import { BacktestParams, BacktestResult } from '@/lib/types/strategy';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import BigNumber from 'bignumber.js';

// Mock backtest function
const mockRunBacktest = async (
  strategyId: string,
  params: BacktestParams
): Promise<Omit<BacktestResult, 'id' | 'createdAt'>> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate mock performance data
  const startDate = dayjs(params.startDate);
  const endDate = dayjs(params.endDate);
  const days = endDate.diff(startDate, 'day');

  const performanceData: { date: string; value: number }[] = [];
  let currentValue = params.initialCapital;

  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, 'day').format('YYYY-MM-DD');
    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * 0.02;
    currentValue = currentValue * (1 + change);
    performanceData.push({ date, value: currentValue });
  }

  // Generate benchmark data (market performance)
  const benchmarkData: { date: string; value: number }[] = [];
  let benchmarkValue = params.initialCapital;
  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, 'day').format('YYYY-MM-DD');
    // Market with slight upward trend
    const change = (Math.random() - 0.49) * 0.015;
    benchmarkValue = benchmarkValue * (1 + change);
    benchmarkData.push({ date, value: benchmarkValue });
  }

  // Generate mock positions
  const positions = [
    {
      date: startDate.add(5, 'day').format('YYYY-MM-DD'),
      symbol: 'BTC/USDT',
      direction: 'LONG' as const,
      entry: 42500,
      exit: 44200,
      pnl: 510,
      pnlPercent: 4.0,
    },
    {
      date: startDate.add(15, 'day').format('YYYY-MM-DD'),
      symbol: 'BTC/USDT',
      direction: 'SHORT' as const,
      entry: 45000,
      exit: 43500,
      pnl: 450,
      pnlPercent: 3.33,
    },
    {
      date: startDate.add(25, 'day').format('YYYY-MM-DD'),
      symbol: 'ETH/USDT',
      direction: 'LONG' as const,
      entry: 2800,
      exit: 2650,
      pnl: -225,
      pnlPercent: -5.36,
    },
    {
      date: startDate.add(35, 'day').format('YYYY-MM-DD'),
      symbol: 'BTC/USDT',
      direction: 'LONG' as const,
      entry: 41000,
      exit: 43800,
      pnl: 840,
      pnlPercent: 6.83,
    },
  ];

  const finalValue = performanceData[performanceData.length - 1]?.value || params.initialCapital;
  const totalReturn = ((finalValue - params.initialCapital) / params.initialCapital) * 100;

  return {
    strategyId,
    params,
    metrics: {
      totalReturn,
      annualizedReturn: totalReturn * (365 / days),
      maxDrawdown: -8.5,
      sharpeRatio: 1.45,
      winRate: 75,
      totalTrades: positions.length,
    },
    performanceData,
    benchmarkData,
    positions,
  };
};

interface BacktestResultsProps {
  onReadyToRunBacktest?: (runner: () => Promise<void>) => void;
}

export function BacktestResults({ onReadyToRunBacktest }: BacktestResultsProps) {
  const [backtestDialogOpen, setBacktestDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [backtestParams, setBacktestParams] = useState<BacktestParams>({
    startDate: dayjs().subtract(90, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    initialCapital: 10000,
    tradingFee: 0.001,
  });

  const { currentStrategyId, backtestResults, addBacktestResult, history } =
    useStrategyStore();

  const currentResults = currentStrategyId
    ? backtestResults[currentStrategyId] || []
    : [];

  const latestResult = currentResults[currentResults.length - 1];

  // Check if strategy is valid for backtesting
  const strategyTree = history.present;
  const mainDecision = Array.isArray(strategyTree.mainDecision)
    ? strategyTree.mainDecision[0]
    : strategyTree.mainDecision;

  const isStrategyValid =
    mainDecision &&
    mainDecision.conditions.length > 0 &&
    (mainDecision.thenAction !== 'NO ACTION' || mainDecision.elseAction !== 'NO ACTION');

  const runBacktest = useCallback(async () => {
    if (!currentStrategyId || !isStrategyValid) return;

    setIsRunning(true);
    setBacktestDialogOpen(false);

    try {
      const result = await mockRunBacktest(currentStrategyId, backtestParams);
      addBacktestResult(currentStrategyId, result);
    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [currentStrategyId, isStrategyValid, backtestParams, addBacktestResult]);

  useEffect(() => {
    if (onReadyToRunBacktest) {
      onReadyToRunBacktest(runBacktest);
    }
  }, [onReadyToRunBacktest, runBacktest]);

  if (!currentStrategyId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Strategy Selected</h3>
          <p className="text-muted-foreground text-sm">
            Select a strategy to view backtest results.
          </p>
        </div>
      </div>
    );
  }

  if (!isStrategyValid) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Warning className="w-6 h-6 text-amber-600" weight="bold" />
          </div>
          <h3 className="text-lg font-medium mb-2">Strategy Not Ready</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Your strategy needs at least one condition and one action to run a
            backtest. Please add conditions and actions in the Strategy Tree
            editor.
          </p>
        </div>
      </div>
    );
  }

  if (!latestResult && !isRunning) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ChartLine className="w-6 h-6 text-muted-foreground" weight="bold" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Backtest Results</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Run a backtest to see how your strategy would have performed.
          </p>
          <Button onClick={() => setBacktestDialogOpen(true)} className="gap-2">
            <Play className="w-4 h-4" weight="fill" />
            Run Backtest
          </Button>
        </div>

        <BacktestDialog
          open={backtestDialogOpen}
          onOpenChange={setBacktestDialogOpen}
          params={backtestParams}
          onParamsChange={setBacktestParams}
          onRun={runBacktest}
        />
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ArrowsClockwise className="w-6 h-6 text-primary animate-spin" weight="bold" />
          </div>
          <h3 className="text-lg font-medium mb-2">Running Backtest...</h3>
          <p className="text-muted-foreground text-sm">
            This may take a few moments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="Total Return"
            value={`${latestResult.metrics.totalReturn >= 0 ? '+' : ''}${latestResult.metrics.totalReturn.toFixed(2)}%`}
            isPositive={latestResult.metrics.totalReturn >= 0}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={latestResult.metrics.sharpeRatio.toFixed(2)}
          />
          <MetricCard
            label="Max Drawdown"
            value={`${latestResult.metrics.maxDrawdown.toFixed(2)}%`}
            isPositive={false}
          />
          <MetricCard
            label="Win Rate"
            value={`${latestResult.metrics.winRate.toFixed(1)}%`}
          />
          <MetricCard
            label="Total Trades"
            value={latestResult.metrics.totalTrades.toString()}
          />
          <MetricCard
            label="Annualized Return"
            value={`${latestResult.metrics.annualizedReturn >= 0 ? '+' : ''}${latestResult.metrics.annualizedReturn.toFixed(2)}%`}
            isPositive={latestResult.metrics.annualizedReturn >= 0}
          />
        </div>

        {/* Performance Chart */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium mb-4">Performance Chart</h3>
          <PerformanceChart
            data={latestResult.performanceData}
            benchmarkData={latestResult.benchmarkData}
          />
        </div>

        {/* Positions Table */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium mb-4">Position History</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestResult.positions.map((position, index) => (
                <TableRow key={index}>
                  <TableCell className="text-sm">{position.date}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {position.symbol}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded',
                        position.direction === 'LONG'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {position.direction}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    ${position.entry.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    ${position.exit.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right text-sm font-medium',
                      position.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {position.pnl >= 0 ? '+' : ''}${position.pnl.toLocaleString()} (
                    {position.pnlPercent >= 0 ? '+' : ''}
                    {position.pnlPercent.toFixed(2)}%)
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Rerun Button */}
        <div className="flex justify-center mb-8">
          <Button
            variant="outline"
            onClick={() => setBacktestDialogOpen(true)}
            className="gap-2"
          >
            <ArrowsClockwise className="w-4 h-4" />
            Run New Backtest
          </Button>
        </div>
      </div>

      <BacktestDialog
        open={backtestDialogOpen}
        onOpenChange={setBacktestDialogOpen}
        params={backtestParams}
        onParamsChange={setBacktestParams}
        onRun={runBacktest}
      />
    </ScrollArea>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  isPositive?: boolean;
}

function MetricCard({ label, value, isPositive }: MetricCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p
        className={cn(
          'text-lg font-semibold',
          isPositive === true && 'text-emerald-600',
          isPositive === false && 'text-red-600'
        )}
      >
        {value}
      </p>
    </div>
  );
}

interface PerformanceChartProps {
  data: { date: string; value: number }[];
  benchmarkData: { date: string; value: number }[];
}

function PerformanceChart({ data, benchmarkData }: PerformanceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0 || !benchmarkData || benchmarkData.length === 0) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      grid: {
        left: 60,
        right: 20,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.date),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#6b7280',
          fontSize: 10,
          formatter: (value: string) => dayjs(value).format('MMM D'),
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: {
          color: '#6b7280',
          fontSize: 10,
          formatter: (value: number) => `$${(value / 1000).toFixed(1)}k`,
        },
      },
      series: [
        {
          name: 'Strategy',
          data: data.map((d) => d.value),
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#008b52', width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 139, 82, 0.3)' },
              { offset: 1, color: 'rgba(0, 139, 82, 0.05)' },
            ]),
          },
        },
        {
          name: 'Market',
          data: benchmarkData.map((d) => d.value),
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#6b7280', width: 2, type: 'dashed' },
        },
      ],
      legend: {
        data: ['Strategy', 'Market'],
        bottom: 0,
        textStyle: { color: '#6b7280', fontSize: 11 },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown[]) => {
          const items = params as { seriesName: string; axisValue: string; value: number; color: string }[];
          let result = `${items[0].axisValue}<br/>`;
          items.forEach(item => {
            result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>`;
            result += `${item.seriesName}: $${item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}<br/>`;
          });
          return result;
        },
      },
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  return <div ref={chartRef} className="w-full h-64" />;
}

interface BacktestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: BacktestParams;
  onParamsChange: (params: BacktestParams) => void;
  onRun: () => void;
}

function BacktestDialog({
  open,
  onOpenChange,
  params,
  onParamsChange,
  onRun,
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onRun} className="gap-2">
            <Play className="w-4 h-4" weight="fill" />
            Run Backtest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
