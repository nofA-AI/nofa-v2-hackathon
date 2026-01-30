import React from 'react';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { Lightning, ChartLine, Lightbulb } from '@phosphor-icons/react';

interface QuickStartPrompt {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  prompt: string;
}

interface EmptyStatusProps {
  quickStartPrompts: QuickStartPrompt[];
  onSendMessage: (message: PromptInputMessage | string) => void;
}

export function EmptyStatus({ quickStartPrompts, onSendMessage }: EmptyStatusProps) {
  return (
    <div className="space-y-4">
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
            onClick={() => onSendMessage(prompt.prompt)}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <prompt.icon
                  className="w-4 h-4 text-primary"
                  weight="bold"
                />
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
  );
}
