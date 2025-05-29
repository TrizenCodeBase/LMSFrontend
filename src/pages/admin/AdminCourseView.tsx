import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, AlertCircle, Info, CheckCircle, Clock, User, Image, X, Star, Users as UsersIcon, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface CourseData {
  _id: string;
  title: string;
  description: string;
  longDescription?: string;
  instructor?: string;
  instructorAvatar?: string;
  thumbnail?: string;
  image?: string;
  students?: number;
  rating?: number;
  duration?: string;
  level?: string;
  skills?: string[];
  roadmap: {
    day: number;
    topics: string;
    video: string;
    notes?: string;
    transcript?: string;
    mcqs?: {
      question: string;
      options: string[];
      correctAnswer: number;
    }[];
  }[];
}

interface AdminCourseViewProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
  const getDriveFileId = (url: string) => {
    try {
      const pattern = /(?:https?:\/\/)?(?:drive\.google\.com\/)?(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/;
      const match = url.match(pattern);
      return match ? match[1] : '';
    } catch (error) {
      console.error('Error parsing Google Drive URL:', error);
      return '';
    }
  };

  const fileId = getDriveFileId(videoUrl);

  if (fileId) {
    const driveEmbedUrl = `https://drive.google.com/file/d/${fileId}/preview?controls=0&disablekb=1&modestbranding=1&rel=0&showinfo=0&enablejsapi=1&widgetid=1&fs=0&iv_load_policy=3&playsinline=1&autohide=1&html5=1&cc_load_policy=0`;
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
      <iframe
        title="Course Video"
        width="100%"
        height="100%"
        src={driveEmbedUrl}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
        <Plyr
          source={{
            type: 'video',
            sources: [ { src: videoUrl, provider: 'html5' } ]
          }}
          options={{
            controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
            settings: ['quality', 'speed'],
            keyboard: { global: true }
          }}
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center text-white">
      Invalid video URL
    </div>
  );
};

const AdminCourseView = ({ courseId, isOpen, onClose }: AdminCourseViewProps) => {
  const [selectedDay, setSelectedDay] = React.useState<number>(1);
  const [contentSections, setContentSections] = React.useState<{
    transcript: boolean;
    topics: boolean;
    mcqs: boolean;
  }>({
    transcript: false,
    topics: false,
    mcqs: false
  });

  const { data: course, isLoading, error } = useQuery<CourseData, Error>({
    queryKey: ['admin-course', courseId],
    queryFn: async () => {
      const { data } = await axios.get<CourseData>(`/api/courses/${courseId}`);
      return data;
    },
    enabled: isOpen && !!courseId,
  });

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">
            <VisuallyHidden>Loading Course Content</VisuallyHidden>
          </DialogTitle>
          <DialogDescription className="sr-only">
            <VisuallyHidden>Please wait while we load the course details</VisuallyHidden>
          </DialogDescription>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin">
              <Video className="h-8 w-8" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !course) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">
            <VisuallyHidden>Error Loading Course</VisuallyHidden>
          </DialogTitle>
          <DialogDescription className="sr-only">
            <VisuallyHidden>There was a problem loading the course details</VisuallyHidden>
          </DialogDescription>
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-red-500">Failed to load course content</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentDay = course.roadmap.find(day => day.day === selectedDay);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden p-0 bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl border-0 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-primary/10 shadow border border-gray-200"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
        <ScrollArea className="max-h-[90vh] w-full">
          <div className="min-h-[90vh] bg-gradient-to-b from-white/80 to-blue-50">
            <div className="p-6 sm:p-10 pb-0">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 mb-8">
                {/* Course Image */}
                <div className="flex-shrink-0">
                  {course.image ? (
                    <div className="w-44 h-44 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg bg-white">
                      <img 
                        src={course.image} 
                        alt={`${course.title} image`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 rounded-2xl bg-muted flex items-center justify-center border-2 border-primary/20 shadow-lg">
                      <Image className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary mb-2 leading-tight drop-shadow-sm">
                    {course.title}
                  </h1>
                  <div className="bg-muted/40 rounded-lg p-4 border border-border/50 mb-3">
                    <p className="text-base font-medium text-foreground">
                      {course.description}
                    </p>
                  </div>
                  {/* Stat Bar */}
                  <div className="flex flex-wrap gap-4 items-center text-sm font-medium mb-2">
                    <span className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-4 w-4" />
                      {course.rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1 text-blue-700">
                      <Clock className="h-4 w-4" />
                      {course.duration || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1 text-green-700">
                      <UsersIcon className="h-4 w-4" />
                      {course.students?.toLocaleString() || 0} students
                    </span>
                    {course.level && (
                      <span className="flex items-center gap-1 text-purple-700">
                        <Tag className="h-4 w-4" />
                        {course.level}
                      </span>
                    )}
                  </div>
                  {/* Skills/Tags */}
                  {course.skills && course.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {course.skills.map((skill, idx) => (
                        <span key={idx} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold border border-primary/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <hr className="my-4 border-blue-100" />
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column - Course Info */}
                <div className="lg:col-span-2 space-y-8">
                  {/* About Section */}
                  {course.longDescription && (
                    <div className="bg-white/90 rounded-2xl p-6 border shadow-sm space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                        <Info className="h-5 w-5 text-primary" />
                        About This Course
                      </h2>
                      <div className="prose prose-gray dark:prose-invert max-w-none">
                        <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {course.longDescription}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Instructor Info */}
                  {course.instructor && (
                    <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-primary/5 to-blue-100 rounded-xl border shadow-sm mt-2">
                      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow">
                        <User className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-primary mb-0.5">{course.instructor}</p>
                        <p className="text-xs text-muted-foreground">Course Instructor</p>
                      </div>
                    </div>
                  )}
                  {/* Current Day Content */}
                  {currentDay && (
                    <div className="bg-white/90 rounded-2xl p-6 border shadow space-y-6 mt-4">
                      <div>
                        <h2 className="text-xl font-bold mb-2 text-primary">Day {selectedDay} - {currentDay.topics}</h2>
                      </div>
                      <Card className="overflow-hidden border-0 shadow-sm">
                        <CardContent className="p-0">
                          <VideoPlayer videoUrl={currentDay.video} />
                        </CardContent>
                      </Card>
                      {currentDay.notes && (
                        <Card className="border shadow-sm">
                          <CardContent className="p-4 prose prose-sm max-w-none">
                            <h3 className="text-lg font-semibold mb-2">Notes</h3>
                            <div className="text-muted-foreground whitespace-pre-wrap">
                              {currentDay.notes}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {/* Collapsible Transcript */}
                      <Collapsible 
                        open={contentSections.transcript} 
                        onOpenChange={(open) => setContentSections(prev => ({ ...prev, transcript: open }))}
                        className="rounded-md border shadow-sm"
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-t-md">
                            <h3 className="text-lg font-semibold">Video Transcript</h3>
                            <Button variant="ghost" size="sm">
                              {contentSections.transcript ? "Hide" : "Show"}
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 border-t">
                          {currentDay.transcript ? (
                            <p className="text-muted-foreground whitespace-pre-wrap">
                              {currentDay.transcript}
                            </p>
                          ) : (
                            <p className="text-muted-foreground italic">
                              No transcript available for this video.
                            </p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                      {/* Quiz Questions */}
                      {currentDay.mcqs && currentDay.mcqs.length > 0 && (
                        <Collapsible 
                          open={contentSections.mcqs} 
                          onOpenChange={(open) => setContentSections(prev => ({ ...prev, mcqs: open }))}
                          className="rounded-md border shadow-sm"
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-t-md">
                              <h3 className="text-lg font-semibold">Quiz Questions</h3>
                              <Button variant="ghost" size="sm">
                                {contentSections.mcqs ? "Hide" : "Show"}
                              </Button>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-4 border-t">
                            <div className="space-y-4">
                              {currentDay.mcqs.map((mcq, index) => (
                                <div key={index} className="space-y-2">
                                  <p className="font-medium">{mcq.question}</p>
                                  <ul className="space-y-1">
                                    {mcq.options.map((option, optIndex) => (
                                      <li 
                                        key={optIndex}
                                        className={`p-2 rounded-md ${
                                          mcq.correctAnswer === optIndex
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-50'
                                        }`}
                                      >
                                        {option}
                                        {mcq.correctAnswer === optIndex && (
                                          <Badge className="ml-2 bg-green-500">Correct Answer</Badge>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  )}
                </div>
                {/* Right Column - Course Days */}
                <div className="lg:col-span-1">
                  <div className="bg-white/90 rounded-2xl shadow-xl border sticky top-6">
                    <div className="p-5 border-b">
                      <h3 className="font-bold text-lg text-primary">Course Content</h3>
                      <p className="text-xs text-muted-foreground mt-1">{course.roadmap.length} Days</p>
                    </div>
                    <ScrollArea className="h-[calc(60vh-2rem)]">
                      <div className="p-3 space-y-2">
                        {course.roadmap.map((day) => (
                          <button
                            key={day.day}
                            onClick={() => setSelectedDay(day.day)}
                            className={`w-full p-3 rounded-lg text-sm transition-colors text-left font-medium border flex flex-col gap-1 shadow-sm ${
                              selectedDay === day.day
                                ? 'bg-primary/10 border-primary text-primary shadow-md'
                                : 'hover:bg-muted border-gray-200 text-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-bold border ${
                                  selectedDay === day.day ? 'bg-primary text-white border-primary' : 'bg-muted-foreground/20 border-gray-300 text-gray-700'
                                }`}>
                                  {day.day}
                                </div>
                                Day {day.day}
                              </span>
                              {selectedDay === day.day && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className={`text-xs mt-1 line-clamp-2 ${
                              selectedDay === day.day 
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}>
                              {day.topics}
                            </p>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCourseView; 