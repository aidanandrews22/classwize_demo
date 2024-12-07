// ChatWindow.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../../types/chat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onAddMessage: (message: Message) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, onAddMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    onSendMessage(content);
    setIsStreaming(true);

    const streamingMessageId = String(Date.now());
    const initialMessage: Message = {
      id: streamingMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true
    };
    onAddMessage(initialMessage);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          prompt: content,
          user_id: 'user123',
          use_openai: false
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedMessage = '';

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const content = line.slice(5).trim();
              if (content === '[DONE]') continue;

              const data = JSON.parse(content);
              if (data.token) {
                accumulatedMessage += data.token;
                onAddMessage({
                  id: streamingMessageId,
                  content: accumulatedMessage,
                  role: 'assistant',
                  timestamp: new Date(),
                  isStreaming: true
                });
              }
            } catch (e) {
              console.error('Error parsing line:', line);
            }
          }
        }
      }

      onAddMessage({
        id: streamingMessageId,
        content: accumulatedMessage,
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: false
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
      <div className="flex flex-col h-full">
        <div className="bg-blue-600 text-white p-4 text-center">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
  );
};

export default ChatWindow;