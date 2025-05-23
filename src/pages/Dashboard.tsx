import React, { useState } from 'react';
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEnrolledCourses } from "@/services/courseService";
import { useInstructorMessages, useSendMessage } from "@/services/chatService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, Calendar, BookOpen, GraduationCap, Trophy, ArrowRight, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'instructor' | 'student';
  timestamp: Date;
  courseId: string;
}

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'lecture' | 'assignment' | 'exam' | 'workshop';
  course: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { data: enrolledCourses, isLoading, isError } = useEnrolledCourses(token);
  const { data: messages = [], isLoading: isLoadingMessages } = useInstructorMessages(user?.id || '');
  const sendMessageMutation = useSendMessage();
  const [selectedDate] = useState<Date>(new Date());

  // Calculate progress for a single course
  const calculateCourseProgress = (course: any) => {
    if (!course.duration || !course.roadmap) return course.progress || 0;
    const totalDurationDays = parseInt(course.duration.split(' ')[0]);
    const availableDays = course.roadmap.length;
    const completedDays = Math.ceil(((course.progress || 0) / 100) * availableDays);
    
    // Calculate progress based on completed days relative to total duration
    return Math.min(100, Math.round((completedDays / totalDurationDays) * 100));
  };

  // Calculate total progress across all courses
  const totalProgress = enrolledCourses?.length
    ? Math.round(
        enrolledCourses.reduce((sum, course) => sum + calculateCourseProgress(course), 0) / 
        enrolledCourses.length
      )
    : 0;

  // Group messages by course and instructor
  const messagesByCourse = React.useMemo(() => {
    if (!messages) return {};
    return messages.reduce((acc: Record<string, Message[]>, message) => {
      const courseId = message.courseId;
      if (!acc[courseId]) acc[courseId] = [];
      acc[courseId].push(message);
      return acc;
    }, {});
  }, [messages]);

  // Example events - replace with actual events from your service
  const events: Event[] = [
    {
      id: '1',
      title: 'Introduction to React',
      date: new Date(2024, 4, 10),
      time: '10:00 AM',
      type: 'lecture',
      course: 'React Development'
    },
    {
      id: '2',
      title: 'React Hooks Assignment',
      date: new Date(2024, 4, 12),
      time: '2:00 PM',
      type: 'assignment',
      course: 'React Development'
    }
  ];

  // Filter events for today and upcoming
  const upcomingEvents = events.filter(event => event.date >= selectedDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  const handleSendMessage = async (content: string) => {
    if (!user) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        receiverId: user.id,
        courseId: '', // Add the appropriate courseId
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}/weeks`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name || "Student"}!</h1>
          <p className="text-muted-foreground">Track your progress and stay updated with your courses</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                  <h3 className="text-2xl font-bold mt-1">{totalProgress}%</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Enrolled Courses</p>
                  <h3 className="text-2xl font-bold mt-1">{enrolledCourses?.length || 0}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Courses</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {enrolledCourses?.filter(course => 
                      course.progress === 100 && 
                      (!course.duration || 
                        parseInt(course.duration.split(' ')[0]) <= (course.roadmap?.length || 0))
                    ).length || 0}
                  </h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Discussions</p>
                  <h3 className="text-2xl font-bold mt-1">{messages.length}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Progress Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">My Courses</CardTitle>
                <Button 
                  variant="ghost" 
                  className="text-sm hover:bg-primary/10 transition-colors" 
                  onClick={() => navigate('/my-courses')}
                >
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                )}
                {isError && (
                  <div className="text-center py-4 text-red-500">
                    Failed to load courses. Please try again later.
                  </div>
                )}
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {enrolledCourses?.map((course) => {
                      // Calculate progress based on course duration
                      const calculateProgress = () => {
                        if (!course.duration || !course.roadmap) return course.progress || 0;
                        const totalDurationDays = parseInt(course.duration.split(' ')[0]);
                        const availableDays = course.roadmap.length;
                        const completedDays = Math.ceil(((course.progress || 0) / 100) * availableDays);
                        
                        // Calculate progress based on completed days relative to total duration
                        return Math.min(100, Math.round((completedDays / totalDurationDays) * 100));
                      };

                      const actualProgress = calculateProgress();
                      const isFullyComplete = (course.progress === 100) && 
                        (!course.duration || parseInt(course.duration.split(' ')[0]) <= (course.roadmap?.length || 0));

                      return (
                        <Card 
                          key={course.id} 
                          className="p-4 hover:shadow-md transition-all cursor-pointer border-l-4 hover:border-l-primary"
                          onClick={() => handleCourseClick(course._id || course.id)}
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="font-medium text-lg">{course.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  <span>Instructor: {course.instructor}</span>
                                </div>
                              </div>
                              <Badge variant={isFullyComplete ? "outline" : "secondary"}>
                                {actualProgress}% Complete
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <Progress 
                                value={actualProgress} 
                                className={`h-2 ${isFullyComplete ? "bg-green-100" : ""}`}
                              />
                              {course.progress === 100 && !isFullyComplete && (
                                <p className="text-xs text-blue-600">
                                  All available content completed
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming Events Card */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No Upcoming Events</h3>
                    <p className="text-sm text-muted-foreground">
                      You don't have any scheduled events at the moment.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {upcomingEvents.map(event => (
                        <Card 
                          key={event.id} 
                          className="p-3 hover:shadow-md transition-all cursor-pointer border-l-4 hover:border-l-primary"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{event.title}</span>
                              <Badge variant="outline" className="ml-auto">
                                {event.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {event.course}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-2" />
                              {formatDistanceToNow(event.date, { addSuffix: true })} at {event.time}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
