我想要实现一个交易策略生成工具，用户通过自然语言多轮对话 → AI 检测并提示用户补齐策略所需字段 → 生成可执行 Strategy Tree JSON → 一键回测 / 实盘复用，以下是具体需求：

## 视觉设定
- 亮色主题，主题色为 #008b52，主体浅灰色背景，卡片在白色背景中，给人一种苹果风格的高级感
- UI 文案语言为英文
可以参考下图片 demo-green-theme-layout-ui

## 整体布局
顶部有一个 Header:

### 左侧
- Logo
- 展示策略 Name, 这里是 contenteditable
- 有 Undo/Redo 按钮

### 右侧
- 有一个用户头像
  - 后续点击可以有一些下拉菜单配置项，或者 API Key 啥的，方便把策略和真实交易环境整合

主体布局分为三栏：
1. 左侧：策略列表，可以展开收起，如果为空可以给出引导按钮创建，创建后路由 id 会变更，刷新后还是加载该 id 策略
2. 中间：有两个 Tab
  1. 策略编辑器，支持渲染和编辑策略树，
  2. 回测结果，如果没有结果提示「暂无回测结果」，有一个开始回测按钮，点击后弹出创建回测 Modal,可以配置一些回测参数
3. 右侧：AI 聊天框
  1. 用户用自然语言输入策略，AI Agent 会解析成 Schema 返回给前端策略树 JSON。这个 JSON 会被一个 Strategy Tree Viewer 渲染，下面会有一个 Apply 按钮，如果点击会更新中间的策略树
  2. 在没有任何聊天内容和策略节点的情况下，输入框上面会有一个快速开始，包含量化策略创建引导，量化策略示例

## 策略树数据结构与规则

### TS Type 定义
```ts
/** 标的类型（枚举所有支持的代币对） */
type Symbol = 'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT' | 'DOGE/USDT' | 'BNB/USDT' | string;

/** 交易方向 */
type OrderDirection = 'LONG' | 'SHORT';

/** 数值模式（百分比/固定值） */
type ValueMode = 'PCT' | 'FIXED';

/** 条件判断运算符 */
type CompareOperator = 'Greater Than' | 'Less Than' | 'Equal';

/** 指标类型（支持的技术指标） */
type IndicatorType =
  | 'Current Price'
  | 'Cumulative Return'
  | 'EMA' // Exponential Moving Average
  | 'MA' // Moving Average of Price
  | 'Moving Average of Return'
  | 'Max Drawdown'
  | 'RSI'; // Relative Strength Index

/** 条件类型 */
type ConditionType = 'Compare' | 'Cross';

/** 条件逻辑运算符（用于组合多个条件） */
type LogicalOperator = 'AND' | 'OR';

/** 仓位配置模式 */
type AllocateMode = 'WEIGHT' | 'MARGIN'; // 权重/保证金数值

/** 单个交易动作 Block（支持独立配置标的、方向、仓位、杠杆） */
interface ActionBlock {
  /** Block 名称（可修改） */
  name: string;
  /** 目标标的 */
  symbol: Symbol;
  /** 交易方向 */
  direction: OrderDirection;
  /** 仓位配置 */
  allocate: {
    mode: AllocateMode;
    value: number; // 权重（如30=30%）或保证金数值
  };
  /** 杠杆（1-100） */
  leverage: number;
  /** 可选：该 Block 独立的止盈止损（覆盖全局配置） */
  riskManagement?: Partial<RiskManagement>;
}

/** 止盈止损配置（独立于策略树的风险管理） */
interface RiskManagement {
  /** 配置名称（可修改） */
  name: string;
  /** 作用范围（固定为每个仓位） */
  scope: 'Per Position';
  /** 止损配置 */
  stopLoss: {
    mode: ValueMode;
    value: number; // 百分比模式为小数（如3% = 0.03），固定值为具体数值
  };
  /** 止盈配置 */
  takeProfit: {
    mode: ValueMode;
    value: number;
  };
}

/** 单条件配置 */
interface ConditionItem {
  /** 指标类型 */
  indicator: IndicatorType;
  /** 指标周期（1-1000，如EMA10、RSI14） */
  period: number;
  /** 目标标的 */
  symbol: Symbol;
  /** 判断运算符 */
  operator: CompareOperator;
  /** 比较值（固定值或指标引用） */
  value: number | { indicator: IndicatorType; period: number; symbol: Symbol };
}

/** IF/ELSE 条件块（支持单条件/多条件 AND/OR 逻辑，动作支持多Block） */
interface IfElseBlock {
  /** 块名称（可修改） */
  name: string;
  /** 条件类型 */
  conditionType: ConditionType;
  /** 条件列表（多条件时默认按 And 逻辑组合） */
  conditions: ConditionItem[];
  /** 条件逻辑运算符（可选，默认为 'AND'，一组条件只能全部使用 AND 或全部使用 OR） */
  logicalOperator?: LogicalOperator;
  /** 满足条件时的动作（支持多个ActionBlock或嵌套IF/ELSE块） */
  thenAction: (ActionBlock | IfElseBlock)[] | 'NO ACTION';
  /** 不满足条件时的动作（支持多个ActionBlock或嵌套IF/ELSE块） */
  elseAction: (ActionBlock | IfElseBlock)[] | 'NO ACTION';
}

/** 策略树根节点 */
interface StrategyTree {
  /** 策略名称 */
  name: string;
  /** 全局风险管理配置（所有Block默认继承，可被局部覆盖） */
  riskManagement: RiskManagement;
  /** 主决策节点（IF/ELSE 多分支结构，支持嵌套） */
  mainDecision: IfElseBlock | IfElseBlock[];
  /** 策略描述（可选） */
  description?: string;
}

/** 序列化后的策略树JSON类型 */
type StrategyTreeJSON = Omit<StrategyTree, 'description'> & {
  description?: string;
};
```

### Rules 表格
| 字段路径 | 约束规则 | 错误提示 |
|----------|----------|----------|
| 所有节点 `.type` | 必须存在且不可省略；取值必须符合对应节点的 NodeType 枚举值；子节点类型需匹配父节点关联类型 | 节点缺少 type 字段或 type 取值不合法，请按对应节点类型配置 |
| `strategyTree.type` | 固定为 'STRATEGY_TREE' | 策略树根节点 type 必须为 'STRATEGY_TREE' |
| `strategyTree.name` | 非空字符串，长度 1-100 字符 | 策略名称不能为空，长度需在 1-100 字符之间 |
| `strategyTree.riskManagement` | 必须为 type 为 'RISK_MANAGEMENT' 的合法节点 | 全局风险管理配置必须是合法的 RISK_MANAGEMENT 节点 |
| `strategyTree.mainDecision` | 单个 IF_ELSE_BLOCK 节点或非空 IF_ELSE_BLOCK 节点数组，每个元素需符合 IF_ELSE_BLOCK 类型约束 | 主决策节点需为合法的 IF_ELSE_BLOCK 节点或非空数组 |
| `riskManagement.type` | 固定为 'RISK_MANAGEMENT' | 风险管理节点 type 必须为 'RISK_MANAGEMENT' |
| `riskManagement.name` | 非空字符串，长度 1-100 字符 | 风险管理名称不能为空，长度需在 1-100 字符之间 |
| `riskManagement.scope` | 固定为 'Per Position' | 风险管理作用范围固定为每个仓位（Per Position） |
| `riskManagement.stopLoss.mode` | 必须为 'PCT' 或 'FIXED' | 止损模式仅支持百分比（PCT）或固定值（FIXED） |
| `riskManagement.stopLoss.value` | 百分比模式：0 < value ≤ 1；固定值模式：value > 0 | 止损值必须为正数，百分比模式需在 0-100% 之间 |
| `riskManagement.takeProfit.mode` | 必须为 'PCT' 或 'FIXED' | 止盈模式仅支持百分比（PCT）或固定值（FIXED） |
| `riskManagement.takeProfit.value` | 百分比模式：0 < value ≤ 1；固定值模式：value > 0 | 止盈值必须为正数，百分比模式需在 0-100% 之间 |
| `ifElseBlock.type` | 固定为 'IF_ELSE_BLOCK' | IF/ELSE 条件块节点 type 必须为 'IF_ELSE_BLOCK' |
| `ifElseBlock.name` | 非空字符串，长度 1-100 字符 | IF/ELSE 块名称不能为空，长度需在 1-100 字符之间 |
| `ifElseBlock.conditionType` | 必须为 'Compare' 或 'Cross' | 条件类型仅支持 Compare 或 Cross |
| `ifElseBlock.conditions` | 数组长度 ≥ 1；每个元素必须是 type 为 'CONDITION_ITEM' 的合法节点 | 条件列表不能为空，且每个条件必须是合法的 CONDITION_ITEM 节点 |
| `ifElseBlock.logicalOperator` | 可选字段，必须为 'AND' 或 'OR'，默认为 'AND'；一组条件只能统一使用 AND 或 OR，不能混合 | 条件逻辑运算符仅支持 AND 或 OR，且一组条件只能使用单一逻辑 |
| `ifElseBlock.thenAction` | 允许值为 'NO ACTION' 或非空数组；数组元素必须是 type 为 'ACTION_BLOCK' 或 'IF_ELSE_BLOCK' 的合法节点 | 动作配置不合法：支持 NO ACTION 或非空的多Block数组（ACTION_BLOCK/IF_ELSE_BLOCK 节点） |
| `ifElseBlock.elseAction` | 允许值为 'NO ACTION' 或非空数组；数组元素必须是 type 为 'ACTION_BLOCK' 或 'IF_ELSE_BLOCK' 的合法节点 | 动作配置不合法：支持 NO ACTION 或非空的多Block数组（ACTION_BLOCK/IF_ELSE_BLOCK 节点） |
| `conditionItem.type` | 固定为 'CONDITION_ITEM' | 单条件节点 type 必须为 'CONDITION_ITEM' |
| `conditionItem.indicator` | 必须为预定义 IndicatorType 枚举值之一 | 不支持该指标，请选择合法指标类型 |
| `conditionItem.period` | 1 ≤ period ≤ 1000 | 指标周期必须在 1-1000 之间 |
| `conditionItem.symbol` | 预定义枚举值或符合 XXX/USDT 格式的合法代币对 | 标的格式不合法，需符合 XXX/USDT 规范 |
| `conditionItem.operator` | 必须为 'Greater Than'、'Less Than' 或 'Equal' 之一 | 不支持该运算符，请选择合法判断方式 |
| `conditionItem.value` | 若为对象，type 必须为 'CONDITION_VALUE_INDICATOR' 且符合指标引用结构；若为数值，需为有效数字 | 条件比较值不合法，支持固定数值或合法的指标引用 |
| `conditionItem.value.type`（对象类型时） | 固定为 'CONDITION_VALUE_INDICATOR' | 指标类型比较值的子节点 type 必须为 'CONDITION_VALUE_INDICATOR' |
| `actionBlock.type` | 固定为 'ACTION_BLOCK' | 交易动作节点 type 必须为 'ACTION_BLOCK' |
| `actionBlock.name` | 非空字符串，长度 1-100 字符 | 动作 Block 名称不能为空，长度需在 1-100 字符之间 |
| `actionBlock.symbol` | 预定义枚举值或符合 XXX/USDT 格式的合法代币对 | 标的格式不合法，需符合 XXX/USDT 规范 |
| `actionBlock.direction` | 必须为 'LONG' 或 'SHORT' | 交易方向仅支持 LONG 或 SHORT |
| `actionBlock.allocate` | 必须为 type 为 'ALLOCATE_CONFIG' 的合法节点 | 仓位配置必须是合法的 ALLOCATE_CONFIG 节点 |
| `actionBlock.leverage` | 1 ≤ leverage ≤ 100 | 杠杆必须在 1-100 倍之间 |
| `actionBlock.riskManagement` | 若配置，需为 Partial<RiskManagement> 类型，且数值约束同全局风险管理 | 局部止盈止损配置不合法，需符合数值范围要求 |
| `allocateConfig.type` | 固定为 'ALLOCATE_CONFIG' | 仓位配置节点 type 必须为 'ALLOCATE_CONFIG' |
| `allocateConfig.mode` | 必须为 'WEIGHT' 或 'MARGIN' | 仓位配置模式仅支持权重（WEIGHT）或保证金（MARGIN） |
| `allocateConfig.value` | 权重模式：0 < value ≤ 100；保证金模式：value > 0 | 仓位配置值必须为正数，权重模式需在 0-100% 之间 |

### 示例 StrategyTreeJSON（含全节点 type 字段）
```json
{
  "type": "STRATEGY_TREE",
  "name": "Multi-Block Strategy",
  "riskManagement": {
    "type": "RISK_MANAGEMENT",
    "name": "Global Risk (per position)",
    "scope": "Per Position",
    "stopLoss": {
      "mode": "PCT",
      "value": 0.03
    },
    "takeProfit": {
      "mode": "PCT",
      "value": 0.06
    }
  },
  "mainDecision": {
    "type": "IF_ELSE_BLOCK",
    "name": "RSI + EMA Decision",
    "conditionType": "Compare",
    "conditions": [
      {
        "type": "CONDITION_ITEM",
        "indicator": "RSI",
        "period": 14,
        "symbol": "BTC/USDT",
        "operator": "Greater Than",
        "value": 70
      }
    ],
    "thenAction": [
      {
        "type": "ACTION_BLOCK",
        "name": "Short BTC 30%",
        "symbol": "BTC/USDT",
        "direction": "SHORT",
        "allocate": {
          "type": "ALLOCATE_CONFIG",
          "mode": "WEIGHT",
          "value": 30
        },
        "leverage": 5
      },
      {
        "type": "ACTION_BLOCK",
        "name": "Short SOL 20% (Custom Risk)",
        "symbol": "SOL/USDT",
        "direction": "SHORT",
        "allocate": {
          "type": "ALLOCATE_CONFIG",
          "mode": "WEIGHT",
          "value": 20
        },
        "leverage": 3,
        "riskManagement": {
          "type": "RISK_MANAGEMENT",
          "stopLoss": {
            "mode": "PCT",
            "value": 0.02
          },
          "takeProfit": {
            "mode": "PCT",
            "value": 0.04
          }
        }
      },
      {
        "type": "IF_ELSE_BLOCK",
        "name": "Nested EMA Check",
        "conditionType": "Cross",
        "conditions": [
          {
            "type": "CONDITION_ITEM",
            "indicator": "EMA",
            "period": 10,
            "symbol": "ETH/USDT",
            "operator": "Greater Than",
            "value": {
              "type": "CONDITION_VALUE_INDICATOR",
              "indicator": "EMA",
              "period": 60,
              "symbol": "ETH/USDT"
            }
          }
        ],
        "thenAction": [
          {
            "type": "ACTION_BLOCK",
            "name": "Long ETH 40%",
            "symbol": "ETH/USDT",
            "direction": "LONG",
            "allocate": {
              "type": "ALLOCATE_CONFIG",
              "mode": "WEIGHT",
              "value": 40
            },
            "leverage": 2
          }
        ],
        "elseAction": "NO ACTION"
      }
    ],
    "elseAction": [
      {
        "type": "ACTION_BLOCK",
        "name": "Long BNB 50%",
        "symbol": "BNB/USDT",
        "direction": "LONG",
        "allocate": {
          "type": "ALLOCATE_CONFIG",
          "mode": "WEIGHT",
          "value": 50
        },
        "leverage": 4
      }
    ]
  }
}
```

## 策略编辑器细节
- 策略树视觉参考图 demo-strategy-tree-ui
- 部分节点支持嵌套，如果有子节点，父节点支持折叠/展开
- 如果某个层级支持添加节点，在层级下方会有一个 Add a Block 按钮
  - 点击后打开一个 Dropdown，出现可添加的节点列表
- 节点 Hover 上出会出现一个 toolbar，可以编辑或者删除，编辑会弹出每个节点的具体编辑内容 (参考策略树数据结构与规则)
  - 删除会弹出确认，如果删除节点会同时子节点，另外是删除 if 会删除相应的 else，else 不支持单独删除

## 回测结果细节
如果策略不满足回测，会提示用户当前策略不支持回测，需要修改策略

回测结果分为三部分
- 各种 Meta Item
- Performance Chart
- 历史持仓分配表格
最底部会有一个重新生成，点击后弹出创建回测 Modal

## 数据处理
用 localStorage 本地持久化，每个策略单独的 id 作为 key，自动保存，支持 undo/redo，右侧的聊天内容也需要持久化

当前 demo 版本涉及到 AI Agent/后端的版本先用 mock 接口和数据

## 技术栈
- next.js
- @tanstack/react-query
- zustand
- tailwindcss/shadcn/heroui
- ECharts
- aisdk
- ts-pattern
- dayjs
- bignumber.js
- sonner
- phosphor-icons
