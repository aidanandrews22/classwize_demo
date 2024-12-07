//src/App.tsx
import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import ScheduleView from './components/ScheduleView';
import CourseDataViewer from './components/CourseDataViewer';
import ChatWindow from './components/chat/ChatWindow';
import ProfileManager from './components/profile/ProfileManager';
import { Message } from './types/chat';
import { AuthWrapper } from './components/auth/AuthWrapper';

const App: React.FC = () => {
  const { user } = useUser();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'schedule' | 'courses' | 'profile'>('schedule');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you with your class schedule?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: String(Date.now()),
      content,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const handleAddMessage = (message: Message) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const existingIndex = newMessages.findIndex(m => m.id === message.id);
      if (existingIndex !== -1) {
        newMessages[existingIndex] = message;
      } else {
        newMessages.push(message);
      }
      return newMessages;
    });
  };

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AuthWrapper>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">ClassWize</h1>
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
              <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'schedule'
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setCurrentView('schedule')}
              >
                Schedule View
              </button>
              <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'courses'
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setCurrentView('courses')}
              >
                Course Explorer
              </button>
              <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'profile'
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setCurrentView('profile')}
              >
                Profile
              </button>
            </div>
          </div>

          {currentView === 'schedule' ? (
              <ScheduleView userId={user?.id || ''} />
          ) : currentView === 'courses' ? (
              <CourseDataViewer userId={user?.id || ''} />
          ) : (
              <ProfileManager />
          )}

          <button
              className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
              onClick={() => setIsChatOpen(!isChatOpen)}
          >
            {isChatOpen ? '✕' : '💬'}
          </button>

          {isChatOpen && (
              <div className="fixed bottom-24 right-5 w-96 h-[600px] bg-white rounded-lg shadow-xl overflow-hidden">
                <ChatWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onAddMessage={handleAddMessage}
                />
              </div>
          )}
        </AuthWrapper>
      </div>
  );
};

export default App;