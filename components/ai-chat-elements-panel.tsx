"use client";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import type { UIMessage } from "ai";
import { CheckIcon, GlobeIcon, MicIcon } from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { models, type modelID } from "@/lib/models";
import { AIChatInput } from "@/components/ai-chat-input";
import { useChat } from "@ai-sdk/react";
import type { ChatStatus } from "ai";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { Loader } from "@/components/ai-elements/loader";

interface AIChatElementsPanelProps {
  width?: number;
  onApplyStrategy?: (strategy: any) => void;
  onRunBacktest?: () => void;
  onSwitchToBacktest?: () => void;
}

const quickStartPrompts = [
  {
    title: "Quick Start Guide",
    description: "Learn how to create your first strategy",
    prompt: "How do I create a trading strategy?",
  },
  {
    title: "RSI Strategy",
    description: "Create a momentum-based strategy",
    prompt:
      "Create a strategy that shorts BTC when RSI is above 70 and longs when RSI is below 30",
  },
  {
    title: "EMA Crossover",
    description: "Trend-following strategy example",
    prompt:
      "Create an EMA crossover strategy for ETH with 20 and 50 period EMAs",
  },
];

interface MessageType {
  key: string;
  from: "user" | "assistant";
  sources?: { href: string; title: string }[];
  versions: {
    id: string;
    content: string;
  }[];
  reasoning?: {
    content: string;
    duration: number;
  };
  tools?: {
    name: string;
    description: string;
    status: string;
    parameters: Record<string, unknown>;
    result: string | undefined;
    error: string | undefined;
  }[];
}

const initialMessages: UIMessage[] = [];

const modelEntries = Object.entries(models) as Array<[modelID, string]>;

const suggestions = [
  "What are the latest trends in AI?",
  "How does machine learning work?",
  "Explain quantum computing",
  "Best practices for React development",
  "Tell me about TypeScript benefits",
  "How to optimize database queries?",
  "What is the difference between SQL and NoSQL?",
  "Explain cloud computing basics",
];

const mockResponses = [
  "That's a great question! Let me help you understand this concept better. The key thing to remember is that proper implementation requires careful consideration of the underlying principles and best practices in the field.",
  "I'd be happy to explain this topic in detail. From my understanding, there are several important factors to consider when approaching this problem. Let me break it down step by step for you.",
  "This is an interesting topic that comes up frequently. The solution typically involves understanding the core concepts and applying them in the right context. Here's what I recommend...",
  "Great choice of topic! This is something that many developers encounter. The approach I'd suggest is to start with the fundamentals and then build up to more complex scenarios.",
  "That's definitely worth exploring. From what I can see, the best way to handle this is to consider both the theoretical aspects and practical implementation details.",
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

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
};

const AIChatElementsPanel = ({
  width,
  onApplyStrategy,
  onRunBacktest,
  onSwitchToBacktest,
}: AIChatElementsPanelProps) => {
  const [input, setInput] = useState<string>("");
  const [model, setModel] = useState<modelID>(modelEntries[0]?.[0] || ("gpt-5" as modelID));
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const storageKey = getStorageKey();

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    id: "default",
    onError: (event: any) => {
      console.log("Chat stream error:", event);
      toast.error(event?.message ?? "An error occurred, please try again!");

      // Find the last user message to restore
      let lastUserMessage = null;
      let lastUserMessageIndex = -1;

      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          lastUserMessage = messages[i];
          lastUserMessageIndex = i;
          break;
        }
      }

      if (lastUserMessage) {
        // Extract text content from the message
        let textContent = "";
        if (lastUserMessage.parts) {
          for (const part of lastUserMessage.parts) {
            if (part.type === "text") {
              textContent += (part as any).text ?? "";
            }
          }
        }

        // Restore text to input
        if (textContent.trim()) {
          setInput(textContent.trim());
        }

        // Remove all messages from the last user message onwards
        setMessages(messages.slice(0, lastUserMessageIndex));
      }
    },
  });

  const selectedModelName = models[model];
  const isGeneratingResponse = ["streaming", "submitted"].includes(status as any);

  // Persist chat history
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Ignore persistence errors
    }
  }, [messages, storageKey]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [messages, status]);

  // Hydrate chat history on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = loadStoredMessages(storageKey);
    if (stored.length) {
      setMessages(stored);
    }
  }, []);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text ?? "",
        files: message.files,
      },
      {
        body: {
          selectedModelId: model,
        },
      }
    );

    setInput("");
  };

  const regenerate = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage && lastUserMessage.parts) {
        const textContent = lastUserMessage.parts
          .filter(p => p.type === 'text')
          .map(p => (p as any).text)
          .join('');

        if (textContent) {
          sendMessage(
            { text: textContent },
            {
              body: {
                selectedModelId: model,
              },
            }
          );
        }
      }
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(
      { text: prompt },
      {
        body: {
          selectedModelId: model,
        },
      }
    );
    setInput("");
  };

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden bg-white" style={width ? { flex: `0 0 ${width}%` } : {}}>
      <Conversation>
        <ConversationContent ref={scrollContainerRef}>
          {messages.length === 0 ? (
            <div className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">
                Describe your trading strategy in natural language and I'll help
                you build it.
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
                    onClick={() => handleSuggestionClick(prompt.prompt)}
                  >
                    <p className="text-sm font-medium">{prompt.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {prompt.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id}>
                  {/* Sources */}
                  {message.role === "assistant" &&
                    message.parts.filter((part) => part.type === "source-url")
                      .length > 0 && (
                      <Sources>
                        <SourcesTrigger
                          count={
                            message.parts.filter(
                              (part) => part.type === "source-url"
                            ).length
                          }
                        />
                        {message.parts
                          .filter((part) => part.type === "source-url")
                          .map((part, i) => (
                            <SourcesContent key={`${message.id}-${i}`}>
                              <Source
                                href={(part as any).url}
                                title={(part as any).url}
                              />
                            </SourcesContent>
                          ))}
                      </Sources>
                    )}

                  {/* Message parts */}
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Message
                            key={`${message.id}-${i}`}
                            from={message.role as "user" | "assistant"}
                          >
                            <MessageContent>
                              <MessageResponse>{(part as any).text}</MessageResponse>
                            </MessageContent>
                            {message.role === "assistant" && (
                              <MessageActions>
                                <MessageAction
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() =>
                                    navigator.clipboard.writeText(
                                      (part as any).text
                                    )
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </MessageAction>
                              </MessageActions>
                            )}
                          </Message>
                        );
                      case "reasoning":
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={
                              status === "streaming" &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>
                              {(part as any).text}
                            </ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              ))}
              {status === "submitted" && <Loader />}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="grid shrink-0 gap-4 pt-4">
        <div className="w-full px-4 pb-4">
          <AIChatInput
            value={input}
            onChange={setInput}
            onSubmitMessage={handleSubmit}
            status={status as ChatStatus}
            textareaDisabled={isGeneratingResponse}
            selectedModelId={model}
            onModelChange={(id) => setModel(id as modelID)}
            modelOptions={modelEntries.map(([id, name]) => ({ id, name }))}
          />
        </div>
      </div>
    </div>
  );
};

export default AIChatElementsPanel;
