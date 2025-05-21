import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../lib/axios';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, CheckCircle, AlertCircle, Menu, Lock, Unlock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUpdateProgress, Course, RoadmapDay } from '@/services/courseService';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MCQQuiz from '@/components/MCQQuiz';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';

// Import your logo image
import companyLogo from '/logo_footer.png'; // Adjust path as needed

interface CourseData extends Course {
  _id: string;
  title: string;
  description: string;
  roadmap: RoadmapDay[];
}

interface QuizResults {
  dayNumber: number;
  score: number;
  completedAt: Date;
  totalQuestions: number;
}

interface ContentSections {
  transcript: boolean;
  topics: boolean;
  mcqs: boolean;
}

const VideoPlayer = ({ 
  videoUrl, 
  onVideoComplete,
  isEnabled = true 
}: { 
  videoUrl: string;
  onVideoComplete: () => void;
  isEnabled?: boolean;
}) => {
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [lastValidTime, setLastValidTime] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
  
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkVideoProgress = () => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            event: 'requesting',
            func: 'getCurrentTime'
          }),
          '*'
        );
      }
    };

    timer = setInterval(checkVideoProgress, 500);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://drive.google.com') {
        try {
          const data = JSON.parse(event.data);
          
          if (data.currentTime) {
            const newTime = parseFloat(data.currentTime);
            
            if (newTime > lastValidTime + 1 && newTime - lastValidTime < 10) {
              console.log('User tried to skip forward', newTime, lastValidTime);
              iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({
                  event: 'command',
                  func: 'seekTo',
                  args: [lastValidTime]
                }),
                '*'
              );
              setCurrentTime(lastValidTime);
            } else {
              setLastValidTime(newTime);
              setCurrentTime(newTime);
            }
          }

          if (data.percentPlayed >= 95 && !isVideoCompleted) {
            setIsVideoCompleted(true);
            onVideoComplete();
            clearInterval(timer);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(timer);
      window.removeEventListener('message', handleMessage);
    };
  }, [onVideoComplete, isVideoCompleted, lastValidTime]);

  // Show locked overlay if not enabled
  if (!isEnabled) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/90 flex items-center justify-center text-white">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 mx-auto" />
          <p>Complete the previous day's content to unlock this video</p>
        </div>
      </div>
    );
  }

  // If it's a Google Drive link, embed via iframe
  if (fileId) {
    const driveEmbedUrl = `https://drive.google.com/file/d/${fileId}/preview?controls=0&disablekb=1&modestbranding=1&rel=0&showinfo=0&enablejsapi=1&widgetid=1&fs=0&iv_load_policy=3&playsinline=1&autohide=1&html5=1&cc_load_policy=0`;
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
        <iframe
          ref={iframeRef}
          title="Course Video"
          width="100%"
          height="100%"
          src={driveEmbedUrl}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
        {/* Logo overlay */}
        <div className="absolute top-2 md:top-4 z-5 flex items-center" style={{ right: '-3px' }}>
          <div className="absolute inset-0 bg-black/0 rounded-lg -z-5" />
          <div className="px-2 py-1 md:px-3 md:py-2">
            <img src={companyLogo} alt="Company Logo" className="h-5 w-auto md:h-7" />
          </div>
        </div>
      </div>
    );
  }

  // Fallback: custom player for direct video playback (e.g., Minio-stored video)
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
      <Plyr
        source={{
          type: 'video',
          sources: [
            {
              src: videoUrl,
              provider: 'html5'
            }
          ]
        }}
        options={{
          controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
          settings: ['quality', 'speed'],
          keyboard: { global: true }
        }}
        onEnded={onVideoComplete}
      />
      {/* Logo overlay */}
      <div className="absolute top-2 md:top-4 z-5 flex items-center" style={{ right: '-3px' }}>
        <div className="absolute inset-0 bg-black/0 rounded-lg -z-5" />
        <div className="px-2 py-1 md:px-3 md:py-2">
          <img src={companyLogo} alt="Company Logo" className="h-5 w-auto md:h-7" />
        </div>
      </div>
    </div>
  );
};

const TranscriptSection = ({ transcript }: { transcript?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!transcript) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Video Transcript</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "prose prose-sm max-w-none text-muted-foreground",
            !isExpanded && "max-h-32 overflow-hidden"
          )}
        >
          {transcript}
        </div>
      </CardContent>
    </Card>
  );
};

const QuizResultsDisplay = ({ results }: { results: QuizResults }) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Quiz Results - Day {results.dayNumber}</h3>
            <Badge className={cn(
              "text-white",
              results.score >= 70 ? "bg-green-500" : 
              results.score >= 50 ? "bg-yellow-500" : 
              "bg-red-500"
            )}>
              Score: {results.score}%
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Completed: {format(results.completedAt, 'PPp')}
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Questions Completed:</span>
              <span>{results.totalQuestions} questions</span>
            </div>
            
            <div className="w-full bg-secondary h-2 rounded-full">
              <div 
                className={cn(
                  "h-2 rounded-full",
                  getScoreColor(results.score)
                )} 
                style={{ width: `${results.score}%` }}
              />
            </div>
            
            <p className="text-sm text-muted-foreground mt-2">
              {results.score >= 70 ? "Great job! You've mastered this topic." :
               results.score >= 50 ? "Good effort! Review the material to improve your score." :
               "Keep practicing! Review the material and try again."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CourseWeekView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<number[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState<number[]>([]);
  const [contentSections, setContentSections] = useState<ContentSections>({
    transcript: false,
    topics: false,
    mcqs: false
  });
  const { token, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const updateProgressMutation = useUpdateProgress();
  const navigate = useNavigate();
  const [quizResults, setQuizResults] = useState<Record<number, QuizResults>>({});
  const location = useLocation();
  const transcriptRef = useRef<HTMLDetailsElement>(null);
  const topicsRef = useRef<HTMLDetailsElement>(null);
  const mcqsRef = useRef<HTMLDetailsElement>(null);

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dayParam = params.get('day');
    const startQuiz = params.get('startQuiz');
    const review = params.get('review');

    if (dayParam) {
      const day = parseInt(dayParam);
      setSelectedDay(day);
      
      if (startQuiz === 'true') {
        setShowQuiz(true);
        setContentSections(prev => ({ ...prev, mcqs: true }));
      }
      
      if (review === 'true') {
        setContentSections(prev => ({ ...prev, mcqs: true }));
      }
    }
  }, [location.search]);

  const { data: course, isLoading, error } = useQuery<CourseData>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error("Course ID is required");
      const { data } = await axios.get(`/api/courses/${courseId}`);
      return data as CourseData;
    },
    enabled: !!courseId && isAuthenticated
  });

  useEffect(() => {
    if (!loading && !isAuthenticated && courseId) {
      localStorage.setItem('redirectPath', `/course/${courseId}/weeks`);
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate, courseId]);

  useEffect(() => {
    if (course && course.roadmap) {
      if (course.roadmap.length > 0 && selectedDay === 0) {
        setSelectedDay(course.roadmap[0].day);
      }
      
      if (typeof course.progress === 'number' && course.roadmap) {
        const completedCount = Math.round((course.progress * course.roadmap.length) / 100);
        const newCompletedDays = Array.from({ length: completedCount }, (_, i) => i + 1);
        setCompletedDays(newCompletedDays);
      }
    }
  }, [course, selectedDay]);

  const handleDayComplete = async (day: number) => {
    if (!token || !courseId || !course?.roadmap) return;
    
    let newCompletedDays: number[];
    
    if (completedDays.includes(day)) {
      newCompletedDays = completedDays.filter(d => d !== day);
    } else {
      newCompletedDays = [...completedDays, day];
    }
    
    setCompletedDays(newCompletedDays);
    
    const progressPercentage = Math.round((newCompletedDays.length / course.roadmap.length) * 100);
    
    let status = 'enrolled';
    if (progressPercentage > 0 && progressPercentage < 100) {
      status = 'started';
    } else if (progressPercentage === 100) {
      status = 'completed';
    }
    
    try {
      await updateProgressMutation.mutateAsync({
        courseId,
        progress: progressPercentage,
        status: status as 'enrolled' | 'started' | 'completed',
        dayNumber: day,
        token
      });
      
      toast({
        title: completedDays.includes(day) ? "Progress removed" : "Progress saved",
        description: completedDays.includes(day) 
          ? `Day ${day} marked as incomplete` 
          : `Day ${day} marked as complete`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving progress",
        description: error.response?.data?.message || "Could not update your course progress. Please try again.",
        variant: "destructive",
      });
      
      setCompletedDays(completedDays);
    }
  };

  const handleVideoComplete = (day: number) => {
    console.log(`Video ${day} completed`);
    setWatchedVideos(prev => [...prev, day]);
  };

  const handleQuizComplete = async (score: number) => {
    if (!courseId || !token) return;

    const currentDay = selectedDay;
    const dayData = course?.roadmap.find(day => day.day === currentDay);
    
    try {
      // Submit to database
      const response = await axios.post('/api/quiz-submissions', {
        courseId,
        dayNumber: currentDay,
        title: `Day ${currentDay} Quiz`,
        score,
        completedAt: new Date().toISOString(),
        isCompleted: true,
        status: 'completed'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        // Update local state
        setQuizCompleted(prev => [...prev, currentDay]);
        setShowQuiz(false);
        
        // Store quiz results
        setQuizResults(prev => ({
          ...prev,
          [currentDay]: {
            dayNumber: currentDay,
            score,
            completedAt: new Date(),
            totalQuestions: dayData?.mcqs?.length || 0
          }
        }));
        
        toast({
          title: "Quiz completed",
          description: `You scored ${score}% on the quiz for Day ${currentDay}`,
        });
        
        // Mark day as complete after quiz
        if (!completedDays.includes(currentDay)) {
          handleDayComplete(currentDay);
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error submitting quiz",
        description: "There was an error saving your quiz results. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isVideoEnabled = (day: number) => {
    if (day === 1) return true;
    return completedDays.includes(day - 1);
  };

  const isMCQsEnabled = (day: number) => {
    return watchedVideos.includes(day) || completedDays.includes(day);
  };

  const isDayLocked = (day: number) => {
    if (day === 1) return false;
    return !completedDays.includes(day - 1);
  };

  const handleDaySelect = (day: number) => {
    if (isDayLocked(day)) {
      toast({
        title: "Day Locked",
        description: "Please complete the previous day first.",
        variant: "destructive"
      });
      return;
    }
    setSelectedDay(day);
    setIsSidebarOpen(false);
    setShowQuiz(false);
  };

  const toggleSection = (section: keyof ContentSections) => {
    setContentSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleDetails = (ref: React.RefObject<HTMLDetailsElement>) => {
    if (ref.current) {
      ref.current.open = !ref.current.open;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b">
        <h2 className="font-semibold">Course Content</h2>
        <p className="text-sm text-muted-foreground">{course?.title}</p>
      </div>
      <ScrollArea className="h-[calc(100vh-10rem)] md:h-[calc(100vh-10rem)]">
        <div className="p-4 space-y-2">
          {course?.roadmap.map((day) => (
            <button
              key={day.day}
              onClick={() => handleDaySelect(day.day)}
              className={cn(
                "flex flex-col w-full p-3 rounded-lg text-sm gap-1 transition-colors text-left",
                selectedDay === day.day
                  ? "bg-primary text-primary-foreground"
                  : isDayLocked(day.day)
                  ? "bg-gray-100 hover:bg-gray-200 cursor-not-allowed"
                  : "hover:bg-muted",
                completedDays.includes(day.day) && selectedDay !== day.day && "text-green-500"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Day {day.day}</span>
                  {completedDays.includes(day.day) && (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {isDayLocked(day.day) && (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <span className="text-xs opacity-70">
                  {completedDays.includes(day.day) 
                    ? 'Completed' 
                    : isDayLocked(day.day)
                    ? 'Locked'
                    : 'Not Started'}
                </span>
              </div>
              <p className={cn(
                "text-xs mt-1 line-clamp-2",
                selectedDay === day.day 
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              )}>
                {day.topics}
              </p>
              {day.mcqs && day.mcqs.length > 0 && (
                <div className={cn(
                  "text-xs mt-1",
                  selectedDay === day.day 
                    ? "text-primary-foreground/80"
                    : "text-blue-500"
                )}>
                  Quiz: {day.mcqs.length} questions
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <Progress 
          value={(completedDays.length / (course?.roadmap.length || 1)) * 100} 
          className="h-2"
        />
        <p className="text-sm text-muted-foreground mt-2">
          {completedDays.length} of {course?.roadmap.length} days completed
        </p>
      </div>
    </>
  );

  if (isLoading || error || !course) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          {isLoading ? (
            <div className="animate-spin"><Video className="h-6 w-6" /></div>
          ) : (
            <div className="flex items-center text-red-500">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>Error loading course content</span>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const currentDay = course.roadmap.find(day => day.day === selectedDay);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-80 border-r bg-muted/40">
          <SidebarContent />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentDay && (
            <div className="max-w-4xl mx-auto space-y-6 pt-12 md:pt-0">
              <div>
                <h1 className="text-xl md:text-2xl font-bold mb-2">Day {currentDay.day}</h1>
                <p className="text-sm md:text-base text-muted-foreground">{currentDay.topics}</p>
              </div>

              {showQuiz && currentDay.mcqs && currentDay.mcqs.length > 0 ? (
                <MCQQuiz 
                  questions={currentDay.mcqs} 
                  onComplete={handleQuizComplete}
                  dayNumber={currentDay.day}
                />
              ) : (
                <>
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <VideoPlayer 
                        videoUrl={currentDay.video} 
                        onVideoComplete={() => handleVideoComplete(currentDay.day)}
                        isEnabled={isVideoEnabled(currentDay.day)}
                      />
                    </CardContent>
                  </Card>

                  {currentDay.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg md:text-xl">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap">
                          {currentDay.notes}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Dropdown sections for Transcript */}
                  <details ref={transcriptRef} className="rounded-md border mb-4 bg-background">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 list-none">
                      <div className="flex items-center justify-between w-full">
                        <CardTitle className="text-lg md:text-xl">Video Transcript</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleDetails(transcriptRef);
                          }}
                        >
                          {transcriptRef.current?.open ? "Hide" : "Show"}
                        </Button>
                      </div>
                    </summary>
                    <div className="p-4 border-t">
                      {currentDay.transcript ? (
                        <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap">
                          {currentDay.transcript}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No transcript available for this video.</p>
                      )}
                    </div>
                  </details>

                  {/* Dropdown sections for Topics */}
                  <details ref={topicsRef} className="rounded-md border mb-4 bg-background">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 list-none">
                      <div className="flex items-center justify-between w-full">
                        <CardTitle className="text-lg md:text-xl">Topics Covered</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleDetails(topicsRef);
                          }}
                        >
                          {topicsRef.current?.open ? "Hide" : "Show"}
                        </Button>
                      </div>
                    </summary>
                    <div className="p-4 border-t">
                      <p className="text-sm md:text-base text-muted-foreground">
                        {currentDay.topics}
                      </p>
                    </div>
                  </details>

                  {/* Dropdown sections for MCQs */}
                  <details 
                    ref={mcqsRef}
                    className={cn(
                      "rounded-md border mb-4 bg-background",
                      !isMCQsEnabled(currentDay.day) && "opacity-80"
                    )}
                  >
                    <summary className={cn(
                      "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 list-none",
                      !isMCQsEnabled(currentDay.day) && "cursor-not-allowed"
                    )}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg md:text-xl">Quiz Questions</CardTitle>
                          {!isMCQsEnabled(currentDay.day) && <Lock className="h-4 w-4 text-muted-foreground" />}
                          {isMCQsEnabled(currentDay.day) && <Unlock className="h-4 w-4 text-green-500" />}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          type="button"
                          disabled={!isMCQsEnabled(currentDay.day)}
                          onClick={(e) => {
                            e.preventDefault();
                            if (isMCQsEnabled(currentDay.day)) {
                              toggleDetails(mcqsRef);
                            }
                          }}
                        >
                          {mcqsRef.current?.open ? "Hide" : "Show"}
                        </Button>
                      </div>
                    </summary>
                    {isMCQsEnabled(currentDay.day) && (
                      <div className="p-4 border-t">
                        {currentDay.mcqs && currentDay.mcqs.length > 0 ? (
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              Take this quiz to test your understanding of the material covered in today's lesson.
                            </p>
                            {!quizCompleted.includes(currentDay.day) ? (
                              <Button 
                                onClick={() => setShowQuiz(true)}
                                className="w-full"
                              >
                                Start Quiz ({currentDay.mcqs.length} questions)
                              </Button>
                            ) : (
                              <>
                                <div className="flex items-center justify-center gap-2 text-green-500">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>You've completed this quiz</span>
                                </div>
                                {quizResults[currentDay.day] && (
                                  <QuizResultsDisplay results={quizResults[currentDay.day]} />
                                )}
                                <Button 
                                  variant="outline"
                                  onClick={() => setShowQuiz(true)}
                                  className="w-full mt-4"
                                >
                                  Retake Quiz
                                </Button>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No quiz questions available for this lesson.</p>
                        )}
                      </div>
                    )}
                  </details>

                  <Button
                    onClick={() => handleDayComplete(currentDay.day)}
                    variant="default"
                    className={cn(
                      "w-full",
                      completedDays.includes(currentDay.day)
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {completedDays.includes(currentDay.day)
                      ? "Mark as Incomplete"
                      : "Mark as Complete"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseWeekView;
