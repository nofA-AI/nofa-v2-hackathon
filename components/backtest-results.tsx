'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, ArrowsClockwise, ChartLine, Calendar, Wallet, Warning, Sparkle, Trash } from '@phosphor-icons/react';
import { jsPDF } from 'jspdf';
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
import { BacktestParams, BacktestResult, DEFAULT_BACKTEST_PARAMS } from '@/lib/types/strategy';
import { runBacktest as runBacktestAPI } from '@/lib/backtest';
import { BacktestDialog } from '@/components/backtest-dialog';
import { TradingViewLightSeriesChart } from '@/components/tradingview/tradingview-light-series-chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import BigNumber from 'bignumber.js';
import type { SeriesMarker, Time } from 'lightweight-charts';

interface BacktestResultsProps {
  onReadyToRunBacktest?: (runner: () => Promise<void>) => void;
  onSendMessage?: (message: { text: string; files?: File[] }) => void;
}

export function BacktestResults({ onReadyToRunBacktest, onSendMessage }: BacktestResultsProps) {
  const [backtestDialogOpen, setBacktestDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [backtestParams, setBacktestParams] = useState<BacktestParams>(DEFAULT_BACKTEST_PARAMS);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1);

  const { currentStrategyId, backtestResults, addBacktestResult, removeBacktestResult, history } =
    useStrategyStore();

  const currentResults = currentStrategyId
    ? backtestResults[currentStrategyId] || []
    : [];

  // Auto-select latest result when results change
  useEffect(() => {
    if (currentResults.length > 0) {
      setSelectedResultIndex(currentResults.length - 1);
    }
  }, [currentResults.length]);

  const latestResult = selectedResultIndex >= 0 && selectedResultIndex < currentResults.length
    ? currentResults[selectedResultIndex]
    : currentResults[currentResults.length - 1];

  // Check if strategy is valid for backtesting
  const strategyTree = latestResult?.strategyTree || history.present;
  const mainDecision = Array.isArray(strategyTree.mainDecision)
    ? strategyTree.mainDecision[0]
    : strategyTree.mainDecision;

  const isStrategyValid =
    mainDecision &&
    mainDecision.conditions.length > 0 &&
    (mainDecision.thenAction !== 'NO ACTION' || mainDecision.elseAction !== 'NO ACTION');

  const extractTicker = (rawSymbol?: string | null) => {
    if (!rawSymbol) return null;
    const normalized = rawSymbol.toUpperCase();
    if (normalized.includes('/')) return normalized.split('/')[0];
    if (normalized.includes('-')) return normalized.split('-')[0];
    if (normalized.endsWith('USDT')) return normalized.replace(/USDT$/, '');
    return normalized;
  };

  const chartTickers = (() => {
    const rawSymbols = latestResult?.positions?.map((position) => position.symbol) || [];
    const extracted = rawSymbols
      .map((rawSymbol) => extractTicker(rawSymbol))
      .filter((symbol): symbol is string => Boolean(symbol));

    const unique = Array.from(new Set(extracted));
    return unique.length > 0 ? unique : ['BTC'];
  })();

  const runBacktest = useCallback(async () => {
    if (!currentStrategyId || !isStrategyValid) return;

    setIsRunning(true);
    setBacktestDialogOpen(false);

    try {
      const result = await runBacktestAPI(strategyTree, backtestParams);
      addBacktestResult(currentStrategyId, {
        ...result,
        strategyTree: strategyTree,
      });
    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [currentStrategyId, isStrategyValid, strategyTree, backtestParams, addBacktestResult]);

  const handleAnalyzeBacktest = useCallback(async (result: BacktestResult) => {
    if (!onSendMessage) return;

    // Generate markdown content
    const markdown = generateBacktestMarkdown(result);

    // Generate PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add title
    doc.setFontSize(16);
    doc.text(`Backtest Result Report - ${result.id}`, 10, 15);

    // Add metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Strategy: ${result.strategyTree?.name || 'Unknown'}`, 10, 25);
    doc.text(`Date: ${dayjs(result.createdAt).format('YYYY-MM-DD HH:mm')}`, 10, 31);
    doc.setTextColor(0);

    // Split markdown into lines and add to PDF
    const lines = markdown.split('\n');
    let yPosition = 40;
    const lineHeight = 5;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    doc.setFontSize(11);
    for (const line of lines) {
      // Check if we need a new page
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Handle headers (lines starting with #)
      if (line.startsWith('# ')) {
        doc.setFontSize(14);
        doc.setFont('Helvetica', 'bold');
        doc.text(line.replace('# ', ''), margin, yPosition);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(11);
        yPosition += lineHeight + 2;
      } else if (line.startsWith('## ')) {
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.text(line.replace('## ', ''), margin, yPosition);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(11);
        yPosition += lineHeight + 1;
      } else if (line.startsWith('### ')) {
        doc.setFontSize(11);
        doc.setFont('Helvetica', 'bold');
        doc.text(line.replace('### ', ''), margin, yPosition);
        doc.setFont('Helvetica', 'normal');
        yPosition += lineHeight;
      } else if (line.trim() === '') {
        // Empty line
        yPosition += lineHeight / 2;
      } else if (line.startsWith('- ')) {
        // List item - handle bold formatting within list (including the dash)
        const parts = formatMarkdownText(line);
        yPosition = renderFormattedText(doc, parts, margin, yPosition, 190, lineHeight);
        yPosition += lineHeight / 2;
      } else {
        // Regular text - handle bold formatting
        const parts = formatMarkdownText(line);
        yPosition = renderFormattedText(doc, parts, margin, yPosition, 190, lineHeight);
      }
    }

    // Generate PDF as Data URL
    const pdfDataUrl = doc.output('datauristring');

    // Create a File object with PDF data URL
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `backtest-result-${result.id}.pdf`, { type: 'application/pdf' });

    // Add data URL to file object for compatibility
    Object.defineProperty(file, 'dataUrl', {
      value: pdfDataUrl,
      writable: false,
    });

    // Send message with attachment
    onSendMessage({
      text: 'Analyze backtest results and optimize strategy',
      files: [file],
    });
  }, [onSendMessage]);

  const handleDeleteBacktest = useCallback(() => {
    if (!currentStrategyId || !latestResult) return;
    const ok = window.confirm('Delete this backtest result? This cannot be undone.');
    if (!ok) return;
    removeBacktestResult(currentStrategyId, latestResult.id);
  }, [currentStrategyId, latestResult, removeBacktestResult]);

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
        {/* Result Selector */}
        {currentResults.length >= 1 && (
          <div className="bg-card rounded-lg mb-2">
            <Select
              value={selectedResultIndex.toString()}
              onValueChange={(value) => setSelectedResultIndex(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentResults.map((result, index) => {
                  const strategyName = result.strategyTree?.name || `Strategy ${result.strategyId}`;
                  const truncatedName = strategyName.length > 40 ? strategyName.slice(0, 40) + '...' : strategyName;
                  const returnValue = result.metrics.totalReturn;
                  const returnText = `${returnValue >= 0 ? '+' : ''}${returnValue.toFixed(2)}%`;

                  // Format date range
                  const startDate = dayjs(result.params.startDate);
                  const endDate = dayjs(result.params.endDate);
                  const isSameYear = startDate.year() === endDate.year();
                  const dateRange = isSameYear
                    ? `${startDate.format('YYYY-MM-DD')} to ${endDate.format('MM-DD')}`
                    : `${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`;

                  return (
                    <SelectItem key={index} value={index.toString()}>
                      <span className="flex items-center gap-2">
                        <span>{truncatedName}</span>
                        <span className="text-xs text-muted-foreground">
                          {dateRange} · {result.params.timeframe}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold",
                          returnValue >= 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          Return: {returnText}
                        </span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Strategy Info */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Backtest Info</h3>
            <span className="text-xs text-muted-foreground relative top-[1px]">
              {dayjs(latestResult.createdAt).format('YYYY-MM-DD HH:mm')}
            </span>
            </div>
            <div className="flex items-center gap-2">
              {onSendMessage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAnalyzeBacktest(latestResult)}
                  className="gap-1.5 text-xs h-7"
                >
                  <Sparkle className="w-3.5 h-3.5" weight="fill" />
                  Analyze Backtest
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteBacktest}
                className="gap-1.5 text-xs h-7 text-destructive hover:text-destructive"
              >
                <Trash className="w-3.5 h-3.5" />
                Delete
              </Button>

            </div>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {latestResult.params.startDate} to {latestResult.params.endDate} ({latestResult.params.timeframe})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5" />
              <span>
                Initial Capital: ${latestResult.params.initialCapital.toLocaleString()} | Fee: {(latestResult.params.tradingFee * 100).toFixed(2)}%{latestResult.params.slippage != null ? ` | Slippage: ${(latestResult.params.slippage * 100).toFixed(2)}%` : ''}
              </span>
            </div>
            {/* { latestResult.strategyTree && <div className="flex items-center gap-2">
              <ChartLine className="w-3.5 h-3.5" />
              <span className="font-medium">Strategy: {latestResult.strategyTree.name}</span>
            </div> } */}
          </div>
        </div>

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

        {/* Chart & Trade History */}
        <div className="bg-card rounded-lg border border-border p-4 pt-[6px]">
          <Tabs defaultValue="trades" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="trades">Trade History</TabsTrigger>
                {chartTickers.map((ticker) => (
                  <TabsTrigger key={ticker} value={`chart-${ticker}`}>
                    {ticker} K-line
                  </TabsTrigger>
                ))}
              </TabsList>
              <span className="text-xs text-muted-foreground">
                {latestResult.positions.length} {latestResult.positions.length === 1 ? 'trade' : 'trades'}
              </span>
            </div>
            {chartTickers.map((ticker) => {
              const markers: SeriesMarker<Time>[] = latestResult.positions
                .filter((position) => extractTicker(position.symbol) === ticker)
                .flatMap((position) => {
                  const openTime = dayjs(position.open_time);
                  if (!openTime.isValid()) return [];
                  const isLong = position.direction === 'LONG';
                  const openMarker: SeriesMarker<Time> = {
                    time: openTime.unix() as Time,
                    position: isLong ? 'belowBar' : 'aboveBar',
                    color: isLong ? '#10b981' : '#ef4444',
                    shape: 'circle',
                    text: isLong ? 'L' : 'S',
                  };
                  return [openMarker];
                });

              const tradeTooltips = latestResult.positions
                .filter((position) => extractTicker(position.symbol) === ticker)
                .map((position) => {
                  const openTime = dayjs(position.open_time);
                  if (!openTime.isValid()) return null;
                  return {
                    time: openTime.unix() as Time,
                    openTime: position.open_time,
                    closeTime: position.close_time,
                    entryPrice: position.entry_price,
                    exitPrice: position.exit_price,
                    pnl: position.return_pct,
                    direction: position.direction,
                  };
                })
                .filter((item): item is NonNullable<typeof item> => Boolean(item));

              const endTime = latestResult.positions
                .filter((position) => extractTicker(position.symbol) === ticker)
                .map((position) => dayjs(position.close_time || position.open_time))
                .filter((time) => time.isValid())
                .reduce<number | null>((max, time) => {
                  const unix = time.unix();
                  if (max == null || unix > max) return unix;
                  return max;
                }, null);

              return (
                <TabsContent key={ticker} value={`chart-${ticker}`}>
                  {/* K-line Chart (iframe) */}
                  <div className="w-full overflow-hidden" style={{
                    height: 'min(50vh, 500px)'
                  }}>
                    <TradingViewLightSeriesChart
                      symbol={`${ticker}USDT`}
                      markers={markers}
                      tradeTooltips={tradeTooltips}
                      endTime={endTime}
                    />
                  </div>
                </TabsContent>
              );
            })}
            <TabsContent value="trades">
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
                          <TableCell className="text-sm font-mono">{position.open_time}</TableCell>
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
                            ${formatPrice(position.entry_price)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-mono">
                            ${formatPrice(position.exit_price)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right text-sm font-medium font-mono',
                              position.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                            )}
                          >
                            {position.pnl >= 0 ? '+' : '-'}${Math.abs(position.pnl).toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right text-sm font-medium font-mono',
                              (position.return_pct ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                            )}
                          >
                            {(position.return_pct ?? 0) >= 0 ? '+' : ''}{formatPercent(position.return_pct)}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
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

function formatPrice(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toFixed(2);
}

function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toFixed(2);
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

// Helper function to parse markdown text with **bold** formatting
function formatMarkdownText(text: string): Array<{ text: string; bold: boolean }> {
  const parts: Array<{ text: string; bold: boolean }> = [];
  const regex = /\*\*(.*?)\*\*|([^\*]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // Bold text
      parts.push({ text: match[1], bold: true });
    } else if (match[2]) {
      // Regular text
      parts.push({ text: match[2], bold: false });
    }
  }

  return parts.length === 0 ? [{ text, bold: false }] : parts;
}

// Helper function to render formatted text with bold styling
function renderFormattedText(
  doc: any,
  parts: Array<{ text: string; bold: boolean }>,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Combine all parts into one text for line splitting
  const fullText = parts.map(p => p.text).join('');
  const lines = doc.splitTextToSize(fullText, maxWidth);

  let currentY = y;
  let textIndex = 0;

  for (const line of lines) {
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }

    // Render each line with mixed formatting
    renderLineWithFormatting(doc, line, parts, x, currentY);
    currentY += lineHeight;
  }

  doc.setFont('Helvetica', 'normal');
  return currentY;
}

// Helper function to render a single line with mixed formatting
function renderLineWithFormatting(
  doc: any,
  line: string,
  parts: Array<{ text: string; bold: boolean }>,
  x: number,
  y: number
): void {
  let currentX = x;
  let remainingLine = line;
  let partIndex = 0;
  let partOffset = 0;

  // Reconstruct the full text to track positions
  let fullText = '';
  for (const part of parts) {
    fullText += part.text;
  }

  // Find which parts are in this line
  let charCount = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const partLength = part.text.length;

    if (charCount + partLength > fullText.indexOf(line)) {
      // This part contains start of line
      const startInPart = Math.max(0, fullText.indexOf(line) - charCount);

      // Render from this part onwards
      let lineRemaining = line;
      let currentPartIdx = i;
      let offsetInPart = startInPart;

      while (lineRemaining && currentPartIdx < parts.length) {
        const currentPart = parts[currentPartIdx];
        const availableInPart = currentPart.text.length - offsetInPart;
        const toRender = lineRemaining.substring(0, availableInPart);

        if (toRender) {
          doc.setFont('Helvetica', currentPart.bold ? 'bold' : 'normal');
          doc.text(toRender, currentX, y);
          currentX += doc.getStringUnitWidth(toRender) * doc.internal.getFontSize() / doc.internal.scaleFactor;
          lineRemaining = lineRemaining.substring(toRender.length);
        }

        offsetInPart = 0;
        currentPartIdx++;
      }
      return;
    }
    charCount += partLength;
  }
}

// Helper function to generate markdown from backtest result
function generateBacktestMarkdown(result: BacktestResult): string {
  const { metrics, params, positions, strategyTree } = result;

  let markdown = `# Backtest Result Report\n\n`;
  markdown += `**Strategy**: ${strategyTree?.name || 'Unknown'}\n`;
  markdown += `**Date**: ${dayjs(result.createdAt).format('YYYY-MM-DD HH:mm')}\n\n`;

  markdown += `## Configuration\n\n`;
  markdown += `- **Period**: ${params.startDate} to ${params.endDate}\n`;
  markdown += `- **Timeframe**: ${params.timeframe}\n`;
  markdown += `- **Initial Capital**: $${params.initialCapital.toLocaleString()}\n`;
  markdown += `- **Trading Fee**: ${(params.tradingFee * 100).toFixed(2)}%\n`;
  if (params.slippage != null) {
    markdown += `- **Slippage**: ${(params.slippage * 100).toFixed(2)}%\n`;
  }
  markdown += `\n`;

  markdown += `## Performance Metrics\n\n`;
  markdown += `- **Total Return**: ${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}%\n`;
  markdown += `- **Annualized Return**: ${metrics.annualizedReturn >= 0 ? '+' : ''}${metrics.annualizedReturn.toFixed(2)}%\n`;
  markdown += `- **Max Drawdown**: ${metrics.maxDrawdown.toFixed(2)}%\n`;
  markdown += `- **Sharpe Ratio**: ${metrics.sharpeRatio.toFixed(2)}\n`;
  markdown += `- **Win Rate**: ${metrics.winRate.toFixed(1)}%\n`;
  markdown += `- **Total Trades**: ${metrics.totalTrades}\n`;
  markdown += `\n`;

  if (positions.length > 0) {
    markdown += `## Trade History\n\n`;
    markdown += `| Date | Symbol | Side | Entry | Exit | P&L | Return % |\n`;
    markdown += `|------|--------|------|-------|------|-----|----------|\n`;

    positions.forEach(position => {
      const pnlSign = position.pnl >= 0 ? '+' : '-';
      const returnSign = position.return_pct >= 0 ? '+' : '';
      markdown += `| ${position.open_time} | ${position.symbol} | ${position.direction} | $${position.entry_price.toFixed(2)} | $${position.exit_price.toFixed(2)} | ${pnlSign}$${Math.abs(position.pnl).toFixed(2)} | ${returnSign}${position.return_pct.toFixed(2)}% |\n`;
    });
    markdown += `\n`;
  }

  if (strategyTree) {
    markdown += `## Strategy Tree\n\n`;
    markdown += `\`\`\`json\n`;
    markdown += JSON.stringify(strategyTree, null, 2);
    markdown += `\n\`\`\`\n`;
  }

  return markdown;
}
