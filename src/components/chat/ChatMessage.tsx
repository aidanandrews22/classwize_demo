// src/components/chat/ChatMessage.tsx
import React from 'react';
import { Message } from '../../types/chat';
import { useLLMOutput } from '@llm-ui/react';
import { markdownLookBack } from '@llm-ui/markdown';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import MarkdownMessage from './MarkdownMessage';
import CodeBlock from './CodeBlock';
import { BlockMatch } from '../../types/llm-ui';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { content, role, timestamp, isStreaming } = message;

  return (
      <div
          className={`max-w-[85%] p-4 rounded-lg animate-fadeIn ${
              role === 'user'
                  ? 'bg-blue-600 text-white ml-auto'
                  : 'bg-white text-gray-900 mr-auto'
          }`}
      >
        <div className="message-content break-words">
          {content}
          {isStreaming && (
              <span className="inline-block w-1 h-4 ml-1 bg-current animate-blink">
            ▋
          </span>
          )}
        </div>
        <div className={`text-xs mt-2 ${
            role === 'user' ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {timestamp.toLocaleTimeString()}
        </div>
      </div>
  );
};

export default ChatMessage;