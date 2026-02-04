import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import pako from 'pako';

// WebSocket 消息类型
export interface SubscribeMessage {
  method: 'SUBSCRIBE';
  params: string[];
  id: number;
}

export interface UnsubscribeMessage {
  method: 'UNSUBSCRIBE';
  params: string[];
  id: number;
}

export interface HeartbeatMessage {
  method: 'ping';
}

export type WSMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | HeartbeatMessage;

// K线数据类型
export interface KlineData {
  n: string; // network/chain
  a: string; // address
  i: string; // interval
  o: string; // open price
  h: string; // high price
  l: string; // low price
  c: string; // close price
  v: string; // volume
  t: number; // timestamp
}

// WebSocket返回的数据结构
export interface RealTimeData {
  channel: 'kline';
  data: KlineData[];
}
export interface AckResponse {
  channel: 'ack';
  data: { ack_id: string }[];
}

export interface RealTimeKline {
  symbol: string; // 交易对
  time: number; // 事件时间 (ms)
  open: string; // 开盘价
  high: string; // 最高价
  low: string; // 最低价
  close: string; // 收盘价
  volume: string; // 成交量
  interval: string; // K线周期
  isClosed: boolean; // K线是否已结束
}

// WebSocket Ready State
export const ReadyState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;
export type ReadyStateType = (typeof ReadyState)[keyof typeof ReadyState];

const ASTERDEX_WS_URL = 'wss://fstream.asterdex.com/compress/stream';
const HEARTBEAT_INTERVAL = 10000; // 10秒
const RECONNECT_DELAY = 1000; // 重连延迟
const MAX_RECONNECT_ATTEMPTS = 1000;

// 生成订阅ID
let subscriptionIdCounter = 1;
function generateSubscriptionId(): number {
  return subscriptionIdCounter++;
}

// 解压缩二进制数据
async function decompressMessage(data: MessageEvent['data']): Promise<any> {
  try {
    if (data instanceof Blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const decompressed = pako.inflate(new Uint8Array(arrayBuffer), {
            to: 'string',
          });
          resolve(JSON.parse(decompressed));
        };
        reader.readAsArrayBuffer(data);
      });
    } else if (data instanceof ArrayBuffer) {
      const decompressed = pako.inflate(new Uint8Array(data), {
        to: 'string',
      });
      return JSON.parse(decompressed);
    } else if (typeof data === 'string') {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to decompress message:', error);
    return null;
  }
}

// 订阅信息
interface Subscription {
  symbol: string;
  interval: string;
  subscriptionId: number;
  onReconnect?: () => void;
}

// 订阅 key 生成
function getSubscriptionKey(symbol: string, interval: string): string {
  return `${symbol.toLowerCase()}_${interval}`;
}

// 单例 WebSocket 管理器
class AsterWebSocketManager {
  private static instance: AsterWebSocketManager | null = null;

  private ws: WebSocket | null = null;
  private readyState: ReadyStateType = ReadyState.CLOSED;
  private subscriptions: Map<string, Subscription> = new Map();
  private klineData: Map<string, RealTimeKline> = new Map();
  private listeners: Set<() => void> = new Set();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private isIntentionallyClosed = false;

  private constructor() {
    // 监听页面可见性变化
    if (typeof document !== 'undefined') {
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
      window.addEventListener('focus', this.handleFocus);
    }
  }

  static getInstance(): AsterWebSocketManager {
    if (!AsterWebSocketManager.instance) {
      AsterWebSocketManager.instance = new AsterWebSocketManager();
    }
    return AsterWebSocketManager.instance;
  }

  // 订阅状态变化
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // 通知所有监听者
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  // 获取当前连接状态
  getReadyState(): ReadyStateType {
    return this.readyState;
  }

  // 获取指定 symbol 的 K线数据
  getKlineData(symbol: string, interval: string): RealTimeKline | null {
    const key = getSubscriptionKey(symbol, interval);
    return this.klineData.get(key) || null;
  }

  // 连接 WebSocket
  private connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.ws = new WebSocket(ASTERDEX_WS_URL);
    this.readyState = ReadyState.CONNECTING;
    this.notify();

    this.ws.onopen = () => {
      console.log('[AsterWS] Connected');
      this.readyState = ReadyState.OPEN;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      // 重新订阅所有已注册的 symbol
      this.resubscribeAll();
      this.notify();
    };

    this.ws.onmessage = async (event) => {
      const parsed = await decompressMessage(event.data);
      if (!parsed) return;

      this.handleMessage(parsed);
    };

    this.ws.onerror = (error) => {
      console.error('[AsterWS] Error:', error);
    };

    this.ws.onclose = () => {
      console.log('[AsterWS] Closed');
      this.readyState = ReadyState.CLOSED;
      this.stopHeartbeat();
      this.notify();

      // 自动重连
      if (!this.isIntentionallyClosed && this.subscriptions.size > 0) {
        this.scheduleReconnect();
      }
    };
  }

  // 处理接收到的消息
  private handleMessage(parsed: any): void {
    // 处理 continuous_kline 数据
    if (parsed.e === 'continuous_kline') {
      const kline = parsed.k;
      if (kline && parsed.ps) {
        const symbol = parsed.ps.toLowerCase();
        const interval = kline.i;
        const key = getSubscriptionKey(symbol, interval);

        const data: RealTimeKline = {
          symbol,
          time: kline.t,
          open: kline.o,
          high: kline.h,
          low: kline.l,
          close: kline.c,
          volume: kline.v,
          interval: kline.i,
          isClosed: kline.x,
        };

        this.klineData.set(key, data);
        this.notify();
      }
    }
    // 处理 markPrice 数据
    else if (parsed.e === 'markPriceUpdate') {
      const symbol = parsed.s?.toLowerCase();
      if (symbol) {
        // 更新所有匹配该 symbol 的订阅
        this.klineData.forEach((data, key) => {
          if (key.startsWith(symbol + '_')) {
            this.klineData.set(key, {
              ...data,
              close: parsed.p,
              time: parsed.E,
            });
          }
        });
        this.notify();
      }
    }
    // 处理 aggTrade 数据
    else if (parsed.e === 'aggTrade') {
      const symbol = parsed.s?.toLowerCase();
      if (symbol) {
        this.klineData.forEach((data, key) => {
          if (key.startsWith(symbol + '_')) {
            this.klineData.set(key, {
              ...data,
              close: parsed.p,
              time: parsed.E,
            });
          }
        });
        this.notify();
      }
    }
  }

  // 发送心跳
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
    // 立即发送一次
    this.sendHeartbeat();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendHeartbeat(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ method: 'ping' }));
    }
  }

  // 重连逻辑
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[AsterWS] Max reconnect attempts reached');
      return;
    }

    const delay = RECONNECT_DELAY * Math.min(this.reconnectAttempts + 1, 10);
    this.reconnectAttempts++;

    console.log(
      `[AsterWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // 重新订阅所有 symbol
  private resubscribeAll(): void {
    const wasReconnect = this.reconnectAttempts > 0 || this.klineData.size > 0;

    this.subscriptions.forEach((sub) => {
      this.sendSubscribe(sub.symbol, sub.interval, sub.subscriptionId);
      // 触发 onReconnect 回调
      if (wasReconnect && sub.onReconnect) {
        sub.onReconnect();
      }
    });
  }

  // 发送订阅消息
  private sendSubscribe(
    symbol: string,
    interval: string,
    subscriptionId: number
  ): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const symbolLower = symbol.toLowerCase();
    const params = [
      '!contractInfo',
      `${symbolLower}_perpetual@continuousKline_${interval}`,
    ];

    const message: SubscribeMessage = {
      method: 'SUBSCRIBE',
      params,
      id: subscriptionId,
    };

    this.ws.send(JSON.stringify(message));
  }

  // 发送取消订阅消息
  private sendUnsubscribe(
    symbol: string,
    interval: string,
    subscriptionId: number
  ): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const symbolLower = symbol.toLowerCase();
    const params = [
      '!contractInfo',
      `${symbolLower}_perpetual@continuousKline_${interval}`,
    ];

    const message: UnsubscribeMessage = {
      method: 'UNSUBSCRIBE',
      params,
      id: subscriptionId,
    };

    this.ws.send(JSON.stringify(message));
  }

  // 添加订阅
  addSubscription(
    symbol: string,
    interval: string,
    onReconnect?: () => void
  ): () => void {
    const key = getSubscriptionKey(symbol, interval);

    // 如果已经有相同的订阅，增加引用计数（这里简化处理，直接复用）
    const existing = this.subscriptions.get(key);
    if (existing) {
      // 更新 onReconnect 回调
      if (onReconnect) {
        existing.onReconnect = onReconnect;
      }
      return () => this.removeSubscription(symbol, interval);
    }

    const subscriptionId = generateSubscriptionId();
    const subscription: Subscription = {
      symbol,
      interval,
      subscriptionId,
      onReconnect,
    };

    this.subscriptions.set(key, subscription);

    // 如果还没有连接，建立连接
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    } else if (this.ws.readyState === WebSocket.OPEN) {
      // 如果已经连接，直接订阅
      this.sendSubscribe(symbol, interval, subscriptionId);
    }

    // 返回取消订阅函数
    return () => this.removeSubscription(symbol, interval);
  }

  // 移除订阅
  private removeSubscription(symbol: string, interval: string): void {
    const key = getSubscriptionKey(symbol, interval);
    const subscription = this.subscriptions.get(key);

    if (!subscription) return;

    //! 暂时不需要unsubscribe
    // // 发送取消订阅消息
    // this.sendUnsubscribe(symbol, interval, subscription.subscriptionId);

    // // 移除订阅和数据
    // this.subscriptions.delete(key);
    // this.klineData.delete(key);
    // // 如果没有任何订阅了，可以考虑关闭连接
    // if (this.subscriptions.size === 0) {
    //   this.close();
    // }

    // this.notify();
  }

  // 清除指定 symbol 的数据
  clearKlineData(symbol: string, interval: string): void {
    const key = getSubscriptionKey(symbol, interval);
    this.klineData.delete(key);
    this.notify();
  }

  // 手动重连
  reconnect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.reconnectAttempts = 0;
    this.connect();
  }

  // 关闭连接
  private close(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // 页面可见性变化处理
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && this.subscriptions.size > 0) {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.reconnect();
      }
    }
  };

  // 窗口获得焦点处理
  private handleFocus = (): void => {
    if (this.subscriptions.size > 0) {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.reconnect();
      }
    }
  };

  // 销毁实例（通常不需要调用）
  destroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
      window.removeEventListener('focus', this.handleFocus);
    }
    this.close();
    this.subscriptions.clear();
    this.klineData.clear();
    this.listeners.clear();
    AsterWebSocketManager.instance = null;
  }
}

// 获取管理器实例
function getManager(): AsterWebSocketManager {
  return AsterWebSocketManager.getInstance();
}

// Hook: 使用单个 WebSocket 连接订阅 K线数据
export function useAsterWsRealTimePrice({
  symbol,
  interval = '5m',
  onReconnect,
}: {
  symbol: string;
  interval?: string;
  onReconnect?: () => void;
}): {
  readyState: ReadyStateType;
  latestKline: RealTimeKline | null;
  reconnect: () => void;
} {
  const manager = useMemo(() => getManager(), []);
  const onReconnectRef = useRef(onReconnect);

  // 保持 onReconnect 最新
  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  // 使用 useSyncExternalStore 订阅管理器状态
  const readyState = useSyncExternalStore(
    useCallback((callback) => manager.subscribe(callback), [manager]),
    () => manager.getReadyState(),
    () => ReadyState.CLOSED
  );

  const latestKline = useSyncExternalStore(
    useCallback((callback) => manager.subscribe(callback), [manager]),
    () => (symbol ? manager.getKlineData(symbol, interval) : null),
    () => null
  );

  // 订阅管理
  useEffect(() => {
    if (!symbol) return;

    const unsubscribe = manager.addSubscription(symbol, interval, () =>
      onReconnectRef.current?.()
    );

    return () => {
      unsubscribe();
    };
  }, [manager, symbol, interval]);

  // 手动重连
  const reconnect = useCallback(() => {
    manager.reconnect();
  }, [manager]);

  return {
    latestKline,
    readyState,
    reconnect,
  };
}

// 导出管理器用于高级用例
export { AsterWebSocketManager, getManager as getAsterWebSocketManager };
