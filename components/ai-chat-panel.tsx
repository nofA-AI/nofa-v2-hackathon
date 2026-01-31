'use client';

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkle,
  Lightning,
  Lightbulb,
  ChartLine,
  Play,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { AIChatInput } from '@/components/ai-chat-input';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { cn } from '@/lib/utils';
import { useStrategyStore } from '@/lib/store/strategy-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StrategyTree, BacktestParams, DEFAULT_BACKTEST_PARAMS } from '@/lib/types/strategy';
import { Streamdown } from 'streamdown';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { toast } from 'sonner';
import { modelID, models } from '@/lib/models';
import { BacktestDialog } from '@/components/backtest-dialog';
import { runBacktest } from '@/lib/backtest';
import dayjs from 'dayjs';
import './streamdown.css';
import { code } from './code';
import { Loader } from '@/components/ai-elements/loader';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { EmptyStatus } from './ai-chat-panel/empty-status';
import { MessageParts } from './ai-chat-panel/message-parts';
import { StrategyCard } from './ai-chat-panel/strategy-card';

interface AIChatPanelProps {
  width?: number;
  onApplyStrategy?: (strategy: StrategyTree) => void;
  onRunBacktest?: () => void;
  onSwitchToBacktest?: () => void;
  onRegisterSendMessage?: (sender: (message: { text: string; files?: File[] }) => void) => void;
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
    prompt:
      'Create a strategy that shorts BTC when RSI is above 70 and longs when RSI is below 30',
  },
  {
    icon: Lightbulb,
    title: 'EMA Crossover',
    description: 'Trend-following strategy example',
    prompt:
      'Create an EMA crossover strategy for ETH with 20 and 50 period EMAs',
  },
];

const getStorageKey = (strategyId?: string | null) =>
  `aiChatMessages:${strategyId || 'default'}`;

const loadStoredMessages = (storageKey: string): UIMessage[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
};

export function AIChatPanel({
  width,
  onApplyStrategy,
  onRunBacktest,
  onSwitchToBacktest,
  onRegisterSendMessage,
}: AIChatPanelProps) {
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [input, setInput] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<modelID>('openrouter/gpt-5.2');
  const [isReasoningEnabled, setIsReasoningEnabled] = useState<boolean>(true);
  const [backtestDialogOpen, setBacktestDialogOpen] = useState(false);
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  const [backtestParams, setBacktestParams] = useState<BacktestParams>(DEFAULT_BACKTEST_PARAMS);

  const loadingTexts = [
    'Analyzing your strategy...',
    'Processing market data...',
    'Generating insights...',
    'Optimizing parameters...',
    'Building your strategy...',
    'Calculating metrics...',
    'Refining recommendations...',
    'Evaluating risk factors...',
    'Fine-tuning entry points...',
    'Analyzing market trends...',
    'Generating signals...',
    'Validating strategy logic...',
    'Optimizing performance...',
    'Almost there...',
  ];

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(false);

  const { currentStrategyId, updateStrategyTree, addBacktestResult } =
    useStrategyStore();

  const storageKey = getStorageKey(currentStrategyId);

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    id: currentStrategyId || 'default',
    onError: (event: any) => {
      console.log('Chat stream error:', event);
      toast.error(event?.message ?? 'An error occurred, please try again!');

      // Find the last user message to restore
      let lastUserMessage = null;
      let lastUserMessageIndex = -1;

      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserMessage = messages[i];
          lastUserMessageIndex = i;
          break;
        }
      }

      if (lastUserMessage) {
        // Extract text content from the message
        let textContent = '';
        if (lastUserMessage.parts) {
          for (const part of lastUserMessage.parts) {
            if (part.type === 'text') {
              textContent += (part as any).text ?? '';
            }
          }
        }

        // Restore text to input
        if (textContent.trim()) {
          setInput(textContent.trim());
        }

        // Remove all messages from the last user message onwards
        // This includes the user message and any incomplete assistant responses
        setMessages(messages.slice(0, lastUserMessageIndex));
      }
    },
  });

  const isGeneratingResponse = ['streaming', 'submitted'].includes(status);

  useEffect(() => {
    if (!isGeneratingResponse) return;

    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isGeneratingResponse]);

  useEffect(() => {
    setLoadingTextIndex(0);
  }, [isGeneratingResponse]);

  const assistantHasVisibleContent = React.useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.parts)
      return false;

    let text = '';
    for (const part of lastMessage.parts) {
      if (part.type === 'text') {
        text += (part as any).text;
      }
    }

    return text.trim().length > 0;
  }, [messages]);

  const scrollToBottom = (smooth: boolean = true) => {
    const scrollArea = document.querySelector(
      '.scroll-area [data-radix-scroll-area-viewport]',
    ) as HTMLElement | null;

    if (!scrollArea) return;

    const doScroll = () => {
      if (smooth) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    };

    // Ensure StrategyCard/layout changes are applied before measuring
    requestAnimationFrame(() => {
      requestAnimationFrame(doScroll);
    });
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      scrollToBottom(isGeneratingResponse);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [isGeneratingResponse]);

  // Auto-scroll on messages update
  useEffect(() => {
    // scrollToBottom(isGeneratingResponse);
    // Scroll code blocks to bottom for better UX with max-height
    setTimeout(() => {
      const codeBlocks = document.querySelectorAll(
        '[data-streamdown="code-block-body"]',
      );
      codeBlocks.forEach((block) => {
        (block as HTMLElement).scrollTop = (block as HTMLElement).scrollHeight;
      });
    }, 50);
  }, [messages]);

  // Hydrate chat history per strategy after mount/change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = loadStoredMessages(storageKey);
    if (stored.length) {
      setMessages(stored);
      const delay = !isMountedRef.current ? 800 : 100;
      setTimeout(() => {
        scrollToBottom(false);
        // console.log('Loaded stored messages for', delay, storageKey);
      }, delay);
      // 标记已经挂载，后续切换策略时使用较短延迟
      if (!isMountedRef.current) {
        isMountedRef.current = true;
      }
    }
  }, [storageKey, setMessages]);

  // Persist chat history per strategy
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Ignore persistence errors
    }
  }, [messages, storageKey]);

  const handleSend = async (message?: PromptInputMessage | string) => {
    const isPromptMessage =
      typeof message !== 'string' && message !== undefined;
    const text = isPromptMessage
      ? (message.text ?? '').trim()
      : (message ?? input).trim();
    const files = isPromptMessage ? message.files : undefined;
    const hasFiles = Boolean(files?.length);

    if ((!text && !hasFiles) || !currentStrategyId || isGeneratingResponse)
      return;

    sendMessage(
      {
        text,
        files,
      },
      {
        body: {
          selectedModelId,
          isReasoningEnabled,
        },
      },
    );

    setInput('');

    // Scroll to bottom after sending message
    setTimeout(() => {
      scrollToBottom(true)
    })
  };

  // Register handleSend with parent
  useEffect(() => {
    if (onRegisterSendMessage) {
      onRegisterSendMessage(async (message) => {
        // Convert File[] to FileUIPart[] with data URLs
        const fileUIParts = await Promise.all(
          (message.files || []).map(async (file) => {
            // Check if file already has a dataUrl property
            const fileWithDataUrl = file as any;
            const url = fileWithDataUrl.dataUrl || await fileToDataUrl(file);

            return {
              type: 'file' as const,
              url,
              mediaType: file.type || 'text/plain',
              filename: file.name,
            };
          })
        );

        handleSend({
          text: message.text,
          files: fileUIParts as any,
        });
        // Switch to chat panel and scroll
        setTimeout(() => {
          scrollToBottom(true);
        }, 100);
      });
    }
  }, [onRegisterSendMessage, handleSend]);

  // Helper function to convert File to Data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    const handleGuideSubmit = (event: Event) => {
      const detail = (event as CustomEvent<{ text?: string; title?: string; content?: string }>).detail;
      const text = detail?.text?.trim();
      const title = detail?.title?.trim();
      const content = detail?.content?.trim();

      if ((!text && !title && !content) || !currentStrategyId || isGeneratingResponse) return;

      // If title and content provided, create a news part
      if (title && content) {
        const parts: any[] = [
          {
            type: 'data-news',
            data: {
              title,
              content,
            }
          },
        ];

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: `user-${Date.now()}`,
            role: 'user',
            parts,
          } as UIMessage,
        ]);
        return;
      }

      sendMessage(
        { text: text || '' },
        {
          body: {
            selectedModelId,
            isReasoningEnabled,
          },
        },
      );
    };

    const handleStrategyApplied = (event: Event) => {
      const detail = (
        event as CustomEvent<{ message?: string; strategyJson?: any }>
      ).detail;
      const message = detail?.message?.trim();
      const strategyJson = detail?.strategyJson;
      if (!message || !currentStrategyId) return;

      // Add mock assistant message to chat
      const parts: any[] = [{ type: 'text', text: message }];

      if (strategyJson) {
        parts.push({
          type: 'tool-generateStrategyTree',
          toolCallId: `call_${Date.now()}`,
          state: 'output-available',
          input: {
            summary: 'Generated strategy tree from guide',
          },
          output: {
            success: true,
            preGenerated: true,
            strategyTree: strategyJson,
          },
        });
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          parts,
        } as UIMessage,
      ]);
    };

    window.addEventListener('guide-chat-submit', handleGuideSubmit);
    window.addEventListener('guide-strategy-applied', handleStrategyApplied);
    return () => {
      window.removeEventListener('guide-chat-submit', handleGuideSubmit);
      window.removeEventListener(
        'guide-strategy-applied',
        handleStrategyApplied,
      );
    };
  }, [
    currentStrategyId,
    isGeneratingResponse,
    isReasoningEnabled,
    selectedModelId,
    sendMessage,
    setMessages,
  ]);

  const handleApplyStrategy = (strategy: StrategyTree) => {
    updateStrategyTree(strategy);
    onApplyStrategy?.(strategy);
    toast.success('Strategy applied successfully!');
  };

  const handleRunBacktest = async () => {
    if (!currentStrategyId) return;

    const { strategyTree } =
      useStrategyStore
        .getState()
        .strategies.find((s) => s.id === currentStrategyId) || {};

    if (!strategyTree) return;

    setIsRunningBacktest(true);

    try {
      const result = await runBacktest(strategyTree, backtestParams);
      addBacktestResult(currentStrategyId, result);
      toast.success('Backtest completed successfully!');
      setBacktestDialogOpen(false);
      // Switch to backtest tab after successful backtest
      onSwitchToBacktest?.();
    } catch (error) {
      console.error('Backtest failed:', error);
      toast.error('Backtest failed. Please try again.');
    } finally {
      setIsRunningBacktest(false);
    }
  };

  if (!currentStrategyId) {
    return (
      <div className="flex-1 bg-card flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border h-[49px]">
          <h2 className="font-medium text-sm flex items-center gap-2">
            <Sparkle className="w-4 h-4 text-primary" weight="fill" />
            Strategy AI
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
    <div
      className="flex-1 bg-card flex flex-col min-h-0 overflow-hidden relative"
      style={width ? { flex: `0 0 ${width}%` } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0 h-[49px]">
        <h2 className="font-medium text-sm flex items-center gap-2">
          <Sparkle className="w-4 h-4 text-primary" weight="fill" />
          Strategy AI
        </h2>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="scroll-area flex-1 min-h-0">
      {/* <StickToBottom
        resize="smooth"
        initial="instant"
        className="scroll-area-wrapper flex-1 min-h-0"
      >
        <StickToBottom.Content className="p-3 space-y-4" scrollClassName="!overflow-x-hidden"> */}
        <div ref={messagesContainerRef} className="p-3 space-y-4 !overflow-x-hidden">
          {messages.length === 0 ? (
            <EmptyStatus quickStartPrompts={quickStartPrompts} onSendMessage={handleSend} />
          ) : (
            messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                onApplyStrategy={handleApplyStrategy}
                onOpenBacktestDialog={() => setBacktestDialogOpen(true)}
                isGeneratingResponse={isGeneratingResponse}
                onSendMessage={handleSend}
              />
            ))
          )}

          {isGeneratingResponse && !assistantHasVisibleContent && (
            <div className="flex items-center gap-3">
              <Loader size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
              <Shimmer className="text-sm pt-0.5">
                {loadingTexts[loadingTextIndex]}
              </Shimmer>
            </div>
          )}

          <div ref={messagesEndRef} className="h-0" />
        {/* </StickToBottom.Content>
      </StickToBottom> */}
      </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <AIChatInput
          value={input}
          onChange={setInput}
          onSubmitMessage={(message) => handleSend(message)}
          status={status}
          onStop={stop}
          textareaDisabled={isGeneratingResponse}
          selectedModelId={selectedModelId}
          onModelChange={(id) => setSelectedModelId(id as modelID)}
          modelOptions={Object.entries(models).map(([id, name]) => ({
            id,
            name,
          }))}
        />
      </div>

      {/* Backtest Dialog */}
      <BacktestDialog
        open={backtestDialogOpen}
        onOpenChange={setBacktestDialogOpen}
        params={backtestParams}
        onParamsChange={setBacktestParams}
        onRun={handleRunBacktest}
        isRunning={isRunningBacktest}
      />
    </div>
  );
}

interface ChatMessageBubbleProps {
  message: UIMessage;
  onApplyStrategy: (strategy: StrategyTree) => void;
  onOpenBacktestDialog?: () => void;
  isGeneratingResponse?: boolean;
  onSendMessage: (message: PromptInputMessage | string) => void;
}

function ChatMessageBubble({
  message,
  onApplyStrategy,
  onOpenBacktestDialog,
  isGeneratingResponse,
  onSendMessage,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  const [hasApplied, setHasApplied] = useState(false);

  // Extract strategy from tool calls using useMemo
  const { extractedStrategy, isPreGenerated } = React.useMemo(() => {
    if (isUser || !message.parts) {
      return { extractedStrategy: null, isPreGenerated: false };
    }

    for (const part of message.parts) {
      if (
        part.type === 'tool-generateStrategyTree' ||
        part.type === 'tool-updateStrategyTree' ||
        part.type === 'tool-editStrategyTree'
      ) {
        try {
          const toolResult = part as any;
          const result =
            typeof toolResult.output === 'string'
              ? JSON.parse(toolResult.output)
              : toolResult.output;

          if (result.success && result.strategyTree) {
            return {
              extractedStrategy: result.strategyTree,
              isPreGenerated: result.preGenerated || false,
            };
          } else if (result.success && result.updatedTree) {
            return {
              extractedStrategy: result.updatedTree,
              isPreGenerated: result.preGenerated || false,
            };
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }

    return { extractedStrategy: null, isPreGenerated: false };
  }, [message.parts, isUser]);

  useEffect(() => {
    setHasApplied(false);
  }, [extractedStrategy]);

  // Get text content from message parts
  const getTextContent = () => {
    let textContent = '';

    if (message.parts) {
      for (const part of message.parts) {
        if (part.type === 'text') {
          const rawText = (part as any).text ?? '';
          textContent += rawText;
        }
      }
    }

    return textContent.trim();
  };

  const textContent = getTextContent();

  const reasoningPart = React.useMemo(() => {
    if (isUser || !message.parts) return null;

    for (let i = 0; i < message.parts.length; i++) {
      const part = message.parts[i];
      if (part.type === 'reasoning') {
        const reasoningPart = part as any;
        const text = reasoningPart.text || reasoningPart.content || '';
        if (text) {
          return { index: i, text };
        }
      }
    }

    return null;
  }, [message.parts, isUser]);

  const fileParts = React.useMemo(() => {
    const files: Array<{
      url?: string;
      mediaType?: string;
      filename?: string;
    }> = [];
    if (message.parts) {
      for (const part of message.parts) {
        if (part.type === 'file') {
          const filePart = part as any;
          if (filePart?.url) {
            files.push({
              url: filePart.url,
              mediaType: filePart.mediaType,
              filename: filePart.filename,
            });
          }
        }
      }
    }
    return files;
  }, [message.parts]);

  const newsParts = React.useMemo(() => {
    const news: Array<{ title?: string; content?: string }> = [];
    if (message.parts) {
      for (const part of message.parts) {
        if ((part as any).type === 'data-news') {
          const newsPart = part as any;
          const output = newsPart?.data;
          if (output?.title || output?.content) {
            news.push({
              title: output.title,
              content: output.content,
            });
          }
        }
      }
    }
    return news;
  }, [message.parts]);

  const handleAnalyzeNews = (title: string, content: string) => {
     onSendMessage(`Analyze this news: ${title}\n\n${content}`);
  };

  const handleGenerateStrategy = (title: string, content: string) => {
     onSendMessage(`Based on this news \n\n${title} \n\n ${content}\n\nGenerate a trading strategy`);
  };

  const handleApply = () => {
    if (!extractedStrategy) return;
    onApplyStrategy(extractedStrategy);
    setHasApplied(true);
  };

  // Skip rendering entirely when there's no visible content to show
  if (
    !textContent &&
    fileParts.length === 0 &&
    newsParts.length === 0 &&
    (!extractedStrategy || isGeneratingResponse)
  ) {
    return null;
  }

  return (
    <div className={cn('flex items-start gap-2', isUser && 'justify-end')}>
      <div
        className={cn(
          'min-w-0 max-w-[90%] rounded-lg',
          isUser && 'p-3',
          isUser && 'bg-muted text-foreground',
          !isUser && newsParts.length > 0 && 'flex-1',
        )}
      >
        {/* Reasoning Display */}
        <MessageParts
          reasoningPart={reasoningPart}
          newsParts={newsParts}
          fileParts={fileParts}
          textContent={textContent}
          isUser={isUser}
          isGeneratingResponse={isGeneratingResponse}
          message={message}
          onSendMessage={onSendMessage}
        />

        <StrategyCard
          extractedStrategy={extractedStrategy}
          isGeneratingResponse={isGeneratingResponse}
          isPreGenerated={isPreGenerated}
          hasApplied={hasApplied}
          onApply={handleApply}
          onOpenBacktestDialog={() => onOpenBacktestDialog?.()}
        />
      </div>
    </div>
  );
}
