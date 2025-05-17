import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    role: 'instructor' | 'student';
  };
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatBoxProps {
  messages: Message[];
  currentUserId: string;
  isTyping?: boolean;
  typingUserId?: string;
  className?: string;
}

export const ChatBox = ({
  messages,
  currentUserId,
  isTyping,
  typingUserId,
  className
}: ChatBoxProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Handle auto-scrolling
  useEffect(() => {
    if (shouldAutoScroll && isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll, isNearBottom]);

  // Handle scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPosition = scrollHeight - scrollTop - clientHeight;
    const isCloseToBottom = scrollPosition < 100;
    
    setIsNearBottom(isCloseToBottom);
    setShouldAutoScroll(isCloseToBottom);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-[500px] bg-background border rounded-lg shadow-sm",
        className
      )}
    >
      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.map((message) => {
          const isOwnMessage = message.sender.id === currentUserId;
          
          return (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-2 max-w-[80%]",
                isOwnMessage ? "ml-auto flex-row-reverse" : ""
              )}
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback>
                  {getInitials(message.sender.name)}
                </AvatarFallback>
              </Avatar>

              {/* Message Content */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.sender.name}
                  </span>
                  {message.sender.role === 'instructor' && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Instructor
                    </span>
                  )}
                </div>
                
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                    message.sender.role === 'instructor' && !isOwnMessage
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  )}
                >
                  {message.content}
                </div>
                
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && typingUserId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}; 