import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Send, Loader2, MessageSquare, MoreHorizontal, Clock, Check, CheckCheck, ChevronDown } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useConversations, useMessages, useSendMessage, useCourseInstructors } from '@/services/messageService';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

// Quick reply suggestions
const QUICK_REPLIES = [
  "When is the next session?",
  "Could you explain this concept again?",
  "Is there additional reading material?",
  "Can we schedule a 1:1 discussion?",
];

const ContactInstructorsPage: React.FC = () => {
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();
  const { data: instructors = [], isLoading: isLoadingInstructors } = useCourseInstructors();
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(selectedInstructor || '', selectedCourse || '');
  const sendMessageMutation = useSendMessage();

  // Group instructors by course
  const courseGroups = React.useMemo(() => {
    const groups = instructors.reduce((acc, curr) => {
      if (!acc[curr.courseId]) {
        acc[curr.courseId] = {
          courseId: curr.courseId,
          courseTitle: curr.courseTitle,
          instructors: []
        };
      }
      acc[curr.courseId].instructors.push(curr.instructor);
      return acc;
    }, {} as Record<string, { courseId: string; courseTitle: string; instructors: any[] }>);
    return Object.values(groups);
  }, [instructors]);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedInstructor(null);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedInstructor || !selectedCourse) return;

    sendMessageMutation.mutate({
      receiverId: selectedInstructor,
      courseId: selectedCourse,
      content: newMessage
    }, {
      onSuccess: () => {
        setNewMessage('');
      }
    });
  };

  // Filter instructors based on search and selected course
  const filteredInstructors = React.useMemo(() => {
    let filtered = instructors;
    
    if (selectedCourse) {
      filtered = filtered.filter(inst => inst.courseId === selectedCourse);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(inst => 
        inst.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [instructors, searchQuery, selectedCourse]);

  const getInstructorStatus = (instructorId: string) => {
    // This is a mock function - replace with actual online status logic
    const statuses = ['online', 'away', 'offline'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMMM d, yyyy');
    }
  };

  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};
    messages.forEach(message => {
      const date = getMessageDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">
        <Card className="w-full bg-white/50 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-0 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:h-[550px] gap-4">
              {/* Left sidebar: Instructors list */}
              <Card className="w-full sm:w-96 flex flex-col bg-white/80 backdrop-blur-sm border border-[#3F3FFF]/10">
                <div className="p-4 border-b border-[#3F3FFF]/10">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search instructors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/50 border-[#3F3FFF]/20 focus:border-[#3F3FFF]/40 transition-colors"
                      />
                    </div>
                    <Select 
                      value={selectedCourse || 'all'} 
                      onValueChange={(value) => handleCourseSelect(value === 'all' ? '' : value)}
                    >
                      <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm border-[#3F3FFF]/20 hover:border-[#3F3FFF]/40 transition-colors">
                        <SelectValue placeholder="Filter by course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courseGroups.map((course) => (
                          <SelectItem key={course.courseId} value={course.courseId}>
                            {course.courseTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <AnimatePresence>
                    {isLoadingInstructors ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[#3F3FFF]" />
                      </div>
                    ) : filteredInstructors.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center py-8 text-center"
                      >
                        <MessageSquare className="h-12 w-12 text-[#3F3FFF]/40 mb-4" />
                        <p className="text-muted-foreground mb-2">No instructors found</p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or course filter
                        </p>
                      </motion.div>
                    ) : (
                      <div className="space-y-2 p-2">
                        {filteredInstructors.map((inst, index) => (
                          <motion.div
                            key={`${inst.courseId}-${inst.instructor.id}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div
                                  className={cn(
                                    "p-3 rounded-lg cursor-pointer transition-all duration-300",
                                    selectedInstructor === inst.instructor.id && selectedCourse === inst.courseId
                                      ? "bg-[#3F3FFF]/10 border-l-4 border-l-[#3F3FFF]"
                                      : "hover:bg-[#3F3FFF]/5 border-l-4 border-l-transparent"
                                  )}
                                  onClick={() => {
                                    setSelectedInstructor(inst.instructor.id);
                                    setSelectedCourse(inst.courseId);
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="relative">
                                      <Avatar className="h-10 w-10 ring-2 ring-white">
                                        <AvatarFallback className="bg-[#3F3FFF]/10 text-[#3F3FFF]">
                                          {inst.instructor.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span 
                                        className={cn(
                                          "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white",
                                          getInstructorStatus(inst.instructor.id) === 'online' ? "bg-green-500" :
                                          getInstructorStatus(inst.instructor.id) === 'away' ? "bg-yellow-500" :
                                          "bg-gray-500"
                                        )}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">
                                        {inst.instructor.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground truncate">
                                        {inst.courseTitle}
                                      </p>
                                    </div>
                                    {conversations.some(conv => 
                                      conv.partner._id === inst.instructor.id && 
                                      conv.unreadCount > 0
                                    ) && (
                                      <Badge className="bg-[#3F3FFF] text-white">
                                        {conversations.find(conv => conv.partner._id === inst.instructor.id)?.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="flex justify-between space-x-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-[#3F3FFF]/10 text-[#3F3FFF]">
                                      {inst.instructor.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-semibold">{inst.instructor.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Course: {inst.courseTitle}
                                    </p>
                                    <div className="flex items-center pt-2">
                                      <span 
                                        className={cn(
                                          "h-2 w-2 rounded-full mr-2",
                                          getInstructorStatus(inst.instructor.id) === 'online' ? "bg-green-500" :
                                          getInstructorStatus(inst.instructor.id) === 'away' ? "bg-yellow-500" :
                                          "bg-gray-500"
                                        )}
                                      />
                                      <span className="text-xs text-muted-foreground capitalize">
                                        {getInstructorStatus(inst.instructor.id)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </Card>

              {/* Main Chat Area */}
              <Card className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm border border-[#3F3FFF]/10">
                {selectedInstructor && selectedCourse ? (
                  <>
                    {/* Enhanced Instructor Header */}
                    <div className="px-6 py-4 border-b border-[#3F3FFF]/10 bg-[#f9f9ff]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                              <AvatarFallback className="bg-[#E6E6FF] text-[#3F3FFF] font-medium">
                                {filteredInstructors.find(i => i.instructor.id === selectedInstructor)?.instructor.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span 
                              className={cn(
                                "absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white",
                                getInstructorStatus(selectedInstructor) === 'online' ? "bg-green-500" :
                                getInstructorStatus(selectedInstructor) === 'away' ? "bg-yellow-500" :
                                "bg-gray-500"
                              )}
                            />
                          </div>
                          <div>
                            <h2 className="font-medium text-lg">
                              {filteredInstructors.find(i => i.instructor.id === selectedInstructor)?.instructor.name}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{filteredInstructors.find(i => i.instructor.id === selectedInstructor)?.courseTitle}</span>
                              <span className="inline-flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Last active {formatDistanceToNow(new Date(), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Instructor Profile</DropdownMenuItem>
                            <DropdownMenuItem>Schedule 1:1 Session</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Report an Issue</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Quick Reply Suggestions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {QUICK_REPLIES.map((reply, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="bg-white/50 text-sm"
                            onClick={() => setNewMessage(reply)}
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4 sm:p-6">
                      <AnimatePresence mode="popLayout">
                        {isLoadingMessages ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#3F3FFF]" />
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                              <div key={date} className="space-y-4">
                                <div className="relative">
                                  <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#3F3FFF]/10" />
                                  </div>
                                  <div className="relative flex justify-center">
                                    <span className="bg-white px-2 text-xs text-muted-foreground">
                                      {date}
                                    </span>
                                  </div>
                                </div>

                                {dateMessages.map((message, index) => (
                                  <motion.div
                                    key={message._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                      "flex",
                                      message.senderId._id === selectedInstructor ? "justify-start" : "justify-end"
                                    )}
                                  >
                                    {message.senderId._id === selectedInstructor && (
                                      <Avatar className="h-8 w-8 mr-2 self-end mb-1">
                                        <AvatarFallback className="bg-[#3F3FFF]/10 text-[#3F3FFF]">
                                          {filteredInstructors.find(i => i.instructor.id === selectedInstructor)?.instructor.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    <div className="group relative">
                                      <div
                                        className={cn(
                                          "max-w-[70%] p-3 rounded-xl shadow-sm",
                                          message.senderId._id === selectedInstructor
                                            ? "bg-white text-foreground rounded-tl-none"
                                            : "bg-[#3F3FFF] text-white rounded-tr-none"
                                        )}
                                      >
                                        <p className="text-sm break-words">{message.content}</p>
                                      </div>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className={cn(
                                              "flex items-center gap-1 mt-1",
                                              message.senderId._id === selectedInstructor
                                                ? "justify-start"
                                                : "justify-end"
                                            )}>
                                              <p className={cn(
                                                "text-[10px] opacity-0 group-hover:opacity-100 transition-opacity",
                                                message.senderId._id === selectedInstructor
                                                  ? "text-muted-foreground"
                                                  : "text-white/70"
                                              )}>
                                                {format(new Date(message.createdAt), 'h:mm a')}
                                              </p>
                                              {message.senderId._id !== selectedInstructor && (
                                                <CheckCheck className="h-3 w-3 text-[#3F3FFF]" />
                                              )}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Sent {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </AnimatePresence>
                    </ScrollArea>

                    {/* Enhanced Input Area */}
                    <div className="p-4 border-t border-[#3F3FFF]/10 bg-white/50">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }} 
                        className="flex items-center space-x-2"
                      >
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Type your message"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="w-full bg-white/80 border-[#3F3FFF]/20 focus:border-[#3F3FFF]/40 rounded-full px-4 py-2 pr-12 shadow-sm"
                          />
                        </div>
                        <Button 
                          type="submit"
                          size="icon"
                          className="bg-[#3F3FFF] hover:bg-[#3F3FFF]/90 text-white rounded-full h-10 w-10 shadow-lg hover:shadow-[#3F3FFF]/25 transition-all duration-300"
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        >
                          {sendMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex items-center justify-center text-center p-8"
                  >
                    <div className="space-y-6">
                      <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 bg-[#3F3FFF]/10 rounded-full animate-ping" />
                        <div className="relative bg-white rounded-full p-4 shadow-lg">
                          <MessageSquare className="h-16 w-16 text-[#3F3FFF]" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-medium bg-gradient-to-r from-[#3F3FFF] to-blue-600 bg-clip-text text-transparent">
                          Start a Conversation
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                          Select an instructor to ask questions, clarify topics, and get instant help with your course materials.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4 border-[#3F3FFF]/20 hover:bg-[#3F3FFF]/5"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Choose an Instructor
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ContactInstructorsPage; 