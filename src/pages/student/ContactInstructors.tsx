import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Send, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useConversations, useMessages, useSendMessage, useCourseInstructors } from '@/services/messageService';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

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

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Contact Instructors</CardTitle>
              <Select value={selectedCourse || 'all'} onValueChange={(value) => handleCourseSelect(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full sm:w-[250px]">
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
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:h-[500px] gap-4">
              {/* Left sidebar: Instructors list */}
              <Card className="w-full sm:w-80 flex flex-col bg-white">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search instructors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-2">
                  {isLoadingInstructors ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredInstructors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-muted-foreground mb-2">No instructors found</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search or course filter
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredInstructors.map((inst) => (
                        <div
                          key={`${inst.courseId}-${inst.instructor.id}`}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-colors",
                            selectedInstructor === inst.instructor.id && selectedCourse === inst.courseId
                              ? "bg-primary/10"
                              : "hover:bg-muted"
                          )}
                          onClick={() => {
                            setSelectedInstructor(inst.instructor.id);
                            setSelectedCourse(inst.courseId);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {inst.instructor.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
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
                              <Badge variant="secondary">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>

              {/* Main Chat Area */}
              <Card className="flex-1 flex flex-col bg-white">
                {selectedInstructor && selectedCourse ? (
                  <>
                    {/* Chat Header */}
                    <div className="px-4 py-3 sm:px-6 sm:py-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {filteredInstructors.find(i => i.instructor.id === selectedInstructor)?.instructor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-semibold">
                            {filteredInstructors.find(i => i.instructor.id === selectedInstructor)?.instructor.name}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {filteredInstructors.find(i => i.instructor.id === selectedInstructor)?.courseTitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4 sm:p-6 bg-gray-50">
                      {isLoadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message._id}
                              className={cn(
                                "flex",
                                message.senderId._id === selectedInstructor ? "justify-start" : "justify-end"
                              )}
                            >
                              {message.senderId._id === selectedInstructor && (
                                <Avatar className="h-8 w-8 mr-2 self-end mb-1">
                                  <AvatarFallback>
                                    {filteredInstructors.find(i => i.instructor.id === selectedInstructor)?.instructor.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={cn(
                                  "max-w-[70%] p-3 rounded-lg shadow-sm relative",
                                  message.senderId._id === selectedInstructor
                                    ? "bg-blue-700 text-white rounded-tl-none"
                                    : "bg-white text-blue-700 border border-gray-200 rounded-tr-none"
                                )}
                              >
                                <p className="text-sm break-words">{message.content}</p>
                                <p className="text-[10px] opacity-70 text-right mt-1">
                                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-3 sm:p-4 bg-white border-t">
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
                            className="w-full bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full px-4 py-2"
                          />
                        </div>
                        <Button 
                          type="submit"
                          size="icon"
                          className="bg-primary hover:bg-primary/90 rounded-full"
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
                  <div className="h-full flex items-center justify-center text-center p-8">
                    <div className="space-y-4">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">Select an Instructor</h3>
                        <p className="text-sm text-muted-foreground">
                          Choose an instructor from your enrolled courses to start a conversation
                        </p>
                      </div>
                    </div>
                  </div>
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