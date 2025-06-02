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
        "flex flex-col h-[500px] bg-background border rounded-lg shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
        onScroll={handleScroll}
      >
        {messages.map((message) => {
          const isOwnMessage = message.sender.id === currentUserId;
          
          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-[85%]",
                isOwnMessage ? "ml-auto flex-row-reverse" : ""
              )}
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                <AvatarFallback className={cn(
                  "text-xs font-medium",
                  isOwnMessage ? "bg-primary/10 text-primary" : "bg-muted"
                )}>
                  {getInitials(message.sender.name)}
                </AvatarFallback>
              </Avatar>

              {/* Message Content */}
              <div className={cn(
                "flex flex-col gap-1.5",
                isOwnMessage ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "flex items-center gap-2",
                  isOwnMessage && "flex-row-reverse"
                )}>
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
                    "rounded-2xl px-4 py-2.5 text-sm",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none",
                    message.sender.role === 'instructor' && !isOwnMessage
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  )}
                >
                  {message.content}
                </div>
                
                <span className="text-[11px] text-muted-foreground/70">
                  {format(new Date(message.timestamp), 'h:mm a')}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && typingUserId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground/70 pl-12">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-xs">typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}; 