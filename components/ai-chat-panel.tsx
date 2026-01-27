'use client';

import React from "react"

import { useState, useRef, useEffect } from 'react';
import { PaperPlaneTilt, Sparkle, Lightning, Lightbulb, ChartLine } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStrategyStore } from '@/lib/store/strategy-store';
import { StrategyTree } from '@/lib/types/strategy';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { toast } from 'sonner';
import { modelID, models } from '@/lib/models';

interface AIChatPanelProps {
  onApplyStrategy?: (strategy: StrategyTree) => void;
}

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
  const [width, setWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<modelID>('gpt-5.2');
  const [isReasoningEnabled, setIsReasoningEnabled] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { currentStrategyId, updateStrategyTree } = useStrategyStore();

  const { messages, sendMessage, status, stop } = useChat({
    id: currentStrategyId || 'default',
    onError: () => {
      toast.error('An error occurred, please try again!');
    },
  });

  const isGeneratingResponse = ['streaming', 'submitted'].includes(status);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 从 localStorage 读取保存的宽度
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('aiChatPanelWidth');
      if (savedWidth) {
        setWidth(parseInt(savedWidth, 10));
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 保存宽度到 localStorage（仅在不处于拖动状态时保存）
  useEffect(() => {
    if (typeof window !== 'undefined' && !isResizing) {
      localStorage.setItem('aiChatPanelWidth', width.toString());
    }
  }, [width, isResizing]);

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
    if (!text || !currentStrategyId || isGeneratingResponse) return;

    sendMessage(
      {
        text,
      },
      {
        body: {
          selectedModelId,
          isReasoningEnabled,
        },
      }
    );

    setInput('');
  };

  const handleApplyStrategy = (strategy: StrategyTree) => {
    updateStrategyTree(strategy);
    onApplyStrategy?.(strategy);
    toast.success('Strategy applied successfully!');
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
        <div className="flex items-center justify-between p-3 border-b border-border h-[49px]">
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
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0 h-[49px]">
        <h2 className="font-medium text-sm flex items-center gap-2">
          <Sparkle className="w-4 h-4 text-primary" weight="fill" />
          AI Assistant
        </h2>
        {/* Model Selector */}
        <select
          className="text-xs px-2 py-1 rounded border border-border bg-background"
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value as modelID)}
        >
          {Object.entries(models).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
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

          {isGeneratingResponse && (
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
            disabled={isGeneratingResponse}
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8"
            onClick={() => isGeneratingResponse ? stop() : handleSend()}
            disabled={!input.trim() && !isGeneratingResponse}
          >
            <PaperPlaneTilt className="w-4 h-4" weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ChatMessageBubbleProps {
  message: UIMessage;
  onApplyStrategy: (strategy: StrategyTree) => void;
}

function ChatMessageBubble({ message, onApplyStrategy }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  const [extractedStrategy, setExtractedStrategy] = useState<StrategyTree | null>(null);

  // Extract strategy from tool calls
  useEffect(() => {
    if (!isUser && message.parts) {
      for (const part of message.parts) {
        if (part.type === 'tool-result') {
          try {
            const toolResult = part as any;
            const result = typeof toolResult.result === 'string'
              ? JSON.parse(toolResult.result)
              : toolResult.result;

            if (result.success && result.strategyTree) {
              setExtractedStrategy(result.strategyTree);
            } else if (result.success && result.updatedTree) {
              setExtractedStrategy(result.updatedTree);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
  }, [message.parts, isUser]);

  // Get text content from message parts
  const getTextContent = () => {
    let textContent = '';

    if (message.parts) {
      for (const part of message.parts) {
        if (part.type === 'text') {
          textContent += (part as any).text;
        }
      }
    }

    return textContent;
  };

  const textContent = getTextContent();

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
        {textContent && (
          <div className={cn(
            'text-sm break-words prose prose-sm max-w-none',
            isUser ? 'prose-invert' : 'prose-slate',
            '[&>*]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-1 [&>p]:leading-normal',
            '[&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5'
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {textContent}
            </ReactMarkdown>
          </div>
        )}

        {extractedStrategy && (
          <div className="mt-3 p-3 rounded-md bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">
                Generated Strategy
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {extractedStrategy.name}
            </p>
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={() => onApplyStrategy(extractedStrategy)}
            >
              <ChartLine className="w-4 h-4" />
              Apply Strategy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
