'use client';

import React, { useState } from 'react';

import {
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputButton,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input';
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector';
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from '@/components/ai-elements/attachments';
import type { ChatStatus } from 'ai';
import { PaperPlaneTilt, Stop } from '@phosphor-icons/react';

interface AIChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmitMessage: (message: PromptInputMessage) => void;
  onStop?: () => void;
  status?: ChatStatus;
  placeholder?: string;
  textareaDisabled?: boolean;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  modelOptions: Array<{ id: string; name: string }>;
}

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="grid" className='flex w-full p-2 justify-start' >
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

export function AIChatInput({
  value,
  onChange,
  onSubmitMessage,
  onStop,
  status,
  placeholder = 'Describe your strategy...',
  textareaDisabled = false,
  selectedModelId,
  onModelChange,
  modelOptions,
}: AIChatInputProps) {
  const isGenerating = status === 'submitted' || status === 'streaming';
  const isSubmitDisabled = !value.trim() && !isGenerating;
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const selectedModelName =
    modelOptions.find((model) => model.id === selectedModelId)?.name ??
    selectedModelId;

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim();
    const hasAttachments = Boolean(message.files?.length);
    if (!text && !hasAttachments) return;
    onSubmitMessage(message);
  };

  return (
    <PromptInput accept="image/*,application/pdf" multiple onSubmit={handleSubmit}>
      <PromptInputAttachmentsDisplay />
      <PromptInputBody>
        <PromptInputTextarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={textareaDisabled}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments label="Add attachments" />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <ModelSelector
            open={modelSelectorOpen}
            onOpenChange={setModelSelectorOpen}
          >
            <ModelSelectorTrigger asChild>
              <PromptInputButton size="sm" className="max-w-[200px] px-2">
                <ModelSelectorName>{selectedModelName}</ModelSelectorName>
              </PromptInputButton>
            </ModelSelectorTrigger>
            <ModelSelectorContent>
              <ModelSelectorInput placeholder="Search models..." />
              <ModelSelectorList>
                <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                <ModelSelectorGroup heading="Models">
                  {modelOptions.map((model) => (
                    <ModelSelectorItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => {
                        onModelChange(model.id);
                        setModelSelectorOpen(false);
                      }}
                    >
                      <ModelSelectorName>{model.name}</ModelSelectorName>
                    </ModelSelectorItem>
                  ))}
                </ModelSelectorGroup>
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>
        </PromptInputTools>
        <PromptInputSubmit
          status={status}
          onStop={onStop}
          disabled={isSubmitDisabled}
          className="ml-auto"
        >
          {isGenerating ? (
            <Stop className="h-4 w-4" weight="bold" />
          ) : (
            <PaperPlaneTilt className="h-4 w-4" weight="bold" />
          )}
        </PromptInputSubmit>
      </PromptInputFooter>
    </PromptInput>
  );
}
