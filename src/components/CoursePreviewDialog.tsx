import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, AlertCircle, Info, CheckCircle, Clock, User, Image } from "lucide-react";
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

interface CoursePreviewDialogProps {
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

const CoursePreviewDialog = ({ courseId, isOpen, onClose }: CoursePreviewDialogProps) => {
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
    queryKey: ['course-preview', courseId],
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
          <DialogTitle className="sr-only">Course Preview</DialogTitle>
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
          <DialogTitle className="sr-only">Course Preview</DialogTitle>
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogTitle className="sr-only">Course Preview</DialogTitle>
        <ScrollArea className="max-h-[90vh] w-full">
          <div className="min-h-[90vh] bg-gradient-to-b from-background to-gray-50">
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Course Image */}
                  {course.image ? (
                    <div className="w-full md:w-48 aspect-video rounded-lg overflow-hidden border shadow-sm flex-shrink-0">
                      <img 
                        src={course.image} 
                        alt={`${course.title} image`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full md:w-48 aspect-video h-32 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border">
                      <Image className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Short Description - Moved to the right of the image */}
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      {course.title}
                    </h1>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50 mt-2">
                      <p className="text-sm font-semibold text-foreground">
                        {course.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm mt-2">
                      {course.rating && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500 flex">★★★★☆</span>
                            <span className="font-medium">{course.rating}</span>
                          </div>
                          <div className="text-muted-foreground">•</div>
                        </>
                      )}
                      {course.students && (
                        <div className="text-muted-foreground">{course.students?.toLocaleString()} students</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Course Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Long Description */}
                  {course.longDescription && (
                    <div className="bg-card rounded-xl p-6 border space-y-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        About This Course
                      </h2>
                      <div className="prose prose-gray dark:prose-invert max-w-none">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {course.longDescription}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Instructor Info */}
                  {course.instructor && (
                    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{course.instructor}</p>
                        <p className="text-sm text-muted-foreground">Course Instructor</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Current Day Content */}
                  {currentDay && (
                    <div className="bg-card rounded-xl p-6 border space-y-6">
                      <div>
                        <h2 className="text-xl font-bold mb-2">Day {selectedDay} - {currentDay.topics}</h2>
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
                  <div className="bg-card rounded-xl shadow-lg border sticky top-6">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Course Content</h3>
                      <p className="text-sm text-muted-foreground mt-1">{course.roadmap.length} Days</p>
                    </div>
                    <ScrollArea className="h-[calc(60vh-2rem)]">
                      <div className="p-3 space-y-2">
                        {course.roadmap.map((day) => (
                          <button
                            key={day.day}
                            onClick={() => setSelectedDay(day.day)}
                            className={`w-full p-3 rounded-lg text-sm transition-colors text-left hover:bg-muted ${
                              selectedDay === day.day
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full ${
                                  selectedDay === day.day ? 'bg-primary text-white' : 'bg-muted-foreground/20'
                                } flex items-center justify-center text-xs`}>
                                  {day.day}
                                </div>
                                Day {day.day}
                              </span>
                              {selectedDay === day.day && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className={`text-xs mt-2 line-clamp-2 ${
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
                    
                    <div className="p-4 border-t bg-muted/30">
                      <div className="text-sm text-muted-foreground">
                        <div className="mb-3 font-medium">Course information:</div>
                        <ul className="space-y-2">
                          {course.skills && course.skills.length > 0 && (
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{course.skills.length} skills covered</span>
                            </li>
                          )}
                          <li className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration || `${course.roadmap.length} days`} of content</span>
                          </li>
                          {course.level && (
                            <li className="flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              <span>{course.level} level</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Skills Section */}
              {course.skills && course.skills.length > 0 && (
                <div className="mt-8 lg:mt-12 bg-card rounded-xl p-6 border">
                  <h2 className="text-xl font-semibold mb-6">Skills Covered</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {course.skills.map((skill, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePreviewDialog; 