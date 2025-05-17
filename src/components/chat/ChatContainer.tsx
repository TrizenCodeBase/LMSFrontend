import React, { useState } from 'react';
import { ChatBox } from './ChatBox';
import { MessageInput } from './MessageInput';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ChatContainerProps {
  title?: string;
  messages: Array<{
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      role: 'instructor' | 'student';
    };
    timestamp: Date;
  }>;
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const ChatContainer = ({
  title = "Messages",
  messages,
  currentUserId,
  onSendMessage,
  isLoading = false,
  className
}: ChatContainerProps) => {
  const [isTyping, setIsTyping] = useState(false);

  const handleTypingStart = () => {
    setIsTyping(true);
  };

  const handleTypingEnd = () => {
    setIsTyping(false);
  };

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          <ChatBox
            messages={messages}
            currentUserId={currentUserId}
            isTyping={isTyping}
            typingUserId={currentUserId}
          />
          
          <MessageInput
            onSendMessage={onSendMessage}
            onTypingStart={handleTypingStart}
            onTypingEnd={handleTypingEnd}
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}; 