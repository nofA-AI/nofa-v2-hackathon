import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  createSeriesMarkers,
  ISeriesMarkersPluginApi,
  SeriesMarker,
  MouseEventParams,
  Time,
  CandlestickSeries,
  ColorType,
  TickMarkType,
  CrosshairMode,
} from 'lightweight-charts';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { convertToChartData, fetchKlines } from '@/lib/api/aster';
import { Skeleton } from '../ui/skeleton';
import { fmtUSD, getDecimalPlacesBySymbol } from '@/lib/utils/formatters';
import { useAsterWsRealTimePrice } from '@/lib/api/hooks/aster-websocket';

interface CandleData extends CandlestickData {
  time: Time;
}

// Generate random OHLC from a base close price (for real-time simulation only)
function randomBar(lastClose: number) {
  const randomNumber = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const open = +randomNumber(lastClose * 0.95, lastClose * 1.05);
  const close = +randomNumber(open * 0.95, open * 1.05);
  const high = +randomNumber(
    Math.max(open, close),
    Math.max(open, close) * 1.1
  );
  const low = +randomNumber(Math.min(open, close) * 0.9, Math.min(open, close));

  return {
    open,
    high,
    low,
    close,
  };
}

// Datafeed class for managing chart data
class Datafeed {
  private _data: CandleData[];
  private _earliestTime: number;
  private _latestTime: number;
  private _interval: string;
  private _symbol: string;

  constructor(initialData: CandleData[], symbol: string, interval: string) {
    this._data = initialData;
    this._symbol = symbol;
    this._interval = interval;

    if (initialData.length > 0) {
      this._earliestTime = initialData[0].time as number;
      this._latestTime = initialData[initialData.length - 1].time as number;
    } else {
      this._earliestTime = 0;
      this._latestTime = 0;
    }
  }

  // Get current data
  getAllData(): CandleData[] {
    return this._data;
  }

  // Load more historical bars (for infinite scroll left) - fetch from Asterdex API
  async getHistoricalBars(numberOfExtraBars: number): Promise<CandleData[]> {
    try {
      const intervalMs = this.getIntervalMs();

      // Calculate time range for historical data
      // Use the earliest time minus 1 interval to avoid overlap
      const endTime = (this._earliestTime - 1) * 1000; // Convert to milliseconds and subtract 1 second

      console.log(
        `Fetching ${numberOfExtraBars} bars before ${new Date(
          endTime
        ).toISOString()}`
      );

      // Fetch real historical data from Asterdex
      const klines = await fetchKlines({
        symbol: this._symbol.toUpperCase(),
        interval: this._interval,
        limit: numberOfExtraBars,
        endTime: endTime,
      });

      console.log(`Received ${klines.length} bars from API`);

      // Convert to chart format
      const historicalData = convertToChartData(klines) as CandleData[];

      // Filter out any data that overlaps with existing data (defensive)
      const existingTimes = new Set(this._data.map((d) => d.time));
      const newData = historicalData.filter((d) => !existingTimes.has(d.time));

      console.log(`After filtering duplicates: ${newData.length} unique bars`);

      // Prepend to existing data
      this._data = [...newData, ...this._data];

      if (newData.length > 0) {
        this._earliestTime = newData[0].time as number;
        console.log(
          `New earliest time: ${new Date(
            this._earliestTime * 1000
          ).toISOString()}`
        );
      }

      return this._data;
    } catch (error) {
      console.error('Failed to fetch historical data, using mock data:', error);

      // Fallback to mock data if API fails
      const intervalMs = this.getIntervalMs();
      const historicalData: CandleData[] = [];

      const lastClose = this._data.length > 0 ? this._data[0].close : 200;
      let currentClose = lastClose;

      for (let i = numberOfExtraBars; i > 0; i--) {
        const time = this._earliestTime - (i * intervalMs) / 1000;
        const candle = randomBar(currentClose);
        currentClose = candle.close;

        historicalData.push({
          time: time as Time,
          ...candle,
        });
      }

      this._data = [...historicalData, ...this._data];
      if (historicalData.length > 0) {
        this._earliestTime = historicalData[0].time as number;
      }

      return this._data;
    }
  }

  // Generate next real-time bar (for live updates)
  getNextRealtimeBar(): CandleData {
    const intervalMs = this.getIntervalMs();
    this._latestTime += intervalMs / 1000;

    const lastClose =
      this._data.length > 0 ? this._data[this._data.length - 1].close : 200;
    const candle = randomBar(lastClose);

    const newCandle: CandleData = {
      time: this._latestTime as Time,
      ...candle,
    };

    this._data.push(newCandle);
    return newCandle;
  }

  // Convert interval string to milliseconds
  private getIntervalMs(): number {
    const value = parseInt(this._interval);
    const unit = this._interval.replace(value.toString(), '');

    switch (unit) {
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 60 * 1000; // default 1 minute
    }
  }
}

export const TradingViewLightSeriesChart = ({
  symbol = 'BTCUSDT',
  interval = '1d',
  markers,
  tradeTooltips,
  endTime,
}: {
  symbol: string;
  interval?: string;
  markers?: SeriesMarker<Time>[];
  tradeTooltips?: Array<{
    time: Time;
    openTime: string;
    closeTime: string;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    direction: 'LONG' | 'SHORT';
  }>;
  endTime?: number | null;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const datafeedRef = useRef<Datafeed | null>(null);
  const realtimeIntervalRef = useRef<number | null>(null);
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);
  const loadHistoryTimeoutRef = useRef<number | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const markersDataRef = useRef<SeriesMarker<Time>[]>([]);
  const tradeTooltipsRef = useRef<
    Array<{
      time: Time;
      openTime: string;
      closeTime: string;
      entryPrice: number;
      exitPrice: number;
      pnl: number;
      direction: 'LONG' | 'SHORT';
    }>
  >([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const tooltipSizeRef = useRef({ width: 130, height: 80, margin: 12 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState({
    totalBars: 0,
    historicalLoads: 0,
    realtimeUpdates: 0,
  });

  // 重新获取 K 线数据的函数 - 完全重置图表
  const refetchKlines = useCallback(async () => {
    if (!seriesRef.current || !chartRef.current || !datafeedRef.current) {
      console.warn('Chart not fully initialized, skipping refetch');
      return;
    }

    try {
      console.log('Refetching klines after reconnect...');

      // 显示loading状态
      setLoading(true);
      setError(null);

      // 获取新的K线数据
      const klines = await fetchKlines({
        symbol: symbol.toUpperCase(),
        interval,
        limit: 1000,
      });

      const chartData = convertToChartData(klines) as CandleData[];

      if (chartData.length === 0) {
        throw new Error('No chart data received');
      }

      // 完全重新初始化 datafeed
      const datafeed = new Datafeed(chartData, symbol, interval);
      datafeedRef.current = datafeed;

      // 完全清空并重置图表数据
      seriesRef.current.setData([]);

      // 设置新数据
      seriesRef.current.setData(chartData);

      // 重置可视范围到最后100根K线
      const totalBars = chartData.length;
      if (totalBars > 0) {
        const barsToShow = Math.min(100, totalBars);
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: totalBars - barsToShow,
          to: totalBars - 1,
        });
      }

      // 更新统计数据
      setStats({
        totalBars: chartData.length,
        historicalLoads: 0,
        realtimeUpdates: 0,
      });

      console.log(`Chart reset complete: ${chartData.length} bars loaded`);
    } catch (error) {
      console.error('Failed to refetch klines:', error);
      setError(error instanceof Error ? error.message : 'Failed to reload chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const { latestKline } = useAsterWsRealTimePrice({
    symbol,
    interval,
    onReconnect: refetchKlines,
  });

  useEffect(() => {
    isMountedRef.current = true;
    let chart: IChartApi | null = null;
    let series: ISeriesApi<'Candlestick'> | null = null;

    const initChart = async () => {
      if (!containerRef.current) {
        console.warn('Container ref not available yet');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Fetch real data from Asterdex
        const klines = await fetchKlines({
          symbol: symbol.toUpperCase(),
          interval,
          limit: 1000,
        });

        const chartData = convertToChartData(klines) as CandleData[];

        if (!containerRef.current) return;

        // Initialize datafeed with real data
        const datafeed = new Datafeed(chartData, symbol, interval);
        datafeedRef.current = datafeed;

        const chartSize = {
          width: chartWrapperRef.current?.clientWidth || 0,
          height: chartWrapperRef.current?.clientHeight || 0,
        };

        const chartOptions = {
          ...(chartSize.width ? { width: chartSize.width } : {}),
          ...(chartSize.height ? { height: chartSize.height } : {}),
          layout: {
            textColor: '#111827',
            background: { type: ColorType.Solid, color: '#ffffff' },
          },
          crosshair: {
            mode: CrosshairMode.Normal, // Free-moving crosshair (not magnetic)
          },
          localization: {
            timeFormatter: (time: number | string) => {
              // For hover/tooltip
              const timestamp =
                typeof time === 'string' ? parseInt(time) : time;
              const date = new Date(timestamp * 1000);
              return format(date, 'MM-dd HH:mm');
            },
          },
          timeScale: {
            timeVisible: true,
            borderVisible: true,
            borderColor: 'rgba(148, 163, 184, 0.6)',
            tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) => {
              const date = new Date((time as number) * 1000);
              const locale = 'en-US';
              switch (tickMarkType) {
                case TickMarkType.Year:
                  return date.toLocaleDateString(locale, {
                    year: 'numeric',
                  });
                case TickMarkType.Month:
                  return date.toLocaleDateString(locale, {
                    month: 'short',
                  });
                case TickMarkType.DayOfMonth:
                  return date.toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'short',
                  });
                case TickMarkType.Time:
                  return date.toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  });
                case TickMarkType.TimeWithSeconds:
                  return date.toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  });
                default:
                  return new Date((time as number) * 1000).toLocaleTimeString(
                    locale,
                    {
                      hour12: false,
                    }
                  );
              }
            },
          },
          grid: {
            vertLines: {
              color: '#e5e7eb',
            },
            horzLines: {
              color: '#e5e7eb',
            },
          },
        };

        chart = createChart(containerRef.current, chartOptions);
        chartRef.current = chart;

        series = chart.addSeries(CandlestickSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => {
              // Display original price value without decimal limitation
              return fmtUSD(price, {
                decimalPlaces: getDecimalPlacesBySymbol(symbol),
              });
            },
          },
        });
        seriesRef.current = series;

        // Set initial data
        series.setData(chartData);
        markersRef.current = createSeriesMarkers(series, markers || []);
        setStats((prev) => ({ ...prev, totalBars: chartData.length }));

        // Set visible range to end at the provided time (if any), otherwise show the last 100 bars
        const totalBars = chartData.length;
        if (totalBars > 0) {
          if (endTime) {
            const endIndex = chartData.reduce((acc, bar, idx) => {
              const barTime = bar.time as number;
              return barTime <= endTime ? idx : acc;
            }, -1);

            if (endIndex >= 0) {
              const barsToShow = Math.min(100, endIndex + 1);
              chart.timeScale().setVisibleLogicalRange({
                from: endIndex - (barsToShow - 1),
                to: endIndex,
              });
            }
          } else {
            const barsToShow = Math.min(100, totalBars);
            chart.timeScale().setVisibleLogicalRange({
              from: totalBars - barsToShow,
              to: totalBars - 1,
            });
          }
        }

        // Handle window resize
        const handleResize = () => {
          if (chartWrapperRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartWrapperRef.current.clientWidth,
              height: chartWrapperRef.current.clientHeight,
            });
          }
        };
        window.addEventListener('resize', handleResize);

        if (chartWrapperRef.current) {
          resizeObserverRef.current = new ResizeObserver(() => {
            if (!chartWrapperRef.current || !chartRef.current) return;
            const width = chartWrapperRef.current.clientWidth;
            const height = chartWrapperRef.current.clientHeight;
            if (width <= 0 || height <= 0) return;
            chartRef.current.applyOptions({ width, height });
            if (seriesRef.current && datafeedRef.current) {
              seriesRef.current.setData([...datafeedRef.current.getAllData()]);
            }
          });
          resizeObserverRef.current.observe(chartWrapperRef.current);
        }

        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.display = 'none';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '10';
        tooltip.style.borderRadius = '6px';
        tooltip.style.border = '1px solid rgba(148, 163, 184, 0.5)';
        tooltip.style.background = 'rgba(255, 255, 255, 0.95)';
        tooltip.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.12)';
        tooltip.style.padding = '6px 8px';
        tooltip.style.fontSize = '11px';
        tooltip.style.color = '#0f172a';
        chartWrapperRef.current?.appendChild(tooltip);

        const handleCrosshairMove = (param: MouseEventParams<Time>) => {
          if (
            !param.time ||
            !param.point ||
            !chartWrapperRef.current ||
            !seriesRef.current ||
            param.point.x < 0 ||
            param.point.x > chartWrapperRef.current.clientWidth ||
            param.point.y < 0 ||
            param.point.y > chartWrapperRef.current.clientHeight
          ) {
            tooltip.style.display = 'none';
            return;
          }

          const timeScale = chartRef.current?.timeScale();
          const crosshairIndex = timeScale?.timeToIndex(param.time as Time, true);
          if (crosshairIndex == null) {
            tooltip.style.display = 'none';
            return;
          }

          const matches = tradeTooltipsRef.current.filter((trade) => {
            const markerIndex = timeScale?.timeToIndex(trade.time as Time, true);
            return markerIndex != null && Math.abs(markerIndex - crosshairIndex) <= 0;
          });
          if (matches.length === 0) {
            tooltip.style.display = 'none';
            return;
          }

          const first = matches[0];
          const isShort = first.direction === 'SHORT';
          const titleColor = isShort ? '#ef4444' : '#10b981';
          const dateStr = dayjs.unix((param.time as number)).format('YYYY-MM-DD HH:mm');
          const pnl = first.pnl;
          const pnlColor = pnl >= 0 ? '#10b981' : '#ef4444';
          const pnlText = `${pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}%`;
          tooltip.innerHTML = `
            <div style="color:${titleColor};font-weight:600;">${first.direction}</div>
            <div style="margin-top:2px;">Entry: ${fmtUSD(first.entryPrice)}</div>
            <div>Exit: ${fmtUSD(first.exitPrice)}</div>
            <div style="color:${pnlColor};margin-top:0px;">PnL: ${pnlText}</div>
          `;

          const coordinate = seriesRef.current.priceToCoordinate(first.entryPrice);
          if (coordinate == null) {
            tooltip.style.display = 'none';
            return;
          }

          const { width, height, margin } = tooltipSizeRef.current;
          let left = param.point.x - width / 2;
          left = Math.max(0, Math.min(chartWrapperRef.current.clientWidth - width, left));
          const top =
            coordinate - height - margin > 0
              ? coordinate - height - margin
              : Math.max(
                  0,
                  Math.min(chartWrapperRef.current.clientHeight - height - margin, coordinate + margin)
                );

          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
          tooltip.style.width = `${width}px`;
          tooltip.style.height = `${height}px`;
          tooltip.style.display = 'block';
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);

        // Infinite scroll handler - load more data when scrolling left
        const handleVisibleRangeChange = async (logicalRange: any) => {
          if (!logicalRange || isLoadingRef.current) return;

          // When user scrolls near the left edge, load more historical data
          if (logicalRange.from < 10) {
            isLoadingRef.current = true;

            // Load historical data in chunks
            const numberBarsToLoad = 1000;

            console.log(`Loading ${numberBarsToLoad} historical bars...`);

            loadHistoryTimeoutRef.current = window.setTimeout(async () => {
              // Check if component is still mounted
              if (!isMountedRef.current) {
                isLoadingRef.current = false;
                return;
              }

              if (
                datafeedRef.current &&
                seriesRef.current &&
                chartRef.current
              ) {
                try {
                  const beforeLength = datafeedRef.current.getAllData().length;

                  const allData = await datafeedRef.current.getHistoricalBars(
                    numberBarsToLoad
                  );

                  // Check again after async operation
                  if (!isMountedRef.current || !seriesRef.current) {
                    isLoadingRef.current = false;
                    return;
                  }

                  seriesRef.current.setData(allData);

                  const actualLoaded = allData.length - beforeLength;

                  console.log(
                    `Loaded ${actualLoaded} new bars, total: ${allData.length}`
                  );

                  setStats((prev) => ({
                    ...prev,
                    totalBars: allData.length,
                    historicalLoads: prev.historicalLoads + 1,
                  }));
                } catch (error) {
                  console.error('Error loading historical data:', error);
                } finally {
                  isLoadingRef.current = false;
                  loadHistoryTimeoutRef.current = null;
                }
              } else {
                isLoadingRef.current = false;
                loadHistoryTimeoutRef.current = null;
              }
            }, 250);
          }
        };

        chart
          .timeScale()
          .subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

        setLoading(false);

        return () => {
          // Cleanup in correct order

          // Cancel any pending load history timeout
          if (loadHistoryTimeoutRef.current) {
            clearTimeout(loadHistoryTimeoutRef.current);
            loadHistoryTimeoutRef.current = null;
          }

          // Stop realtime updates
          if (realtimeIntervalRef.current) {
            clearInterval(realtimeIntervalRef.current);
            realtimeIntervalRef.current = null;
          }

          // Remove event listeners
          window.removeEventListener('resize', handleResize);
          chartRef.current?.unsubscribeCrosshairMove(handleCrosshairMove);
          tooltip.remove();
          resizeObserverRef.current?.disconnect();
          resizeObserverRef.current = null;

          // Clear refs before removing chart
          markersRef.current?.detach();
          markersRef.current = null;
          seriesRef.current = null;
          datafeedRef.current = null;

          if (chartRef.current) {
            chartRef.current.remove();
          }
          chartRef.current = null;
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart');
        setLoading(false);
      }
    };

    initChart();

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Cancel any pending load history timeout
      if (loadHistoryTimeoutRef.current) {
        clearTimeout(loadHistoryTimeoutRef.current);
        loadHistoryTimeoutRef.current = null;
      }

      // Stop realtime updates
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }

      // Clear refs and remove chart
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markersRef.current?.detach();
      markersRef.current = null;
      seriesRef.current = null;
      datafeedRef.current = null;

      if (chart) {
        chart.remove();
      }
      chartRef.current = null;
    };
  }, [symbol, endTime]);

  useEffect(() => {
    if (markersRef.current) {
      markersRef.current.setMarkers(markers || []);
    }
    markersDataRef.current = markers || [];
  }, [markers]);

  useEffect(() => {
    tradeTooltipsRef.current = tradeTooltips || [];
  }, [tradeTooltips]);

  // Real-time price updates from WebSocket
  useEffect(() => {
    if (!latestKline || !seriesRef.current || !datafeedRef.current) return;

    // Only update if the symbol matches
    if (latestKline.symbol.toLowerCase() !== symbol.toLowerCase()) return;

    try {
      // latestKline.time 是 K线开始时间（毫秒），来自 kline.t
      // LightweightCharts 使用秒为单位
      const klineTime =
        latestKline.time > 1e12
          ? Math.floor(latestKline.time / 1000)
          : latestKline.time;
      const open = parseFloat(latestKline.open);
      const high = parseFloat(latestKline.high);
      const low = parseFloat(latestKline.low);
      const close = parseFloat(latestKline.close);

      // Get current data from datafeed
      const allData = datafeedRef.current.getAllData();
      if (allData.length === 0) return;

      const lastBar = allData[allData.length - 1];
      const lastBarTime = lastBar.time as number;

      const newCandle: CandleData = {
        time: klineTime as Time,
        open,
        high,
        low,
        close,
      };

      // 如果是同一个 K线，更新数据
      if (klineTime === lastBarTime) {
        // 更新图表
        seriesRef.current.update(newCandle);

        // 同步更新 datafeed 中的数据，保持一致性
        allData[allData.length - 1] = newCandle;
        // Force a refresh in case the chart doesn't repaint
        seriesRef.current.setData([...allData]);
      }
      // 如果是新 K线，添加
      else if (klineTime > lastBarTime) {
        // 更新图表
        seriesRef.current.update(newCandle);

        // 同步添加到 datafeed 数据中，避免滑动加载历史数据后出现间隙
        allData.push(newCandle);
        // Ensure the chart sees the new bar
        seriesRef.current.setData([...allData]);

        setStats((prev) => ({
          ...prev,
          totalBars: prev.totalBars + 1,
          realtimeUpdates: prev.realtimeUpdates + 1,
        }));
      }

    } catch (error) {
      console.error('Error updating real-time kline:', error);
    }
  }, [latestKline, symbol]);

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
            background: '#ffffff',
          }}
        >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '24px',
              color: '#ef5350',
              marginBottom: '10px',
            }}
          >
            Error
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(19, 23, 34, 0.95)',
          }}
        >
          <Skeleton className="w-full h-full"></Skeleton>
        </div>
      )}
      <div ref={chartWrapperRef} className="relative w-full h-full">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </>
  );
};
