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
import { runBacktest as runBacktestAPI } from '@/lib/backtest';
import { BacktestDialog } from '@/components/backtest-dialog';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import BigNumber from 'bignumber.js';

interface BacktestResultsProps {
  onReadyToRunBacktest?: (runner: () => Promise<void>) => void;
}

export function BacktestResults({ onReadyToRunBacktest }: BacktestResultsProps) {
  const [backtestDialogOpen, setBacktestDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [backtestParams, setBacktestParams] = useState<BacktestParams>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    initialCapital: 10000,
    tradingFee: 0.0005,
    timeframe: '1H',
    slippage: 0.001,
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
      const result = await runBacktestAPI(strategyTree, backtestParams);
      addBacktestResult(currentStrategyId, result);
    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [currentStrategyId, isStrategyValid, strategyTree, backtestParams, addBacktestResult]);

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Portfolio Value Over Time</h3>
            <div className="text-xs text-muted-foreground">
              Initial: ${latestResult.params.initialCapital.toLocaleString()} | Final: ${(latestResult.params.initialCapital + (latestResult.performanceData[latestResult.performanceData.length - 1]?.value - latestResult.params.initialCapital || 0)).toLocaleString()}
            </div>
          </div>
          <PerformanceChart
            data={latestResult.performanceData}
            benchmarkData={latestResult.benchmarkData}
          />
        </div>

        {/* Positions Table */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Trade History</h3>
            <span className="text-xs text-muted-foreground">
              {latestResult.positions.length} {latestResult.positions.length === 1 ? 'trade' : 'trades'}
            </span>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Entry Price</TableHead>
                  <TableHead className="text-right">Exit Price</TableHead>
                  <TableHead className="text-right">P&L (USD)</TableHead>
                  <TableHead className="text-right">Return %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestResult.positions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      No trades executed during backtest period
                    </TableCell>
                  </TableRow>
                ) : (
                  latestResult.positions.map((position, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm font-mono">{position.date}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {position.symbol}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded',
                            position.direction === 'LONG'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {position.direction}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        ${position.entry.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        ${position.exit.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right text-sm font-medium font-mono',
                          position.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {position.pnl >= 0 ? '+' : ''}${Math.abs(position.pnl).toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right text-sm font-medium font-mono',
                          position.pnlPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
  const [showMarket, setShowMarket] = useState(false);

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
        ...(showMarket ? [{
          name: 'Market',
          data: benchmarkData.map((d) => d.value),
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#6b7280', width: 2, type: 'dashed' },
        }] : []),
      ],
      legend: {
        data: showMarket ? ['Strategy', 'Market'] : ['Strategy'],
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
  }, [data, showMarket]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors hidden">
          <input
            type="checkbox"
            checked={showMarket}
            onChange={(e) => setShowMarket(e.target.checked)}
            className="w-4 h-4 rounded border border-input"
          />
          Show Market Benchmark
        </label>
      </div>
      <div ref={chartRef} className="w-full h-64" />
    </div>
  );
}

