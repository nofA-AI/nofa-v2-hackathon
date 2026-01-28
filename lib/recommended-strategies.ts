export interface RecommendedStrategy {
  id: string;
  title: string;
  category: string;
  description: string;
  performance: string;
  icon: string;
  sparkline: string;
  strategyJson?: any;
}

export const recommendedStrategies: RecommendedStrategy[] = [
  {
    id: '1',
    title: 'Momentum Trading Strategy',
    category: 'Trading',
    description: 'Momentum • High volatility markets',
    performance: '+24.5%',
    icon: 'TrendingUp',
    sparkline:
      'M0 25 L10 20 L20 28 L30 15 L40 22 L50 10 L60 18 L70 5 L80 12 L90 2 L100 8',
    strategyJson: {
      type: 'STRATEGY_TREE',
      name: 'EMA-RSI Momentum (BTC)',
      description:
        'Momentum strategy: follow trend using EMA(20/60) with RSI(14) confirmation. Long in up-momentum, short in down-momentum.',
      riskManagement: {
        type: 'RISK_MANAGEMENT',
        name: 'Default Per-Position Risk',
        scope: 'Per Position',
        stopLoss: { mode: 'PCT', value: 0.03 },
        takeProfit: { mode: 'PCT', value: 0.06 },
      },
      mainDecision: {
        type: 'IF_ELSE_BLOCK',
        name: 'Momentum Regime',
        conditionType: 'Compare',
        logicalOperator: 'AND',
        conditions: [
          {
            type: 'CONDITION_ITEM',
            indicator: 'EMA',
            period: 20,
            symbol: 'BTC/USDT',
            operator: 'Greater Than',
            value: {
              type: 'CONDITION_VALUE_INDICATOR',
              indicator: 'EMA',
              period: 60,
              symbol: 'BTC/USDT',
            },
          },
          {
            type: 'CONDITION_ITEM',
            indicator: 'RSI',
            period: 14,
            symbol: 'BTC/USDT',
            operator: 'Greater Than',
            value: 55,
          },
        ],
        thenAction: [
          {
            type: 'ACTION_BLOCK',
            name: 'Go LONG BTC',
            symbol: 'BTC/USDT',
            direction: 'LONG',
            allocate: { type: 'ALLOCATE_CONFIG', mode: 'WEIGHT', value: 100 },
            leverage: 2,
          },
        ],
        elseAction: [
          {
            type: 'IF_ELSE_BLOCK',
            name: 'Down-Momentum Check',
            conditionType: 'Compare',
            logicalOperator: 'AND',
            conditions: [
              {
                type: 'CONDITION_ITEM',
                indicator: 'EMA',
                period: 20,
                symbol: 'BTC/USDT',
                operator: 'Less Than',
                value: {
                  type: 'CONDITION_VALUE_INDICATOR',
                  indicator: 'EMA',
                  period: 60,
                  symbol: 'BTC/USDT',
                },
              },
              {
                type: 'CONDITION_ITEM',
                indicator: 'RSI',
                period: 14,
                symbol: 'BTC/USDT',
                operator: 'Less Than',
                value: 45,
              },
            ],
            thenAction: [
              {
                type: 'ACTION_BLOCK',
                name: 'Go SHORT BTC',
                symbol: 'BTC/USDT',
                direction: 'SHORT',
                allocate: {
                  type: 'ALLOCATE_CONFIG',
                  mode: 'WEIGHT',
                  value: 100,
                },
                leverage: 2,
              },
            ],
            elseAction: 'NO ACTION',
          },
        ],
      },
    },
  },
  {
    id: '2',
    title: 'Mean Reversion Strategy',
    category: 'Analysis',
    description: 'Market Sentiment • Range-bound conditions',
    performance: '+12.2%',
    icon: 'Target',
    sparkline:
      'M0 20 L10 18 L20 22 L30 19 L40 21 L50 17 L60 20 L70 16 L80 19 L90 15 L100 18',
    strategyJson: {
      type: 'STRATEGY_TREE',
      name: 'RSI-MA Mean Reversion (BTC)',
      description:
        'Mean reversion strategy: trade against extremes and revert toward the moving average. Long when price is below MA(50) and RSI is oversold; short when price is above MA(50) and RSI is overbought.',
      riskManagement: {
        type: 'RISK_MANAGEMENT',
        name: 'Default Per-Position Risk',
        scope: 'Per Position',
        stopLoss: { mode: 'PCT', value: 0.02 },
        takeProfit: { mode: 'PCT', value: 0.03 },
      },
      mainDecision: {
        type: 'IF_ELSE_BLOCK',
        name: 'Oversold Long Setup',
        conditionType: 'Compare',
        logicalOperator: 'AND',
        conditions: [
          {
            type: 'CONDITION_ITEM',
            indicator: 'Current Price',
            period: 1,
            symbol: 'BTC/USDT',
            operator: 'Less Than',
            value: {
              type: 'CONDITION_VALUE_INDICATOR',
              indicator: 'MA',
              period: 50,
              symbol: 'BTC/USDT',
            },
          },
          {
            type: 'CONDITION_ITEM',
            indicator: 'RSI',
            period: 14,
            symbol: 'BTC/USDT',
            operator: 'Less Than',
            value: 30,
          },
        ],
        thenAction: [
          {
            type: 'ACTION_BLOCK',
            name: 'Buy Dip (LONG BTC)',
            symbol: 'BTC/USDT',
            direction: 'LONG',
            allocate: { type: 'ALLOCATE_CONFIG', mode: 'WEIGHT', value: 100 },
            leverage: 2,
          },
        ],
        elseAction: [
          {
            type: 'IF_ELSE_BLOCK',
            name: 'Overbought Short Setup',
            conditionType: 'Compare',
            logicalOperator: 'AND',
            conditions: [
              {
                type: 'CONDITION_ITEM',
                indicator: 'Current Price',
                period: 1,
                symbol: 'BTC/USDT',
                operator: 'Greater Than',
                value: {
                  type: 'CONDITION_VALUE_INDICATOR',
                  indicator: 'MA',
                  period: 50,
                  symbol: 'BTC/USDT',
                },
              },
              {
                type: 'CONDITION_ITEM',
                indicator: 'RSI',
                period: 14,
                symbol: 'BTC/USDT',
                operator: 'Greater Than',
                value: 70,
              },
            ],
            thenAction: [
              {
                type: 'ACTION_BLOCK',
                name: 'Fade Rally (SHORT BTC)',
                symbol: 'BTC/USDT',
                direction: 'SHORT',
                allocate: {
                  type: 'ALLOCATE_CONFIG',
                  mode: 'WEIGHT',
                  value: 100,
                },
                leverage: 2,
              },
            ],
            elseAction: 'NO ACTION',
          },
        ],
      },
    },
  },
  {
    id: '3',
    title: 'Breakout Detection Strategy',
    category: 'Technical',
    description: 'Price Action • Volume confirmation',
    performance: '+18.4%',
    icon: 'Zap',
    sparkline:
      'M0 28 L10 26 L20 24 L30 20 L40 18 L50 15 L60 12 L70 8 L80 10 L90 6 L100 4',
    strategyJson: {
      type: 'STRATEGY_TREE',
      name: 'Breakout Detection (Return + MA Filter)',
      description:
        'Breakout detection using 20-period cumulative return (impulse) with a MA(50) trend filter. Long on strong positive breakout; short on strong negative breakdown.',
      riskManagement: {
        type: 'RISK_MANAGEMENT',
        name: 'Default Per-Position Risk',
        scope: 'Per Position',
        stopLoss: { mode: 'PCT', value: 0.025 },
        takeProfit: { mode: 'PCT', value: 0.05 },
      },
      mainDecision: {
        type: 'IF_ELSE_BLOCK',
        name: 'Upside Breakout Check',
        conditionType: 'Compare',
        logicalOperator: 'AND',
        conditions: [
          {
            type: 'CONDITION_ITEM',
            indicator: 'Cumulative Return',
            period: 20,
            symbol: 'BTC/USDT',
            operator: 'Greater Than',
            value: 0.03,
          },
          {
            type: 'CONDITION_ITEM',
            indicator: 'Current Price',
            period: 1,
            symbol: 'BTC/USDT',
            operator: 'Greater Than',
            value: {
              type: 'CONDITION_VALUE_INDICATOR',
              indicator: 'MA',
              period: 50,
              symbol: 'BTC/USDT',
            },
          },
        ],
        thenAction: [
          {
            type: 'ACTION_BLOCK',
            name: 'Enter LONG Breakout',
            symbol: 'BTC/USDT',
            direction: 'LONG',
            allocate: { type: 'ALLOCATE_CONFIG', mode: 'WEIGHT', value: 100 },
            leverage: 2,
          },
        ],
        elseAction: [
          {
            type: 'IF_ELSE_BLOCK',
            name: 'Downside Breakdown Check',
            conditionType: 'Compare',
            logicalOperator: 'AND',
            conditions: [
              {
                type: 'CONDITION_ITEM',
                indicator: 'Cumulative Return',
                period: 20,
                symbol: 'BTC/USDT',
                operator: 'Less Than',
                value: -0.03,
              },
              {
                type: 'CONDITION_ITEM',
                indicator: 'Current Price',
                period: 1,
                symbol: 'BTC/USDT',
                operator: 'Less Than',
                value: {
                  type: 'CONDITION_VALUE_INDICATOR',
                  indicator: 'MA',
                  period: 50,
                  symbol: 'BTC/USDT',
                },
              },
            ],
            thenAction: [
              {
                type: 'ACTION_BLOCK',
                name: 'Enter SHORT Breakdown',
                symbol: 'BTC/USDT',
                direction: 'SHORT',
                allocate: {
                  type: 'ALLOCATE_CONFIG',
                  mode: 'WEIGHT',
                  value: 100,
                },
                leverage: 2,
              },
            ],
            elseAction: 'NO ACTION',
          },
        ],
      },
    },
  },
];
