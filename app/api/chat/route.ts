import { modelID, myProvider } from "@/lib/models";
import { convertToModelMessages, smoothStream, stepCountIs, streamText, tool, UIMessage } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

// 验证策略树结构的完整性（根据策略树数据结构与规则.md）
function validateStrategyTree(tree: any): { valid: boolean; error?: string } {
  // 验证字符串长度（1-100字符）
  const isValidName = (name: string) => typeof name === 'string' && name.length >= 1 && name.length <= 100;

  // 验证标的格式
  const isValidSymbol = (symbol: string) => /^[A-Z]+\/USDT$/.test(symbol) || ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'DOGE/USDT', 'BNB/USDT'].includes(symbol);

  // 验证风险管理配置
  const validateRiskManagement = (rm: any, path: string = 'riskManagement'): string | null => {
    if (rm.type !== 'RISK_MANAGEMENT') return `${path}.type 必须为 'RISK_MANAGEMENT'`;
    if (!isValidName(rm.name)) return `${path}.name 不能为空，长度需在 1-100 字符之间`;
    if (rm.scope !== 'Per Position') return `${path}.scope 固定为 'Per Position'`;

    // 验证止损配置
    if (!rm.stopLoss || !['PCT', 'FIXED'].includes(rm.stopLoss.mode)) {
      return `${path}.stopLoss.mode 仅支持百分比（PCT）或固定值（FIXED）`;
    }
    if (rm.stopLoss.mode === 'PCT' && (rm.stopLoss.value <= 0 || rm.stopLoss.value > 1)) {
      return `${path}.stopLoss.value 百分比模式需在 0-1 之间`;
    }
    if (rm.stopLoss.mode === 'FIXED' && rm.stopLoss.value <= 0) {
      return `${path}.stopLoss.value 固定值模式必须大于 0`;
    }

    // 验证止盈配置
    if (!rm.takeProfit || !['PCT', 'FIXED'].includes(rm.takeProfit.mode)) {
      return `${path}.takeProfit.mode 仅支持百分比（PCT）或固定值（FIXED）`;
    }
    if (rm.takeProfit.mode === 'PCT' && (rm.takeProfit.value <= 0 || rm.takeProfit.value > 1)) {
      return `${path}.takeProfit.value 百分比模式需在 0-1 之间`;
    }
    if (rm.takeProfit.mode === 'FIXED' && rm.takeProfit.value <= 0) {
      return `${path}.takeProfit.value 固定值模式必须大于 0`;
    }

    return null;
  };

  // 验证条件项
  const validateConditionItem = (cond: any, path: string): string | null => {
    if (cond.type !== 'CONDITION_ITEM') return `${path}.type 必须为 'CONDITION_ITEM'`;

    const validIndicators = ['Current Price', 'Cumulative Return', 'EMA', 'MA', 'Moving Average of Return', 'Max Drawdown', 'RSI'];
    if (!validIndicators.includes(cond.indicator)) {
      return `${path}.indicator 不支持该指标，请选择合法指标类型`;
    }

    if (cond.period < 1 || cond.period > 1000) {
      return `${path}.period 必须在 1-1000 之间`;
    }

    if (!isValidSymbol(cond.symbol)) {
      return `${path}.symbol 标的格式不合法，需符合 XXX/USDT 规范`;
    }

    if (!['Greater Than', 'Less Than', 'Equal'].includes(cond.operator)) {
      return `${path}.operator 不支持该运算符，请选择合法判断方式`;
    }

    // 验证value字段
    if (typeof cond.value === 'object') {
      if (cond.value.type !== 'CONDITION_VALUE_INDICATOR') {
        return `${path}.value.type 必须为 'CONDITION_VALUE_INDICATOR'`;
      }
      if (!validIndicators.includes(cond.value.indicator)) {
        return `${path}.value.indicator 不支持该指标`;
      }
      if (cond.value.period < 1 || cond.value.period > 1000) {
        return `${path}.value.period 必须在 1-1000 之间`;
      }
      if (!isValidSymbol(cond.value.symbol)) {
        return `${path}.value.symbol 标的格式不合法`;
      }
    } else if (typeof cond.value !== 'number') {
      return `${path}.value 条件比较值不合法，支持固定数值或合法的指标引用`;
    }

    return null;
  };

  // 验证ActionBlock
  const validateActionBlock = (action: any, path: string): string | null => {
    if (action.type !== 'ACTION_BLOCK') return `${path}.type 必须为 'ACTION_BLOCK'`;
    if (!isValidName(action.name)) return `${path}.name 不能为空，长度需在 1-100 字符之间`;
    if (!isValidSymbol(action.symbol)) return `${path}.symbol 标的格式不合法，需符合 XXX/USDT 规范`;
    if (!['LONG', 'SHORT'].includes(action.direction)) {
      return `${path}.direction 交易方向仅支持 LONG 或 SHORT`;
    }

    // 验证allocate配置
    if (!action.allocate || action.allocate.type !== 'ALLOCATE_CONFIG') {
      return `${path}.allocate 必须是合法的 ALLOCATE_CONFIG 节点`;
    }
    if (!['WEIGHT', 'MARGIN'].includes(action.allocate.mode)) {
      return `${path}.allocate.mode 仓位配置模式仅支持权重（WEIGHT）或保证金（MARGIN）`;
    }
    if (action.allocate.mode === 'WEIGHT' && (action.allocate.value <= 0 || action.allocate.value > 100)) {
      return `${path}.allocate.value 权重模式需在 0-100% 之间`;
    }
    if (action.allocate.mode === 'MARGIN' && action.allocate.value <= 0) {
      return `${path}.allocate.value 保证金模式必须大于 0`;
    }

    // 验证leverage
    if (action.leverage < 1 || action.leverage > 100) {
      return `${path}.leverage 杠杆必须在 1-100 倍之间`;
    }

    // 验证可选的riskManagement
    if (action.riskManagement) {
      const rmError = validateRiskManagement(action.riskManagement, `${path}.riskManagement`);
      if (rmError) return rmError;
    }

    return null;
  };

  // 验证IfElseBlock（递归）
  const validateIfElseBlock = (block: any, path: string): string | null => {
    if (block.type !== 'IF_ELSE_BLOCK') return `${path}.type 必须为 'IF_ELSE_BLOCK'`;
    if (!isValidName(block.name)) return `${path}.name 不能为空，长度需在 1-100 字符之间`;
    if (!['Compare', 'Cross'].includes(block.conditionType)) {
      return `${path}.conditionType 条件类型仅支持 Compare 或 Cross`;
    }

    // 验证conditions
    if (!Array.isArray(block.conditions) || block.conditions.length === 0) {
      return `${path}.conditions 条件列表不能为空`;
    }
    for (let i = 0; i < block.conditions.length; i++) {
      const condError = validateConditionItem(block.conditions[i], `${path}.conditions[${i}]`);
      if (condError) return condError;
    }

    // 验证logicalOperator（可选字段）
    if (block.logicalOperator !== undefined && !['AND', 'OR'].includes(block.logicalOperator)) {
      return `${path}.logicalOperator 条件逻辑运算符仅支持 AND 或 OR`;
    }

    // 验证thenAction
    if (block.thenAction !== 'NO ACTION') {
      if (!Array.isArray(block.thenAction) || block.thenAction.length === 0) {
        return `${path}.thenAction 动作配置不合法：支持 NO ACTION 或非空的多Block数组`;
      }
      for (let i = 0; i < block.thenAction.length; i++) {
        const action = block.thenAction[i];
        if (action.type === 'ACTION_BLOCK') {
          const actionError = validateActionBlock(action, `${path}.thenAction[${i}]`);
          if (actionError) return actionError;
        } else if (action.type === 'IF_ELSE_BLOCK') {
          const blockError = validateIfElseBlock(action, `${path}.thenAction[${i}]`);
          if (blockError) return blockError;
        } else {
          return `${path}.thenAction[${i}] 类型必须是 ACTION_BLOCK 或 IF_ELSE_BLOCK`;
        }
      }
    }

    // 验证elseAction
    if (block.elseAction !== 'NO ACTION') {
      if (!Array.isArray(block.elseAction) || block.elseAction.length === 0) {
        return `${path}.elseAction 动作配置不合法：支持 NO ACTION 或非空的多Block数组`;
      }
      for (let i = 0; i < block.elseAction.length; i++) {
        const action = block.elseAction[i];
        if (action.type === 'ACTION_BLOCK') {
          const actionError = validateActionBlock(action, `${path}.elseAction[${i}]`);
          if (actionError) return actionError;
        } else if (action.type === 'IF_ELSE_BLOCK') {
          const blockError = validateIfElseBlock(action, `${path}.elseAction[${i}]`);
          if (blockError) return blockError;
        } else {
          return `${path}.elseAction[${i}] 类型必须是 ACTION_BLOCK 或 IF_ELSE_BLOCK`;
        }
      }
    }

    return null;
  };

  // 开始验证根节点
  if (tree.type !== 'STRATEGY_TREE') {
    return { valid: false, error: '策略树根节点 type 必须为 STRATEGY_TREE' };
  }

  if (!isValidName(tree.name)) {
    return { valid: false, error: '策略名称不能为空，长度需在 1-100 字符之间' };
  }

  // 验证全局风险管理
  const rmError = validateRiskManagement(tree.riskManagement, 'strategyTree.riskManagement');
  if (rmError) {
    return { valid: false, error: rmError };
  }

  // 验证mainDecision
  if (Array.isArray(tree.mainDecision)) {
    if (tree.mainDecision.length === 0) {
      return { valid: false, error: '主决策节点数组不能为空' };
    }
    for (let i = 0; i < tree.mainDecision.length; i++) {
      const blockError = validateIfElseBlock(tree.mainDecision[i], `strategyTree.mainDecision[${i}]`);
      if (blockError) {
        return { valid: false, error: blockError };
      }
    }
  } else {
    const blockError = validateIfElseBlock(tree.mainDecision, 'strategyTree.mainDecision');
    if (blockError) {
      return { valid: false, error: blockError };
    }
  }

  return { valid: true };
}

// Tool for generating strategy tree JSON
const generateStrategyTreeTool = tool({
  description: 'Generate a complete trading strategy tree JSON structure. Use this tool when creating a new strategy based on user requirements. The generated JSON will be properly formatted and validated for frontend visualization.',
  inputSchema: z.object({
    strategyTreeJson: z.string().describe('Complete strategy tree JSON string conforming to the STRATEGY_TREE schema with all required type fields'),
    summary: z.string().describe('Brief summary of the generated strategy (e.g., "RSI-based multi-asset strategy with 3% stop loss")')
  }),
  execute: async ({ strategyTreeJson, summary }) => {
    try {
      // Parse to validate it's valid JSON
      const parsed = JSON.parse(strategyTreeJson);

      // 完整验证策略树结构
      const validation = validateStrategyTree(parsed);
      if (!validation.valid) {
        return {
          success: false,
          error: `策略树验证失败: ${validation.error}`
        };
      }

      return {
        success: true,
        strategyTree: parsed,
        summary,
        message: 'Strategy tree generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse strategy tree JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});

// Tool for editing existing strategy tree JSON
const editStrategyTreeTool = tool({
  description: 'Edit an existing trading strategy tree JSON. Use this tool when modifying specific parts of a strategy, such as changing stop loss values, adding/removing action blocks, or updating conditions. Returns the complete updated strategy tree.',
  inputSchema: z.object({
    originalTreeJson: z.string().describe('The current/original strategy tree JSON string'),
    updatedTreeJson: z.string().describe('The complete updated strategy tree JSON string with modifications applied'),
    changes: z.string().describe('Description of what was changed (e.g., "Updated stop loss from 3% to 5%, added ETH long position")')
  }),
  execute: async ({ originalTreeJson, updatedTreeJson, changes }) => {
    try {
      // Parse both to validate they're valid JSON
      const original = JSON.parse(originalTreeJson);
      const updated = JSON.parse(updatedTreeJson);

      // 完整验证更新后的策略树结构
      const validation = validateStrategyTree(updated);
      if (!validation.valid) {
        return {
          success: false,
          error: `更新后的策略树验证失败: ${validation.error}`
        };
      }

      return {
        success: true,
        originalTree: original,
        updatedTree: updated,
        changes,
        message: 'Strategy tree updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse strategy tree JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});

export async function POST(request: NextRequest) {
  const {
    messages,
    selectedModelId,
    isReasoningEnabled,
  }: {
    messages: Array<UIMessage>;
    selectedModelId: modelID;
    isReasoningEnabled: boolean;
  } = await request.json();

  const systemPrompt = `You are a quantitative trading assistant provided by nofa, specializing in helping users create and manage cryptocurrency quantitative trading strategies.

Your core capabilities:
1. Understand user's trading strategy requirements (including technical indicators, risk parameters, position allocation, etc.)
2. Use the generateStrategyTree tool to generate compliant strategy tree JSON structures
3. Use the editStrategyTree tool to modify existing strategy configurations

## Strategy Tree JSON Structure

A valid strategy tree must follow this structure with all required type fields:

### Root Node (STRATEGY_TREE)
{
  "type": "STRATEGY_TREE",
  "name": "Strategy Name (1-100 chars)",
  "riskManagement": { RISK_MANAGEMENT node },
  "mainDecision": IF_ELSE_BLOCK node or array of IF_ELSE_BLOCK nodes,
  "description": "optional"
}

### Risk Management Node (RISK_MANAGEMENT)
{
  "type": "RISK_MANAGEMENT",
  "name": "Risk Config Name (1-100 chars)",
  "scope": "Per Position",
  "stopLoss": {
    "mode": "PCT" | "FIXED",
    "value": number (PCT: 0-1, FIXED: >0)
  },
  "takeProfit": {
    "mode": "PCT" | "FIXED",
    "value": number (PCT: 0-1, FIXED: >0)
  }
}

### IF/ELSE Block (IF_ELSE_BLOCK)
{
  "type": "IF_ELSE_BLOCK",
  "name": "Block Name (1-100 chars)",
  "conditionType": "Compare" | "Cross",
  "conditions": [CONDITION_ITEM nodes, at least 1],
  "logicalOperator": "AND" | "OR" (optional, default: "AND"),
  "thenAction": "NO ACTION" | [ACTION_BLOCK or IF_ELSE_BLOCK nodes],
  "elseAction": "NO ACTION" | [ACTION_BLOCK or IF_ELSE_BLOCK nodes]
}

### Condition Item (CONDITION_ITEM)
{
  "type": "CONDITION_ITEM",
  "indicator": "Current Price" | "Cumulative Return" | "EMA" | "MA" | "Moving Average of Return" | "Max Drawdown" | "RSI",
  "period": number (1-1000),
  "symbol": "XXX/USDT" (e.g., "BTC/USDT"),
  "operator": "Greater Than" | "Less Than" | "Equal",
  "value": number | CONDITION_VALUE_INDICATOR object
}

For indicator-based comparison value:
{
  "type": "CONDITION_VALUE_INDICATOR",
  "indicator": "...",
  "period": number (1-1000),
  "symbol": "XXX/USDT"
}

### Action Block (ACTION_BLOCK)
{
  "type": "ACTION_BLOCK",
  "name": "Action Name (1-100 chars)",
  "symbol": "XXX/USDT",
  "direction": "LONG" | "SHORT",
  "allocate": {
    "type": "ALLOCATE_CONFIG",
    "mode": "WEIGHT" | "MARGIN",
    "value": number (WEIGHT: 0-100, MARGIN: >0)
  },
  "leverage": number (1-100),
  "riskManagement": optional RISK_MANAGEMENT (partial)
}

## Validation Rules
- All nodes MUST have the correct "type" field
- Name fields: 1-100 characters
- Symbol format: XXX/USDT (uppercase)
- Leverage: 1-100
- Period: 1-1000
- Percentage values (PCT mode): 0-1 (e.g., 0.03 for 3%)
- Weight values (WEIGHT mode): 0-100 (e.g., 30 for 30%)
- Risk management scope: always "Per Position"
- Condition types: "Compare" or "Cross"
- Logical operators: "AND" or "OR" (optional, default: "AND")
  - When multiple conditions exist, they are combined using the logical operator
  - All conditions in a single IF/ELSE block must use the same operator (cannot mix AND/OR)
- Trading direction: "LONG" or "SHORT"

## Logical Operators Usage Guide
- **AND**: All conditions must be true for the block to execute
  - Use when conditions should be combined restrictively
  - Example: "RSI > 70 AND EMA10 > EMA60" (both must be true)
- **OR**: At least one condition must be true for the block to execute
  - Use when conditions represent alternative triggers
  - Example: "RSI > 70 OR RSI < 30" (overbought or oversold)
- Default is AND if not specified
- All conditions in one IF/ELSE block must use the same operator

When generating or editing strategies:
1. Clearly understand user's strategy intent and risk requirements
2. Determine appropriate logical operator (AND/OR) based on condition relationships
3. Generate complete JSON with all required type fields and nested structures
4. Explain the strategy logic, condition combinations, and risks to the user
5. Ensure all parameters are correct before calling tools`;

  const stream = streamText({
    system: systemPrompt,
    providerOptions: {},
    model: myProvider.languageModel(selectedModelId),
    experimental_transform: [
      smoothStream({
        chunking: "word",
      }),
    ],
    messages: await convertToModelMessages(messages),
    tools: {
      generateStrategyTree: generateStrategyTreeTool,
      editStrategyTree: editStrategyTreeTool,
    },
    stopWhen: stepCountIs(5), // Allow up to 5 steps for tool calls and follow-up responses
  });

  return stream.toUIMessageStreamResponse({
    sendReasoning: true,
    onError: (event: any) => {
      console.error('Error in strategy tree generation/editing:', event);

      // Extract error message from various possible structures
      let errorMessage = 'An error occurred, please try again!';

      if (event?.message) {
        errorMessage = event.message;
      } else if (event?.error?.message) {
        errorMessage = event.error.message;
      }

      return errorMessage;
    },
  });
}
