'use client';

import React from "react"

import { useState, useRef, useEffect } from 'react';
import { PaperPlaneTilt, Sparkle, Lightning, Lightbulb, ChartLine } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStrategyStore } from '@/lib/store/strategy-store';
import { StrategyTree, ChatMessage } from '@/lib/types/strategy';
import dayjs from 'dayjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIChatPanelProps {
  onApplyStrategy?: (strategy: StrategyTree) => void;
}

// Mock AI response with strategy generation
const mockGenerateStrategy = async (userMessage: string): Promise<{ content: string; strategyJson?: StrategyTree }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Check if the message contains strategy-related keywords
  const isStrategyRequest =
    userMessage.toLowerCase().includes('strategy') ||
    userMessage.toLowerCase().includes('rsi') ||
    userMessage.toLowerCase().includes('ema') ||
    userMessage.toLowerCase().includes('moving average') ||
    userMessage.toLowerCase().includes('btc') ||
    userMessage.toLowerCase().includes('eth') ||
    userMessage.toLowerCase().includes('long') ||
    userMessage.toLowerCase().includes('short');

  if (isStrategyRequest) {
    const mockStrategy: StrategyTree = {
      type: 'STRATEGY_TREE',
      name: 'RSI Overbought/Oversold Strategy',
      description: 'A momentum-based strategy using RSI indicators',
      riskManagement: {
        type: 'RISK_MANAGEMENT',
        name: 'Global Risk (per position)',
        scope: 'Per Position',
        stopLoss: { mode: 'PCT', value: 0.03 },
        takeProfit: { mode: 'PCT', value: 0.06 },
      },
      mainDecision: {
        type: 'IF_ELSE_BLOCK',
        name: 'RSI Decision',
        conditionType: 'Compare',
        conditions: [
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
            name: 'Short BTC 30%',
            symbol: 'BTC/USDT',
            direction: 'SHORT',
            allocate: {
              type: 'ALLOCATE_CONFIG',
              mode: 'WEIGHT',
              value: 30,
            },
            leverage: 2,
          },
        ],
        elseAction: [
          {
            type: 'IF_ELSE_BLOCK',
            name: 'RSI Oversold Check',
            conditionType: 'Compare',
            conditions: [
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
                name: 'Long BTC 30%',
                symbol: 'BTC/USDT',
                direction: 'LONG',
                allocate: {
                  type: 'ALLOCATE_CONFIG',
                  mode: 'WEIGHT',
                  value: 30,
                },
                leverage: 2,
              },
            ],
            elseAction: 'NO ACTION',
          },
        ],
      },
    };

    return {
      content: `I've created a RSI-based trading strategy for you. Here's what it does:

**Strategy Logic:**
- When RSI(14) > 70 (overbought): Short BTC with 30% weight at 2x leverage
- When RSI(14) < 30 (oversold): Long BTC with 30% weight at 2x leverage
- Otherwise: No action (stay flat)

**Risk Management:**
- Stop Loss: 3%
- Take Profit: 6%
- Scope: Per Position

You can click "Apply Strategy" below to add this to your strategy tree, or describe any modifications you'd like to make.`,
      strategyJson: mockStrategy,
    };
  }

  return {
    content: `I understand you're interested in trading strategies. To help you create a strategy, please describe:

1. **Entry conditions** - What indicators or signals should trigger a trade? (e.g., "RSI above 70", "EMA crossover")
2. **Exit conditions** - When should the position be closed?
3. **Risk management** - What stop-loss and take-profit levels do you prefer?
4. **Assets** - Which trading pairs are you interested in? (e.g., BTC/USDT, ETH/USDT)

Feel free to describe your strategy in natural language and I'll help you build it!`,
  };
};

const quickStartPrompts = [
  {
    icon: Lightning,
    title: 'Quick Start Guide',
    description: 'Learn how to create your first strategy',
    prompt: 'How do I create a trading strategy?',
  },
  {
    icon: ChartLine,
    title: 'RSI Strategy',
    description: 'Create a momentum-based strategy',
    prompt: 'Create a strategy that shorts BTC when RSI is above 70 and longs when RSI is below 30',
  },
  {
    icon: Lightbulb,
    title: 'EMA Crossover',
    description: 'Trend-following strategy example',
    prompt: 'Create an EMA crossover strategy for ETH with 20 and 50 period EMAs',
  },
];

export function AIChatPanel({ onApplyStrategy }: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [width, setWidth] = useState(320); // 默认宽度 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { currentStrategyId, chatMessages, addChatMessage, updateStrategyTree } =
    useStrategyStore();

  const messages = currentStrategyId ? chatMessages[currentStrategyId] || [] : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      // 限制最小宽度为 280px，最大宽度为 600px
      setWidth(Math.min(Math.max(newWidth, 280), 600));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || !currentStrategyId || isLoading) return;

    // Add user message
    addChatMessage(currentStrategyId, {
      role: 'user',
      content: text,
    });

    setInput('');
    setIsLoading(true);

    try {
      // Get AI response
      const response = await mockGenerateStrategy(text);

      // Add assistant message
      addChatMessage(currentStrategyId, {
        role: 'assistant',
        content: response.content,
        strategyJson: response.strategyJson,
      });
    } catch (error) {
      addChatMessage(currentStrategyId, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyStrategy = (strategy: StrategyTree) => {
    updateStrategyTree(strategy);
    onApplyStrategy?.(strategy);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentStrategyId) {
    return (
      <div className="border-l border-border bg-card flex flex-col" style={{ width: `${width}px` }}>
        <div
          className="absolute left-0 top-0 bottom-0 w-1 hover:bg-primary/50 cursor-ew-resize transition-colors"
          onMouseDown={() => setIsResizing(true)}
        />
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h2 className="font-medium text-sm flex items-center gap-2">
            <Sparkle className="w-4 h-4 text-primary" weight="fill" />
            AI Assistant
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Select or create a strategy to start chatting with AI.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-l border-border bg-card flex flex-col min-h-0 overflow-hidden relative" style={{ width: `${width}px` }}>
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 hover:bg-primary/50 cursor-ew-resize transition-colors z-10"
        onMouseDown={() => setIsResizing(true)}
      />
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <h2 className="font-medium text-sm flex items-center gap-2">
          <Sparkle className="w-4 h-4 text-primary" weight="fill" />
          AI Assistant
        </h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Describe your trading strategy in natural language and I'll help you
                build it.
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Start
                </p>
                {quickStartPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    onClick={() => handleSend(prompt.prompt)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <prompt.icon className="w-4 h-4 text-primary" weight="bold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{prompt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {prompt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                onApplyStrategy={handleApplyStrategy}
              />
            ))
          )}

          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Sparkle className="w-3 h-3 text-primary-foreground" weight="fill" />
              </div>
              <div className="flex-1 p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your strategy..."
            className="min-h-[80px] pr-12 resize-none"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <PaperPlaneTilt className="w-4 h-4" weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onApplyStrategy: (strategy: StrategyTree) => void;
}

function ChatMessageBubble({ message, onApplyStrategy }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start gap-2', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkle className="w-3 h-3 text-primary-foreground" weight="fill" />
        </div>
      )}

      <div
        className={cn(
          'flex-1 min-w-0 p-3 rounded-lg',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <div className={cn(
          'text-sm break-words prose prose-sm max-w-none',
          isUser ? 'prose-invert' : 'prose-slate',
          '[&>*]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-1 [&>p]:leading-normal',
          '[&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5'
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {message.strategyJson && (
          <div className="mt-3 p-3 rounded-md bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">
                Generated Strategy
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {message.strategyJson.name}
            </p>
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={() => onApplyStrategy(message.strategyJson!)}
            >
              <ChartLine className="w-4 h-4" />
              Apply Strategy
            </Button>
          </div>
        )}

        <p
          className={cn(
            'text-xs mt-2',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {dayjs(message.timestamp).format('HH:mm')}
        </p>
      </div>
    </div>
  );
}
