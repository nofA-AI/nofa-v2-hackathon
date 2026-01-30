import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Streamdown } from 'streamdown';
import { code } from '../code';

interface MessagePart {
  type: string;
  [key: string]: any;
}

interface MessagePartsProps {
  reasoningPart: { index: number; text: string } | null;
  newsParts: Array<{ title?: string; content?: string }>;
  fileParts: Array<{
    url?: string;
    mediaType?: string;
    filename?: string;
  }>;
  textContent: string;
  isUser: boolean;
  isGeneratingResponse?: boolean;
  message: any;
  onSendMessage: (message: PromptInputMessage | string) => void;
}

export function MessageParts({
  reasoningPart,
  newsParts,
  fileParts,
  textContent,
  isUser,
  isGeneratingResponse,
  message,
  onSendMessage,
}: MessagePartsProps) {
  const handleAnalyzeNews = (title: string, content: string) => {
    onSendMessage(`Analyze this news: ${title}\n\n${content}`);
  };

  const handleGenerateStrategy = (title: string, content: string) => {
    onSendMessage(
      `Based on this news \n\n${title} \n\n ${content}\n\nGenerate a trading strategy`
    );
  };

  return (
    <>
      {/* Reasoning Display */}
      {!isUser && reasoningPart && (
        <Reasoning
          key={`${message.id}-reasoning`}
          className="w-full mb-3"
          isStreaming={
            isGeneratingResponse &&
            reasoningPart.index === message.parts!.length - 1
          }
        >
          <ReasoningTrigger />
          <ReasoningContent>
            {reasoningPart.text}
          </ReasoningContent>
        </Reasoning>
      )}

      {/* News Parts */}
      {newsParts.length > 0 && (
        <div
          className={cn(
            'space-y-3',
            textContent || fileParts.length > 0 ? 'mb-3' : ''
          )}
        >
          {newsParts.map((news, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-3 bg-card space-y-2"
              data-news-title={news.title}
              data-news-content={news.content}
            >
              {news.title && (
                <h3 className="text-sm font-semibold text-foreground">
                  {news.title}
                </h3>
              )}
              {news.content && (
                <p className="text-xs text-muted-foreground line-clamp-4">
                  {news.content}
                </p>
              )}
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs text-foreground"
                  onClick={() =>
                    handleAnalyzeNews(news.title || '', news.content || '')
                  }
                >
                  Analyze News
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs text-foreground"
                  onClick={() =>
                    handleGenerateStrategy(
                      news.title || '',
                      news.content || ''
                    )
                  }
                >
                  Generate Strategy
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Parts */}
      {fileParts.length > 0 && (
        <div className={cn('grid gap-2', textContent ? 'mb-2' : '')}>
          {fileParts.map((file, index) => {
            const isImage = file.mediaType?.startsWith('image/');
            if (isImage) {
              return (
                <img
                  key={`${file.url}-${index}`}
                  src={file.url}
                  alt={file.filename ?? 'Image attachment'}
                  className="max-h-64 w-auto max-w-full rounded-md border border-border object-contain"
                />
              );
            }

            return (
              <a
                key={`${file.url}-${index}`}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
              >
                {file.filename ?? 'Attachment'}
              </a>
            );
          })}
        </div>
      )}

      {/* Text Content */}
      {textContent && (
        <div
          className={cn(
            'text-sm break-words',
            isUser
              ? 'text-foreground whitespace-pre-line'
              : 'prose prose-sm prose-slate max-w-none'
          )}
        >
          {isUser ? (
            textContent
          ) : (
            <Streamdown plugins={{ code }}>{textContent}</Streamdown>
          )}
        </div>
      )}
    </>
  );
}
