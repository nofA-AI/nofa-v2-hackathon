/** Symbol type (enumeration of all supported trading pairs) */
export type Symbol = 'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT' | 'DOGE/USDT' | 'BNB/USDT' | string;

/** Trading direction */
export type OrderDirection = 'LONG' | 'SHORT';

/** Value mode (percentage/fixed) */
export type ValueMode = 'PCT' | 'FIXED';

/** Risk management scope */
export type RiskScope = 'Per Position' | 'Per Strategy' | 'Per Symbol' | 'Global';

/** Comparison operator */
export type CompareOperator = 'Greater Than' | 'Less Than' | 'Equal';

/** Indicator type (supported technical indicators) */
export type IndicatorType =
  | 'Current Price'
  | 'Cumulative Return'
  | 'EMA'
  | 'MA'
  | 'Moving Average of Return'
  | 'Max Drawdown'
  | 'RSI';

/** Condition type */
export type ConditionType = 'Compare' | 'Cross';

/** Position allocation mode */
export type AllocateMode = 'WEIGHT' | 'MARGIN';

/** Node types for the strategy tree */
export type NodeType =
  | 'STRATEGY_TREE'
  | 'RISK_MANAGEMENT'
  | 'IF_ELSE_BLOCK'
  | 'CONDITION_ITEM'
  | 'ACTION_BLOCK'
  | 'ALLOCATE_CONFIG'
  | 'CONDITION_VALUE_INDICATOR';

/** Allocate configuration */
export interface AllocateConfig {
  type: 'ALLOCATE_CONFIG';
  mode: AllocateMode;
  value: number;
}

/** Stop loss/take profit configuration */
export interface StopLossTakeProfit {
  mode: ValueMode;
  value: number;
}

/** Risk management configuration */
export interface RiskManagement {
  type: 'RISK_MANAGEMENT';
  name: string;
  scope: RiskScope;
  stopLoss: StopLossTakeProfit;
  takeProfit: StopLossTakeProfit;
}

/** Condition value indicator reference */
export interface ConditionValueIndicator {
  type: 'CONDITION_VALUE_INDICATOR';
  indicator: IndicatorType;
  period: number;
  symbol: Symbol;
}

/** Single condition configuration */
export interface ConditionItem {
  type: 'CONDITION_ITEM';
  indicator: IndicatorType;
  period: number;
  symbol: Symbol;
  operator: CompareOperator;
  value: number | ConditionValueIndicator;
}

/** Action block (single trading action) */
export interface ActionBlock {
  type: 'ACTION_BLOCK';
  name: string;
  symbol: Symbol;
  direction: OrderDirection;
  allocate: AllocateConfig;
  leverage: number;
  riskManagement?: Partial<RiskManagement>;
}

/** Logical operator for combining conditions */
export type LogicalOperator = 'AND' | 'OR';

/** IF/ELSE condition block */
export interface IfElseBlock {
  type: 'IF_ELSE_BLOCK';
  name: string;
  conditionType: ConditionType;
  conditions: ConditionItem[];
  logicalOperator?: LogicalOperator;
  thenAction: (ActionBlock | IfElseBlock)[] | 'NO ACTION';
  elseAction: (ActionBlock | IfElseBlock)[] | 'NO ACTION';
}

/** Strategy tree root node */
export interface StrategyTree {
  type: 'STRATEGY_TREE';
  name: string;
  riskManagement: RiskManagement;
  mainDecision: IfElseBlock | IfElseBlock[];
  description?: string;
}

/** Strategy with metadata */
export interface Strategy {
  id: string;
  strategyTree: StrategyTree;
  createdAt: string;
  updatedAt: string;
}

/** Chat message */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  strategyJson?: StrategyTree;
  timestamp: string;
}

/** Backtest parameters */
export interface BacktestParams {
  startDate: string;
  endDate: string;
  initialCapital: number;
  tradingFee: number;
  timeframe: string;
  slippage: number;
}

/** Default backtest parameters */
export const DEFAULT_BACKTEST_PARAMS: BacktestParams = {
  startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  initialCapital: 10000,
  tradingFee: 0.0005,
  timeframe: '1H',
  slippage: 0.001,
};

/** Backtest result */
export interface BacktestResult {
  id: string;
  strategyId: string;
  params: BacktestParams;
  metrics: {
    totalReturn: number;
    annualizedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    totalTrades: number;
  };
  performanceData: {
    date: string;
    value: number;
  }[];
  benchmarkData: {
    date: string;
    value: number;
  }[];
  positions: {
    date: string;
    symbol: string;
    direction: OrderDirection;
    entry: number;
    exit: number;
    pnl: number;
    pnlPercent: number;
  }[];
  createdAt: string;
}

/** Default risk management */
export const DEFAULT_RISK_MANAGEMENT: RiskManagement = {
  type: 'RISK_MANAGEMENT',
  name: 'Global Risk (per position)',
  scope: 'Per Position',
  stopLoss: { mode: 'PCT', value: 0.03 },
  takeProfit: { mode: 'PCT', value: 0.06 },
};

/** Default strategy tree */
export const DEFAULT_STRATEGY_TREE: StrategyTree = {
  type: 'STRATEGY_TREE',
  name: 'New Strategy',
  riskManagement: DEFAULT_RISK_MANAGEMENT,
  mainDecision: {
    type: 'IF_ELSE_BLOCK',
    name: 'Main Decision',
    conditionType: 'Compare',
    conditions: [],
    thenAction: 'NO ACTION',
    elseAction: 'NO ACTION',
  },
};

/** Available symbols */
export const AVAILABLE_SYMBOLS: Symbol[] = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'DOGE/USDT',
  'BNB/USDT',
];

/** Available indicators */
export const AVAILABLE_INDICATORS: IndicatorType[] = [
  'Current Price',
  'Cumulative Return',
  'EMA',
  'MA',
  'Moving Average of Return',
  'Max Drawdown',
  'RSI',
];
