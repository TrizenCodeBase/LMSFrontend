import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../lib/axios';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, CheckCircle, AlertCircle, Menu, Lock, Unlock, Clock, ArrowRight, Loader2, Save, FileText, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUpdateProgress, Course, RoadmapDay, useCourseDetails } from '@/services/courseService';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MCQQuiz from '@/components/MCQQuiz';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import { CustomToast } from "@/components/ui/custom-toast";
import { ToastAction } from '@/components/ui/toast';
import { Textarea } from "@/components/ui/textarea";
import React from 'react';
import { debounce } from 'lodash-es';
import RichTextEditor from '@/components/RichTextEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Note, saveNote, getNotes, updateNote } from '@/services/notesService';

// Import your logo image
import companyLogo from '/logo_footer.png'; // Adjust path as needed

interface CourseData extends Course {
  _id: string;
  title: string;
  description: string;
  roadmap: RoadmapDay[];
}

interface QuizAttempt {
  dayNumber: number;
  score: number;
  completedAt: Date;
  totalQuestions: number;
  attemptNumber: number;
}

interface ContentSections {
  transcript: boolean;
  topics: boolean;
  mcqs: boolean;
}

interface QuizSubmissionResponse {
  data: {
    dayNumber: number;
    score: number;
    submittedDate: string;
    questions: any[];
    attemptNumber: number;
  }[];
  message: string;
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
  const playerRef = useRef<any>(null);

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
      <div className="relative w-full h-full">
        <iframe
          ref={iframeRef}
          title="Course Video"
          width="100%"
          height="100%"
          src={driveEmbedUrl}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
        />
        {/* Logo overlay */}
        <div className="absolute top-2 md:top-4 z-10 flex items-center" style={{ right: '-3px' }}>
          <div className="absolute inset-0 bg-black/0 rounded-lg -z-5" />
          {/* <div className="px-2 py-1 md:px-3 md:py-2"> */}
            {/* <img src={companyLogo} alt="Company Logo" className="h-5 w-auto md:h-7" /> */}
          {/* </div> */}
        </div>
      </div>
    );
  }

  // Fallback: custom player for direct video playback
  return (
    <div className="relative w-full h-full">
      <div ref={playerRef} className="absolute inset-0">
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
            keyboard: { global: true },
            ratio: '16:9'
        }}
        onEnded={onVideoComplete}
      />
      </div>
      {/* Logo overlay */}
      <div className="absolute top-2 md:top-4 z-10 flex items-center" style={{ right: '-3px' }}>
        <div className="absolute inset-0 bg-black/0 rounded-lg -z-5" />
        {/* <div className="px-2 py-1 md:px-3 md:py-2">
          <img src={companyLogo} alt="Company Logo" className="h-5 w-auto md:h-7" />
        </div> */}
      </div>
    </div>
  );
};

// Memoize the VideoPlayer component
const MemoizedVideoPlayer = React.memo(VideoPlayer);

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

const QuizResultsDisplay = ({ attempts, onNextDay }: { 
  attempts: QuizAttempt[];
  onNextDay?: () => void;
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-secondary";
    if (score >= 50) return "text-primary";
    return "text-destructive";
  };

  const getBgColor = (score: number) => {
    if (score >= 90) return "bg-green-500/10";
    if (score >= 70) return "bg-secondary/10";
    if (score >= 50) return "bg-primary/10";
    return "bg-destructive/10";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return "🎯";
    if (score >= 70) return "✨";
    if (score >= 50) return "💪";
    return "📚";
  };

  const getScoreMessage = (score: number, attemptNumber: number) => {
    if (score >= 90) return "Excellent!";
    if (score >= 70) return "Well Done!";
    if (score >= 50) return attemptNumber < 2 ? "Keep Going!" : "Review Content";
    return attemptNumber < 2 ? "Try Again" : "Review Content";
  };

  const bestScore = Math.max(...attempts.map(a => a.score));
  const hasPassingScore = attempts.some(attempt => attempt.score >= 70);
  const isWithinAttemptLimit = attempts.length < 2;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {attempts.map((attempt) => (
          <Card 
            key={attempt.attemptNumber}
            className={cn(
              "transition-all duration-200 hover:shadow-lg",
              getBgColor(attempt.score)
            )}
          >
            <CardContent className="p-6">
        <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-lg mb-1">Attempt {attempt.attemptNumber}</h4>
                    <div className="flex items-center gap-2">
            <Badge className={cn(
                        "text-white font-medium",
                        attempt.score >= 90 ? "bg-green-500" :
                        attempt.score >= 70 ? "bg-secondary" : 
                        attempt.score >= 50 ? "bg-primary" : 
              "bg-destructive"
            )}>
                        {attempt.score}%
            </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getScoreMessage(attempt.score, attempt.attemptNumber)}
                      </span>
                    </div>
                  </div>
                  <span className="text-2xl" role="img" aria-label="score emoji">
                    {getScoreEmoji(attempt.score)}
                  </span>
          </div>
          
                <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {format(attempt.completedAt, 'PPp')}
            </div>
            
                  <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Questions:</span>
                      <span className="font-medium">{attempt.totalQuestions}</span>
            </div>
            
                    <div className="w-full h-2 rounded-full bg-background overflow-hidden">
              <div 
                className={cn(
                          "h-full rounded-full transition-all duration-500",
                          attempt.score >= 90 ? "bg-green-500" :
                          attempt.score >= 70 ? "bg-secondary" : 
                          attempt.score >= 50 ? "bg-primary" : 
                          "bg-destructive"
                )} 
                        style={{ width: `${attempt.score}%` }}
              />
            </div>
                  </div>
          </div>
        </div>
      </CardContent>
    </Card>
        ))}
      </div>

      {onNextDay && hasPassingScore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onNextDay}
            className="flex items-center gap-2 min-w-[200px] bg-primary hover:bg-primary/90"
            size="lg"
          >
            <CheckCircle className="h-5 w-5" />
            <span>Continue to Next Day</span>
          </Button>
        </div>
      )}

      {/* Show attempt limit message */}
      {!isWithinAttemptLimit && !hasPassingScore && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 text-center">
            You've used all your attempts for this quiz.
          </p>
        </div>
      )}

      {/* Show passing score message */}
      {hasPassingScore && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 text-center">
            {bestScore === 100 
              ? "🎉 Congratulations! You've achieved a perfect score of 100%!"
              : `Congratulations! You've passed this quiz with a score of ${bestScore}%. You can still retake it to improve your score.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

// Memoized Notes component
const NotesSection = React.memo(({ 
  day, 
  value, 
  onChange,
  onSave,
  isSaving
}: { 
  day: number;
  value: string;
  onChange: (day: number, value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) => (
  <Card>
    <CardContent className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Day {day} Notes</h3>
        <Button 
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Notes</span>
            </>
          )}
        </Button>
      </div>
      <RichTextEditor
        value={value || ''}
        onChange={(newValue) => onChange(day, newValue)}
        placeholder="Take notes while watching the video..."
      />
    </CardContent>
  </Card>
));

const CourseWeekView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<number[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizView, setShowQuizView] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState<number[]>([]);
  const [notes, setNotes] = useState<Record<number, { _id: string; content: string }>>({});
  const { token, isAuthenticated, loading, user } = useAuth();
  const { toast } = useToast();
  const updateProgressMutation = useUpdateProgress();
  const navigate = useNavigate();
  const [quizResults, setQuizResults] = useState<Record<number, QuizAttempt[]>>({});
  const location = useLocation();
  const [isMarking, setIsMarking] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [unsavedNotes, setUnsavedNotes] = useState<Record<number, string>>({});
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [activeTab, setActiveTab] = useState("notes");

  // Remove unused refs and state
  const [contentSections, setContentSections] = useState<ContentSections>({
    transcript: false,
    topics: false,
    mcqs: false
  });

  // Add state for tracking open dropdowns
  const [openDropdowns, setOpenDropdowns] = useState<number[]>([]);

  // Add new state for video marking
  const [isMarkingVideo, setIsMarkingVideo] = useState(false);

  // Add new state for quiz numbers
  const [quizNumbers, setQuizNumbers] = useState<Record<number, number>>({});

  // Add function to extract number from duration
  const extractDurationDays = (duration: string): number => {
    const match = duration.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

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

  // Use the courseId directly with useCourseDetails
  const { data: course, isLoading, error } = useCourseDetails(courseId);

  useEffect(() => {
    if (!loading && !isAuthenticated && courseId) {
      localStorage.setItem('redirectPath', `/course/${courseId}/weeks`);
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate, courseId]);

  // Add this new function to sync watched videos with completed days
  const syncWatchedVideosWithCompletedDays = (completedDays: number[]) => {
    // Get any locally stored watched videos
    const storedWatchedVideos = localStorage.getItem(`watchedVideos-${courseId}`);
    const localWatchedVideos = storedWatchedVideos ? JSON.parse(storedWatchedVideos) : [];
    
    // Combine stored videos with completed days (since completed days must have watched videos)
    const combinedWatchedVideos = Array.from(new Set([...localWatchedVideos, ...completedDays]));
    
    // Update localStorage
    localStorage.setItem(`watchedVideos-${courseId}`, JSON.stringify(combinedWatchedVideos));
    
    // Update state
    setWatchedVideos(combinedWatchedVideos);
  };

  // Add function to calculate quiz numbers
  const calculateQuizNumbers = (roadmap: RoadmapDay[]) => {
    const quizDays = roadmap
      .filter(day => day.mcqs && day.mcqs.length > 0)
      .sort((a, b) => a.day - b.day);

    const numbering: Record<number, number> = {};
    quizDays.forEach((day, index) => {
      numbering[day.day] = index + 1;
    });

    setQuizNumbers(numbering);
  };

  // Update useEffect to calculate quiz numbers when course data is loaded
  useEffect(() => {
    if (course?.roadmap) {
      calculateQuizNumbers(course.roadmap);
      
      if (course.roadmap.length > 0 && selectedDay === 0) {
        setSelectedDay(course.roadmap[0].day);
      }
      
      if (typeof course.progress === 'number' && course.roadmap) {
        if (course.completedDays) {
          setCompletedDays(course.completedDays);
          syncWatchedVideosWithCompletedDays(course.completedDays);
        } else {
        const completedCount = Math.round((course.progress * course.roadmap.length) / 100);
        const newCompletedDays = Array.from({ length: completedCount }, (_, i) => i + 1);
        setCompletedDays(newCompletedDays);
          syncWatchedVideosWithCompletedDays(newCompletedDays);
      }
    }
    }
  }, [course]);

  // Effect to scroll to selected day in sidebar after page load
  useEffect(() => {
    if (selectedDay > 0) {
      const scrollToSelectedDay = () => {
        const dayElement = document.getElementById(`sidebar-day-${selectedDay}`);
        if (dayElement) {
          dayElement.scrollIntoView({ block: 'center' });
        }
      };
      // Small delay to ensure elements are rendered
      setTimeout(scrollToSelectedDay, 100);
    }
  }, [selectedDay]);

  // Add scroll offset calculation
  const navigateToQuizTab = () => {
    setActiveTab("quiz");
    setContentSections(prev => ({ ...prev, mcqs: true }));
    
    // Add small delay to ensure tab content is rendered
    setTimeout(() => {
      const quizSection = document.getElementById('quiz-tab-content');
      const headerOffset = 80; // Adjust this value based on your header height
      if (quizSection) {
        const elementPosition = quizSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // Update the navigateToQuiz function
  const navigateToQuiz = (day: number) => {
    setShowQuizView(true);
    setSelectedDay(day);
    const params = new URLSearchParams(location.search);
    params.set('day', day.toString());
    params.set('view', 'quiz');
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Add this helper function to check completion criteria
  const checkDayCompletion = (day: number) => {
    // Check video completion
    const isVideoCompleted = watchedVideos.includes(day);
    if (!isVideoCompleted) return false;

    // Check if day has quiz
    const dayData = course?.roadmap.find(d => d.day === day);
    const hasQuiz = dayData?.mcqs && dayData.mcqs.length > 0;

    // If there's no quiz, only video completion is required
    if (!hasQuiz) return true;

    // If there's a quiz, check for submission
    const hasQuizSubmission = quizResults[day] && quizResults[day].length > 0;
    return hasQuizSubmission;
  };

  // Add this after the checkDayCompletion function
  const isDayLocked = (day: number) => {
    if (day === 1) return false;
    const previousDay = day - 1;
    return !completedDays.includes(previousDay);
  };

  // Update handleVideoMarkComplete function
  const handleVideoMarkComplete = async () => {
    try {
      setIsMarkingVideo(true);
      
      if (watchedVideos.includes(selectedDay)) {
        // If video is being marked as incomplete
        // Remove this day and all subsequent days from watched videos
        const newWatchedVideos = watchedVideos.filter(day => day < selectedDay);
        setWatchedVideos(newWatchedVideos);
        localStorage.setItem(`watchedVideos-${courseId}`, JSON.stringify(newWatchedVideos));
        
        // Remove this day and all subsequent days from completed days
        if (completedDays.includes(selectedDay)) {
          const newCompletedDays = completedDays.filter(d => d < selectedDay);
          
          if (course?._id) {
            const progressPercentage = Math.round((newCompletedDays.length / (course?.roadmap.length || 1)) * 100);
            const status = progressPercentage === 0 ? 'enrolled' : 'started';
            
            await updateProgressMutation.mutateAsync({
              courseId: course._id,
              progress: progressPercentage,
              status: status as 'enrolled' | 'started' | 'completed',
              token,
              completedDays: newCompletedDays
            });
            
            setCompletedDays(newCompletedDays);
          }
        }
        
        toast({
          description: (
            <CustomToast 
              title="Video Status Updated"
              description="Video and subsequent days marked as incomplete"
              type="info"
            />
          ),
          duration: 3000,
          className: "p-0 bg-transparent border-0"
        });
      } else {
        // Mark video as complete
        const newWatchedVideos = [...watchedVideos, selectedDay];
        setWatchedVideos(newWatchedVideos);
        localStorage.setItem(`watchedVideos-${courseId}`, JSON.stringify(newWatchedVideos));
        
        // If there's a quiz, navigate to it
        if (course?.roadmap.find(d => d.day === selectedDay)?.mcqs?.length > 0) {
          setShowQuizView(true);
        } else {
          // If no quiz, check if we should mark the day as complete
          if (checkDayCompletion(selectedDay)) {
            await handleDayComplete(selectedDay);
          }
        }
      }
    } catch (error) {
      console.error('Error updating video status:', error);
      toast({
        description: (
          <CustomToast 
            title="Error"
            description="Failed to update video status. Please try again."
            type="error"
          />
        ),
        duration: 3000,
        className: "p-0 bg-transparent border-0"
      });
    } finally {
      setIsMarkingVideo(false);
    }
  };

  // Update handleQuizComplete function
  const handleQuizComplete = async (score: number, selectedAnswers: number[]) => {
    if (!course?.courseUrl || !token || !selectedDay) return;

    const currentDay = selectedDay;
    const dayData = course?.roadmap.find(day => day.day === currentDay);
    
    try {
      // Get the current attempts for this day
      const currentAttempts = quizResults[currentDay] || [];
      const attemptNumber = currentAttempts.length + 1;

      // Prepare quiz submission data with all required fields
      const submissionData = {
        courseId: course._id,
        courseUrl: course.courseUrl,
        dayNumber: currentDay,
        title: `Day ${currentDay} Quiz`,
        questions: dayData?.mcqs || [],
        selectedAnswers: selectedAnswers,
        score: Math.round(score),
        submittedDate: new Date().toISOString(),
        attemptNumber: attemptNumber,
        totalQuestions: dayData?.mcqs?.length || 0,
        userId: user?.id,
        forceRetake: true,
        isRetake: attemptNumber > 1, // Add flag to indicate this is a retake
        overrideCompletion: true, // Add flag to override completion check
        allowMultipleAttempts: true // Add flag to explicitly allow multiple attempts
      };

      console.log('Submitting quiz data:', submissionData);

      // Submit to database with retry logic
      let response;
      try {
        response = await axios.post('/api/quiz-submissions', submissionData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'X-Allow-Retake': 'true', // Add header to indicate retake is allowed
            'X-Attempt-Number': attemptNumber.toString() // Add attempt number in header
        }
      });
      } catch (submitError: any) {
        // If we get "already completed" error, try one more time with stronger override flags
        if (submitError.response?.data?.error === 'already_completed') {
          submissionData.forceRetake = true;
          submissionData.overrideExisting = true; // Add additional override flag
          response = await axios.post('/api/quiz-submissions', submissionData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Allow-Retake': 'true',
              'X-Attempt-Number': attemptNumber.toString(),
              'X-Force-Override': 'true' // Add additional override header
            }
          });
        } else {
          throw submitError; // If it's a different error, rethrow it
        }
      }

      if (response?.data) {
        // Update local state
        const newAttempt = {
          dayNumber: currentDay,
          score,
          completedAt: new Date(),
          totalQuestions: dayData?.mcqs?.length || 0,
          attemptNumber,
          isCompleted: score >= 70
        };

        setQuizResults(prev => ({
          ...prev,
          [currentDay]: [...(prev[currentDay] || []), newAttempt]
        }));

        if (!quizCompleted.includes(currentDay)) {
          setQuizCompleted(prev => [...prev, currentDay]);
        }

        setShowQuiz(false);

        // Show appropriate message based on attempt number
        let toastMessage = '';
        if (attemptNumber <= 2) {
          toastMessage = `Attempt ${attemptNumber} completed! You scored ${score}%.`;
        if (score >= 70) {
            toastMessage += ' Great job!';
          } else if (attemptNumber < 2) {
            toastMessage += ' You have one more attempt remaining.';
          }
        } else {
          toastMessage = `Additional attempt completed! You scored ${score}%.`;
        }

          toast({
            description: (
              <CustomToast 
                title="Quiz Submitted"
              description={toastMessage}
              type={score >= 70 ? "success" : "info"}
              />
            ),
            duration: 3000,
            className: "p-0 bg-transparent border-0"
          });
      }
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      const errorMessage = error.response?.data?.message || "Failed to submit quiz. Please try again.";
      console.log('Server error:', errorMessage);
      console.log('Error response:', error.response?.data);
      
      toast({
        description: (
          <CustomToast 
            title="Error"
            description={errorMessage}
            type="error"
          />
        ),
        duration: 3000,
        className: "p-0 bg-transparent border-0"
      });
    }
  };

  // Update handleDayComplete to use the new completion logic
  const handleDayComplete = async (day: number) => {
    try {
      setIsMarking(true);
      
      // Check if all completion criteria are met
      if (!checkDayCompletion(day)) {
        toast({
          description: (
            <CustomToast 
              title="Cannot Complete Day"
              description="Please ensure you've watched the video and completed the quiz (if required)."
              type="error"
            />
          ),
          duration: 3000,
          className: "p-0 bg-transparent border-0"
        });
        return;
      }
    
      // Calculate new completed days
      let newCompletedDays: number[];
      if (completedDays.includes(day)) {
        newCompletedDays = completedDays.filter(d => d < day);
      } else {
        const previousDay = day - 1;
        if (day > 1 && !checkDayCompletion(previousDay)) {
          toast({
            description: (
              <CustomToast 
                title="Invalid Action"
                description="You must complete the previous day's content first."
                type="error"
              />
            ),
            duration: 3000,
            className: "p-0 bg-transparent border-0"
          });
          return;
        }
        newCompletedDays = [...completedDays, day];
      }
      
      if (!course?._id) {
        throw new Error('Course ID not found');
      }
      
      const progressPercentage = Math.round((newCompletedDays.length / (course?.roadmap.length || 1)) * 100);
      
      let status = 'enrolled';
      if (progressPercentage > 0 && progressPercentage < 100) {
        status = 'started';
      } else if (progressPercentage === 100) {
        status = 'completed';
      }
      
      const result = await updateProgressMutation.mutateAsync({
        courseId: course._id,
        progress: progressPercentage,
        status: status as 'enrolled' | 'started' | 'completed',
        token,
        completedDays: newCompletedDays
      });
      
      if (result) {
        setCompletedDays(newCompletedDays);
        
          toast({
            description: (
              <CustomToast 
              title="Progress Updated"
              description={completedDays.includes(day) 
                ? "Day marked as incomplete"
                : "Day marked as complete"}
              type={completedDays.includes(day) ? "info" : "success"}
              />
            ),
          duration: 3000,
            className: "p-0 bg-transparent border-0"
          });
      }
    } catch (error: any) {
      toast({
        description: (
          <CustomToast 
            title="Error saving progress"
            description={error.response?.data?.message || error.message || "Could not update your course progress. Please try again."}
            type="error"
          />
        ),
        duration: 3000,
        className: "p-0 bg-transparent border-0"
      });
    } finally {
      setIsMarking(false);
    }
  };

  // Update handleVideoComplete to persist watched videos
  const handleVideoComplete = (day: number) => {
    console.log(`Video ${day} completed`);
    const newWatchedVideos = [...watchedVideos, day];
    setWatchedVideos(newWatchedVideos);
    
    // Store in localStorage
    localStorage.setItem(`watchedVideos-${courseId}`, JSON.stringify(newWatchedVideos));
    
    // Check if both video and quiz are completed
    const dayData = course?.roadmap.find(d => d.day === day);
    const hasQuiz = dayData?.mcqs && dayData.mcqs.length > 0;
    
    if (!hasQuiz || (hasQuiz && quizResults[day]?.some(attempt => attempt.score >= 70))) {
      handleDayComplete(day);
    }
  };

  const isVideoEnabled = (day: number) => {
    if (day === 1) return true;
    return completedDays.includes(day - 1);
  };

  const isMCQsEnabled = (day: number) => {
    return watchedVideos.includes(day) || completedDays.includes(day);
  };

  // Persist view state and handle URL parameters
  useEffect(() => {
    if (courseId && selectedDay > 0) {
      const params = new URLSearchParams(location.search);
      const isQuizView = params.get('view') === 'quiz';
      
      // Update URL when quiz view changes
      if (showQuizView !== isQuizView) {
        const newParams = new URLSearchParams(location.search);
        if (showQuizView) {
          newParams.set('view', 'quiz');
        } else {
          newParams.delete('view');
        }
        navigate(`?${newParams.toString()}`, { replace: true });
      }

      // Store in localStorage
      localStorage.setItem(`lastViewedDay-${courseId}`, selectedDay.toString());
      localStorage.setItem(`quizView-${courseId}`, showQuizView.toString());
    }
  }, [courseId, selectedDay, showQuizView, location.search, navigate]);

  // Load initial state from URL and localStorage
  useEffect(() => {
    if (courseId) {
      const params = new URLSearchParams(location.search);
      const dayParam = params.get('day');
      const view = params.get('view');
      
      // Load last viewed day
      const lastViewedDay = dayParam || localStorage.getItem(`lastViewedDay-${courseId}`);
      if (lastViewedDay) {
        setSelectedDay(parseInt(lastViewedDay));
      }

      // Load quiz view state
      const storedQuizView = view === 'quiz' || localStorage.getItem(`quizView-${courseId}`) === 'true';
      setShowQuizView(storedQuizView);
    }
  }, [courseId, location.search]);

  // Update the handleDaySelect function
  const handleDaySelect = (day: number) => {
    if (isDayLocked(day)) {
      toast({
        description: (
          <CustomToast 
            title="Content Locked"
            description="Complete the previous day's content to unlock this day."
            type="error"
          />
        ),
        duration: 3000,
        className: "p-0 bg-red-600/75 border-0"
      });
      return;
    }

    setSelectedDay(day);
    setIsSidebarOpen(false);
    setShowQuiz(false);
    
    // Update URL parameters
    const params = new URLSearchParams(location.search);
    params.set('day', day.toString());
    params.delete('view'); // Remove quiz view when selecting a new day
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Prevent scroll reset on content updates
  useEffect(() => {
    document.body.style.scrollBehavior = 'auto';
    return () => {
      document.body.style.scrollBehavior = '';
    };
  }, []);

  const toggleSection = (section: keyof ContentSections) => {
    setContentSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleMarkComplete = async (day: number) => {
    await handleDayComplete(day);
    // Navigate to next day if available
    const nextDay = course?.roadmap.find(d => d.day === day + 1);
    if (nextDay) {
      setSelectedDay(nextDay.day);
    }
  };

  // Load notes from database on component mount
  useEffect(() => {
    const loadNotes = async () => {
      if (courseId && token) {
        try {
          const fetchedNotes = await getNotes(courseId, token);
          const notesMap: Record<number, { _id: string; content: string }> = {};
          fetchedNotes.forEach((note: Note) => {
            notesMap[note.dayNumber] = {
              _id: note._id!,
              content: note.content
            };
          });
          setNotes(notesMap);
        } catch (error) {
          console.error('Error loading notes:', error);
          toast({
            description: (
              <CustomToast 
                title="Error Loading Notes"
                description="Failed to load your notes. Please try again later."
                type="error"
              />
            ),
            duration: 3000,
            className: "p-0 bg-transparent border-0"
          });
        }
      }
    };

    loadNotes();
  }, [courseId, token, toast]);

  // Save notes function
  const saveNotes = async (day: number) => {
    try {
      setIsSavingNote(true);
      const content = unsavedNotes[day] ?? (notes[day]?.content || '');
      
      console.log('Attempting to save note:', {
        day,
        content,
        courseId,
        existingNoteId: notes[day]?._id
      });

      if (notes[day]?._id) {
        // Update existing note
        console.log('Updating existing note');
        const updatedNote = await updateNote(notes[day]._id, content, token);
        setNotes(prev => ({
          ...prev,
          [day]: {
            _id: updatedNote._id,
            content: updatedNote.content
          }
        }));
      } else {
        // Create new note
        console.log('Creating new note');
        const newNote = await saveNote({
          courseId,
          dayNumber: day,
          content,
          userId: user.id
        }, token);
        setNotes(prev => ({
          ...prev,
          [day]: {
            _id: newNote._id,
            content: newNote.content
          }
        }));
      }

      // Clear unsaved changes for this day
      setUnsavedNotes(prev => {
        const next = { ...prev };
        delete next[day];
        return next;
      });

      toast({
        description: (
          <CustomToast 
            title="Success"
            description="Notes saved successfully!"
            type="success"
          />
        ),
        duration: 3000,
        className: "p-0 bg-transparent border-0"
      });
    } catch (error: any) {
      console.error('Error saving note:', error);
      toast({
        description: (
          <CustomToast 
            title="Error Saving Note"
            description={error.response?.data?.message || "Failed to save your note. Please try again."}
            type="error"
          />
        ),
        duration: 3000,
        className: "p-0 bg-transparent border-0"
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  // Optimized notes change handler
  const handleNotesChange = React.useCallback((day: number, value: string) => {
    setUnsavedNotes(prev => ({
      ...prev,
      [day]: value
    }));
  }, []);

  // Memoize the video complete callback
  const handleVideoCompleteCallback = React.useCallback(() => {
    if (course && selectedDay) {
      handleVideoComplete(selectedDay);
    }
  }, [course, selectedDay]);

  // Update the fetchQuizSubmissions function
  const fetchQuizSubmissions = async () => {
    if (!course?.courseUrl || !token) return;
    
    try {
      // Use the specific endpoint that includes user's submissions
      const { data: responseData } = await axios.get<QuizSubmissionResponse>(`/api/quiz-submissions/${course.courseUrl}/${selectedDay}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const submissions = responseData.data || [];
      const newQuizResults: Record<number, QuizAttempt[]> = {};
      const completedQuizzes: number[] = [];

      submissions.forEach((submission) => {
        const dayNum = submission.dayNumber;
        if (!newQuizResults[dayNum]) {
          newQuizResults[dayNum] = [];
        }
        newQuizResults[dayNum].push({
          dayNumber: dayNum,
          score: submission.score,
          completedAt: new Date(submission.submittedDate),
          totalQuestions: submission.questions?.length || 0,
          attemptNumber: submission.attemptNumber
        });
        if (!completedQuizzes.includes(dayNum)) {
          completedQuizzes.push(dayNum);
        }
      });

      // Sort attempts by attemptNumber in descending order
      Object.keys(newQuizResults).forEach(dayNum => {
        if (newQuizResults[dayNum] && newQuizResults[dayNum].length > 0) {
          newQuizResults[parseInt(dayNum)].sort((a, b) => b.attemptNumber - a.attemptNumber);
        }
      });

      setQuizResults(newQuizResults);
      setQuizCompleted(completedQuizzes);
    } catch (error) {
      console.error('Error fetching quiz submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz results",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Fetch quiz submissions when component mounts
  useEffect(() => {
    if (course?.courseUrl && token) {
      fetchQuizSubmissions();
    }
  }, [course?.courseUrl, token]);

  // Update the handleCompleteAndContinue function
  const handleCompleteAndContinue = async (dayNumber: number) => {
    try {
      // Mark current day as complete if not already completed
      if (!completedDays.includes(dayNumber)) {
        // Add to watched videos if not already there
        if (!watchedVideos.includes(dayNumber)) {
          const newWatchedVideos = [...watchedVideos, dayNumber];
          setWatchedVideos(newWatchedVideos);
          localStorage.setItem(`watchedVideos-${courseId}`, JSON.stringify(newWatchedVideos));
        }

        // Mark day as complete
        const newCompletedDays = [...completedDays, dayNumber].sort((a, b) => a - b);
        
        if (course?._id) {
          const progressPercentage = Math.round((newCompletedDays.length / (course?.roadmap.length || 1)) * 100);
          const status = progressPercentage === 100 ? 'completed' : 'started';
          
          await updateProgressMutation.mutateAsync({
            courseId: course._id,
            progress: progressPercentage,
            status: status as 'enrolled' | 'started' | 'completed',
            token,
            completedDays: newCompletedDays
          });
          
          setCompletedDays(newCompletedDays);

          // Show success toast
          toast({
            description: (
              <CustomToast 
                title="Day Completed"
                description="You've unlocked the next day's content!"
                type="success"
              />
            ),
            duration: 3000,
            className: "p-0 bg-transparent border-0"
          });
        }
      }

      // Find and navigate to next day
      const nextDay = course?.roadmap.find(d => d.day === dayNumber + 1);
      if (nextDay) {
        setShowQuizView(false);
        setShowQuiz(false);
        setSelectedDay(nextDay.day);
        setActiveTab("notes");
        
        // Update URL parameters
        const params = new URLSearchParams(location.search);
        params.set('day', nextDay.day.toString());
        params.delete('view'); // Remove quiz view when navigating to next day
        navigate(`?${params.toString()}`, { replace: true });
        
        // Scroll to top when navigating to next day
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // If this is the last day, show a completion message
        toast({
          description: (
            <CustomToast 
              title="Course Progress"
              description="Congratulations! You've completed all available days."
              type="success"
            />
          ),
          duration: 3000,
          className: "p-0 bg-transparent border-0"
        });
      }
    } catch (error) {
      console.error('Error completing day:', error);
      toast({
        description: (
          <CustomToast 
            title="Error"
            description="Failed to complete the day. Please try again."
            type="error"
          />
        ),
        duration: 3000,
        className: "p-0 bg-transparent border-0"
      });
    }
  };

  // Add this helper function to calculate content stats
  const getContentStats = () => {
    if (!course?.roadmap) return { totalVideos: 0, totalQuizzes: 0, completedVideos: 0, completedQuizzes: 0 };
    
    const stats = course.roadmap.reduce((acc, day) => {
      // Count total videos (each day has one video)
      acc.totalVideos++;
      
      // Count completed videos
      if (watchedVideos.includes(day.day)) {
        acc.completedVideos++;
      }
      
      // Count total quizzes
      if (day.mcqs && day.mcqs.length > 0) {
        acc.totalQuizzes++;
        
        // Count completed quizzes (with passing score)
        if (quizResults[day.day]?.some(attempt => attempt.score >= 70)) {
          acc.completedQuizzes++;
        }
      }
      
      return acc;
    }, { totalVideos: 0, totalQuizzes: 0, completedVideos: 0, completedQuizzes: 0 });
    
    return stats;
  };

  const SidebarContent = () => {
    const totalDurationDays = course?.duration ? extractDurationDays(course.duration) : 0;
    const currentRoadmapDays = course?.roadmap?.length || 0;
    const remainingDays = Math.max(0, totalDurationDays - currentRoadmapDays);

    return (
      <>
        <div className="p-4 space-y-2">
          {course?.roadmap.map((day) => (
            day.mcqs && day.mcqs.length > 0 ? (
              <div key={day.day} className="space-y-1">
                <div
              id={`sidebar-day-${day.day}`}
              className={cn(
                "flex flex-col w-full p-3 rounded-lg text-sm gap-1 transition-colors text-left",
                selectedDay === day.day
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : isDayLocked(day.day)
                      ? "bg-gray-100 hover:bg-gray-100 cursor-not-allowed opacity-75"
                  : "hover:bg-muted",
                    completedDays.includes(day.day) && selectedDay !== day.day ? "text-emerald-600" : selectedDay === day.day ? "text-primary-foreground" : ""
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        selectedDay === day.day && "text-primary-foreground"
                      )}>Day {day.day}</span>
                  {completedDays.includes(day.day) && (
                        <CheckCircle className={cn(
                          "h-4 w-4",
                          selectedDay === day.day ? "text-primary-foreground" : "text-emerald-600"
                        )} />
                  )}
                  {isDayLocked(day.day) && (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                    <span className={cn(
                      "text-xs",
                      selectedDay === day.day ? "text-primary-foreground" : completedDays.includes(day.day) ? "text-emerald-600" : "opacity-70"
                    )}>
                  {completedDays.includes(day.day) 
                    ? 'Completed' 
                    : isDayLocked(day.day)
                    ? 'Locked'
                    : 'Not Started'}
                </span>
              </div>
              <p className={cn(
                    "text-xs line-clamp-2",
                selectedDay === day.day 
                  ? "text-primary-foreground/80"
                      : completedDays.includes(day.day)
                      ? "text-emerald-600/80"
                  : "text-muted-foreground"
              )}>
                {day.topics}
              </p>
                </div>

                <div className="ml-3 pl-3 border-l space-y-1">
                  <button
                    onClick={() => {
                      setShowQuizView(false);
                      handleDaySelect(day.day);
                      setActiveTab("notes");
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full p-2 rounded-md text-sm transition-colors",
                      selectedDay === day.day && !showQuizView
                        ? "bg-primary/10 text-primary"
                        : watchedVideos.includes(day.day)
                        ? "text-emerald-600 hover:bg-emerald-50"
                        : "hover:bg-muted"
                    )}
                  >
                    <Video className={cn(
                      "h-4 w-4",
                      watchedVideos.includes(day.day) && "text-emerald-600"
                    )} />
                    <span>Video Content</span>
                    {watchedVideos.includes(day.day) && (
                      <CheckCircle className="h-3.5 w-3.5 ml-auto text-emerald-600" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      if (isMCQsEnabled(day.day)) {
                        navigateToQuiz(day.day);
                      }
                    }}
                    disabled={!isMCQsEnabled(day.day)}
                    className={cn(
                      "flex items-center gap-2 w-full p-2 rounded-md text-sm transition-colors",
                      selectedDay === day.day && showQuizView
                        ? "bg-primary/10 text-primary"
                        : quizResults[day.day]?.some(attempt => attempt.score >= 70)
                        ? "text-emerald-600 hover:bg-emerald-50"
                        : "hover:bg-muted",
                      !isMCQsEnabled(day.day) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <FileText className={cn(
                      "h-4 w-4",
                      quizResults[day.day]?.some(attempt => attempt.score >= 70) && "text-emerald-600"
                    )} />
                    <span>Quiz {quizNumbers[day.day] || ''} ({day.mcqs.length} questions)</span>
                    {quizResults[day.day]?.some(attempt => attempt.score >= 70) && (
                      <CheckCircle className="h-3.5 w-3.5 ml-auto text-emerald-600" />
                    )}
                    {!isMCQsEnabled(day.day) && (
                      <Lock className="h-3 w-3 ml-auto" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                key={day.day}
                id={`sidebar-day-${day.day}`}
                onClick={() => {
                  setShowQuizView(false);
                  handleDaySelect(day.day);
                  setActiveTab("notes");
                }}
                className={cn(
                  "flex flex-col w-full p-3 rounded-lg text-sm gap-1 transition-colors text-left",
                  selectedDay === day.day 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : isDayLocked(day.day)
                    ? "bg-gray-100 hover:bg-gray-100 cursor-not-allowed opacity-75"
                    : "hover:bg-muted",
                  completedDays.includes(day.day) && selectedDay !== day.day ? "text-emerald-600" : selectedDay === day.day ? "text-primary-foreground" : ""
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      selectedDay === day.day && "text-primary-foreground"
                    )}>Day {day.day}</span>
                    {completedDays.includes(day.day) && (
                      <CheckCircle className={cn(
                        "h-4 w-4",
                        selectedDay === day.day ? "text-primary-foreground" : "text-emerald-600"
                      )} />
                    )}
                    {isDayLocked(day.day) && (
                      <Lock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs",
                    selectedDay === day.day ? "text-primary-foreground" : completedDays.includes(day.day) ? "text-emerald-600" : "opacity-70"
                  )}>
                    {completedDays.includes(day.day) 
                      ? 'Completed' 
                      : isDayLocked(day.day)
                      ? 'Locked'
                      : 'Not Started'}
                  </span>
                </div>
                <p className={cn(
                  "text-xs line-clamp-2",
                  selectedDay === day.day
                    ? "text-primary-foreground/80"
                    : completedDays.includes(day.day)
                    ? "text-emerald-600/80"
                    : "text-muted-foreground"
                )}>
                  {day.topics}
                </p>
            </button>
            )
          ))}

          {/* Add remaining days as blurred items */}
          {remainingDays > 0 && Array.from({ length: remainingDays }).map((_, index) => {
            const dayNumber = currentRoadmapDays + index + 1;
            return (
              <button
                key={`upcoming-${dayNumber}`}
                onClick={() => {
                  toast({
                    description: (
                      <CustomToast 
                        title="Content Locked"
                        description="New videos will be uploaded by the instructor soon."
                        type="error"
                      />
                    ),
                    duration: 3000,
                    className: "p-0 bg-red-50/5 border-0"
                  });
                }}
                className="flex flex-col w-full p-3 rounded-lg text-sm gap-1 transition-colors text-left bg-gray-100 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Day {dayNumber}</span>
                    <Lock className="h-4 w-4 text-gray-500" />
                  </div>
                  <span className="text-xs opacity-70">Coming Soon</span>
                </div>
                <p className="text-xs mt-1 line-clamp-2 text-muted-foreground">
                  Upcoming content
                </p>
              </button>
            );
          })}
        </div>
      </>
    );
  };

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
    <DashboardLayout courseTitle={course.title}>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar - Fixed */}
        <div className="hidden lg:block w-80 shrink-0 fixed top-16 bottom-0 left-0 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col h-full">
            <div className="p-4 sm:p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Course Content</h2>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{completedDays.length}/{course?.duration ? extractDurationDays(course.duration) : course?.roadmap.length || 0} days completed</span>
          </div>
                </div>
              </div>
              <Progress 
                value={(completedDays.length / (course?.duration ? extractDurationDays(course.duration) : course.roadmap.length)) * 100} 
                className="h-2 mt-4"
              />
            </div>

            <ScrollArea className="flex-1 px-3">
            <SidebarContent />
          </ScrollArea>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="lg:hidden fixed top-4 left-4 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0 flex flex-col">
            <div className="p-4 sm:p-6 border-b bg-muted/40">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Course Content</h2>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{completedDays.length}/{course?.duration ? extractDurationDays(course.duration) : course?.roadmap.length || 0} days completed</span>
                  </div>
                </div>
              </div>
              <Progress 
                value={(completedDays.length / (course?.duration ? extractDurationDays(course.duration) : course.roadmap.length)) * 100} 
                className="h-2 mt-4"
              />
            </div>
            <ScrollArea className="flex-1">
              <div className="px-3">
            <SidebarContent />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-80">
          <div className="flex-1 overflow-y-auto scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
            {currentDay && !showQuizView && (
              <div className="space-y-4 sm:space-y-6 p-4 sm:px-6 sm:py-6">
                {/* Header Section */}
                <div className="flex flex-col space-y-4 max-w-[1920px] mx-auto">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Day {currentDay.day}</h1>
                        {completedDays.includes(currentDay.day) && (
                          <Badge variant="secondary" className="h-6">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                        {currentDay.topics}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Section */}
                <div className="max-w-[1920px] mx-auto -mx-4 sm:mx-0">
                  <div className="relative">
                    {/* Video Container */}
                    <div className="video-container w-full max-w-5xl mx-auto transition-all duration-300 ease-in-out">
                      <Card className="overflow-hidden border-0 rounded-none sm:rounded-xl bg-transparent shadow-none">
                        <CardContent className="p-0">
                          <div className="bg-black w-full sm:rounded-xl overflow-hidden shadow-lg sm:shadow-2xl">
                            <div className="relative w-full aspect-video">
                              {!isVideoEnabled(currentDay.day) ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white">
                                  <div className="text-center space-y-3 p-4">
                                    <Lock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto opacity-70" />
                                    <div className="space-y-1">
                                      <h3 className="text-sm sm:text-base font-medium">Content Locked</h3>
                                      <p className="text-xs sm:text-sm text-gray-400 max-w-[250px] sm:max-w-sm mx-auto">
                                        Complete Day {currentDay.day - 1}'s video {course?.roadmap.find(d => d.day === currentDay.day - 1)?.mcqs?.length ? 'and quiz ' : ''}to unlock this content
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="absolute inset-0">
                    <MemoizedVideoPlayer 
                          videoUrl={currentDay.video} 
                      onVideoComplete={handleVideoCompleteCallback}
                          isEnabled={isVideoEnabled(currentDay.day)}
                        />
                                </div>
                              )}
                            </div>
                          </div>
                      </CardContent>
                    </Card>
                    </div>

                    {/* Progress Actions */}
                    <div className="max-w-[1920px] mx-auto mt-4 sm:mt-6 px-4 sm:px-6">
                      <Card className="border border-primary/10 bg-gradient-to-b from-background to-primary/5">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                            <div className="space-y-1">
                              <h3 className="text-base sm:text-lg font-semibold">Video Progress</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {watchedVideos.includes(selectedDay)
                                  ? "Click to mark video as incomplete"
                                  : "Mark video as complete when you're done watching"}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                                onClick={() => handleDaySelect(selectedDay - 1)}
                    variant="outline"
                                disabled={selectedDay === 1}
                                className="w-full sm:w-auto sm:min-w-[140px] h-10"
                  >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Previous Day
                  </Button>
                              {(!course?.roadmap.find(d => d.day === selectedDay)?.mcqs?.length) ? (
                  <Button
                                  onClick={() => {
                                    if (completedDays.includes(selectedDay)) {
                                      handleVideoMarkComplete();
                                    } else {
                                      handleCompleteAndContinue(selectedDay);
                                    }
                                  }}
                                  disabled={isMarkingVideo}
                                  size="lg"
                                  variant={completedDays.includes(selectedDay) ? "outline" : "default"}
                    className={cn(
                                    "w-full sm:w-auto sm:min-w-[200px] h-10",
                                    completedDays.includes(selectedDay) && "text-emerald-600 hover:text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                                  {isMarkingVideo ? (
                      <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Updating...</span>
                      </>
                                  ) : completedDays.includes(selectedDay) ? (
                          <>
                            <span>Completed</span>
                                      <CheckCircle className="h-4 w-4 ml-2" />
                          </>
                        ) : (
                          <>
                                      <span>Complete & Continue</span>
                                      <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={handleVideoMarkComplete}
                                  disabled={isMarkingVideo || !isVideoEnabled(selectedDay)}
                                  size="lg"
                                  variant={watchedVideos.includes(selectedDay) ? "outline" : "default"}
                                  className={cn(
                                    "w-full sm:w-auto sm:min-w-[200px] h-10",
                                    isMarkingVideo && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  {isMarkingVideo ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span>Updating...</span>
                                    </>
                                  ) : watchedVideos.includes(selectedDay) ? (
                                    <>
                                      <span>Video Completed</span>
                                      <CheckCircle className="h-4 w-4 ml-2" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Complete & Start Quiz</span>
                                      <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                </div>

                {/* Tabbed Content */}
                    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 mt-6">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full border-b justify-start rounded-none h-auto p-0 bg-transparent mb-6 overflow-x-auto flex-nowrap">
                    <TabsTrigger 
                      value="notes" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary px-4 py-2.5 text-sm font-medium whitespace-nowrap"
                    >
                      Notes
                    </TabsTrigger>
                    <TabsTrigger 
                            value="transcript" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary px-4 py-2.5 text-sm font-medium whitespace-nowrap"
                    >
                            Transcript
                    </TabsTrigger>
                  </TabsList>

                        <TabsContent value="notes" className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-0">
                          <NotesSection
                            day={currentDay.day}
                            value={unsavedNotes[currentDay.day] ?? (notes[currentDay.day]?.content || '')}
                            onChange={handleNotesChange}
                            onSave={() => saveNotes(currentDay.day)}
                            isSaving={isSavingNote}
                          />
                        </TabsContent>

                        <TabsContent value="transcript" className="mt-4 sm:mt-6 focus-visible:outline-none focus-visible:ring-0">
                          <Card className="border">
                            <CardContent className="p-4 sm:p-6">
                        {currentDay.transcript ? (
                                <div className="prose prose-sm sm:prose max-w-none">
                                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {currentDay.transcript}
                          </p>
                                </div>
                        ) : (
                                <div className="text-center py-6">
                          <p className="text-sm text-muted-foreground italic">
                            No transcript available for this video.
                          </p>
                                </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quiz View */}
            {showQuizView && currentDay && (
              <div className="max-w-[1920px] mx-auto p-4 sm:px-6 sm:py-6">
                <Card className="overflow-hidden border-2 rounded-lg sm:rounded-xl bg-gradient-to-b from-background to-primary/5">
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                            Quiz {quizNumbers[currentDay.day] || ''}
                          </h1>
                          <p className="text-sm sm:text-base text-muted-foreground">
                            Test your understanding of all the content you've learned so far.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (document.fullscreenElement) {
                                document.exitFullscreen();
                              } else {
                                document.documentElement.requestFullscreen();
                              }
                            }}
                            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent"
                          >
                            <Maximize2 className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowQuizView(false);
                              setActiveTab("notes");
                            }}
                            className="hidden sm:flex items-center gap-2"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Content
                          </Button>
                        </div>
                      </div>

                      {/* Quiz Instructions Alert */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="space-y-1">
                            <h3 className="font-medium text-blue-900">Important Instructions</h3>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc ml-4">
                              <li>You have a maximum of 2 attempts for this quiz</li>
                              <li>Each attempt will be recorded and scored separately</li>
                              {/* <li>A score of 70% or higher is required to pass</li>
                              <li>Take your time - there's no time limit</li> */}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Quiz Information Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-primary/5 to-primary/10">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <AlertCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-base mb-1">Quiz Information</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {currentDay.mcqs.length} multiple choice questions
                              </p>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-primary/5 to-primary/10">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-base mb-1">No Time Limit</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Take your time to answer carefully
                              </p>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-primary/5 to-primary/10">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-base mb-1">Instant Results</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Get your score immediately after completion
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>

                      {/* Quiz Content */}
                      {isLoadingSubmissions ? (
                        <div className="flex items-center justify-center p-8 sm:p-12">
                          <div className="space-y-4 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                            <p className="text-sm text-muted-foreground">Loading quiz results...</p>
                          </div>
                        </div>
                      ) : (
                        <>
                            {!showQuiz ? (
                              <>
                              {quizResults[currentDay.day] && quizResults[currentDay.day].length > 0 ? (
                                <Card className="p-4 sm:p-8 mt-6 sm:mt-8">
                                  <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-lg sm:text-xl font-semibold">Previous Attempts</h3>
                                      <Badge variant="secondary" className="px-2 sm:px-3 py-0.5 sm:py-1">
                                        {quizResults[currentDay.day].length} {quizResults[currentDay.day].length === 1 ? 'Attempt' : 'Attempts'}
                                      </Badge>
                                    </div>
                                    <QuizResultsDisplay attempts={quizResults[currentDay.day]} />
                                    <div className="border-t pt-6 mt-8">
                                      <div className="max-w-2xl mx-auto">
                                        <div className="text-center space-y-3 mb-6">
                                          <h3 className="text-lg sm:text-xl font-semibold">
                                            {quizResults[currentDay.day].length >= 2 
                                              ? "Maximum Attempts Reached"
                                              : quizResults[currentDay.day][0]?.score === 100
                                              ? "Perfect Score!"
                                              : "Ready for Another Attempt?"}
                                          </h3>
                                          <p className="text-muted-foreground">
                                            Your best score so far: {Math.max(...quizResults[currentDay.day].map(a => a.score))}%
                                          </p>
                                          {quizResults[currentDay.day][0]?.score === 100 && quizResults[currentDay.day].length === 1 && (
                                            <div className="mt-2 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                              <p className="text-sm text-emerald-800 flex items-center gap-2 justify-center">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>🎉 Excellent! You've achieved a perfect score on your first attempt. No need for another try!</span>
                                              </p>
                                            </div>
                                          )}
                                          {quizResults[currentDay.day].some(attempt => attempt.score >= 70) && quizResults[currentDay.day][0]?.score !== 100 && (
                                            <div className="mt-2 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                              <p className="text-sm text-emerald-800 flex items-center gap-2 justify-center">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>You've passed this quiz! Click "Complete & Continue" to mark this day as complete and move to the next day.</span>
                                              </p>
                                            </div>
                                          )}
                                          {quizResults[currentDay.day].length >= 2 && (
                                            <div className="mt-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                              <p className="text-sm text-yellow-800 flex items-center gap-2 justify-center">
                                                <AlertCircle className="h-4 w-4" />
                                                <span>You've completed your 2 attempts. Please continue with the course, the day will be marked as complete and you will be redirected to the next day.</span>
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button 
                              onClick={() => setShowQuiz(true)}
                                            size="lg"
                                            disabled={quizResults[currentDay.day].length >= 2 || quizResults[currentDay.day][0]?.score === 100}
                                            className={cn(
                                              "w-full sm:w-auto min-w-[200px] text-base sm:text-lg py-4 sm:py-6",
                                              (quizResults[currentDay.day].length >= 2 || quizResults[currentDay.day][0]?.score === 100)
                                                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                                : "bg-primary hover:bg-primary/90"
                                            )}
                            >
                                            <div className="flex items-center gap-2">
                                              {quizResults[currentDay.day].length >= 2 ? (
                                                <>
                                                  <Lock className="h-4 sm:h-5 w-4 sm:w-5" />
                                                  <span>No More Attempts</span>
                                                </>
                                              ) : quizResults[currentDay.day][0]?.score === 100 ? (
                                                <>
                                                  <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
                                                  <span>Perfect Score Achieved</span>
                                                </>
                                              ) : (
                                                <>
                                              <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5" />
                                              <span>Try Again</span>
                                                </>
                                              )}
                                            </div>
                            </Button>
                                          <Button
                                            onClick={() => handleCompleteAndContinue(currentDay.day)}
                                            size="lg"
                                            variant="outline"
                                            className="w-full sm:w-auto min-w-[200px] text-base sm:text-lg py-4 sm:py-6"
                                            disabled={!checkDayCompletion(currentDay.day)}
                                          >
                                            <div className="flex items-center gap-2">
                                              {checkDayCompletion(currentDay.day) ? (
                                                <>
                                                  <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
                                                  <span>Complete & Continue</span>
                                                </>
                            ) : (
                              <>
                                                  <Lock className="h-4 sm:h-5 w-4 sm:w-5" />
                                                  <span>Complete Day First</span>
                                                </>
                                              )}
                                            </div>
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              ) : (
                                <Card className="p-4 sm:p-8 mt-6 sm:mt-8 bg-gradient-to-br from-background to-primary/5">
                                  <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="text-center space-y-3">
                                      <h3 className="text-lg sm:text-xl font-semibold">Ready to Test Your Knowledge?</h3>
                                      <p className="text-muted-foreground">
                                        Complete this quiz to track your understanding. You have 2 attempts available.
                                      </p>
                              </div>
                                    <div className="flex justify-center">
                                <Button 
                                  onClick={() => setShowQuiz(true)}
                                        size="lg"
                                        className="w-full sm:w-auto min-w-[200px] text-base sm:text-lg py-4 sm:py-6 bg-primary hover:bg-primary/90"
                                >
                                        <div className="flex items-center gap-2">
                                          <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5" />
                                          <span>Start Quiz</span>
                                        </div>
                                </Button>
                                    </div>
                                  </div>
                                </Card>
                            )}
                              </>
                        ) : (
                            <div className="relative">
                              <MCQQuiz
                                questions={currentDay.mcqs}
                                onComplete={handleQuizComplete}
                                onCancel={() => setShowQuiz(false)}
                                dayNumber={currentDay.day}
                                courseUrl={course.courseUrl}
                                quizNumber={quizNumbers[currentDay.day] || currentDay.day} // Add quiz number prop
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  if (document.fullscreenElement) {
                                    document.exitFullscreen();
                                  } else {
                                    document.documentElement.requestFullscreen();
                                  }
                                }}
                                className="fixed bottom-4 right-4 sm:hidden w-10 h-10 rounded-full bg-background shadow-lg hover:bg-accent z-50"
                              >
                                {document.fullscreenElement ? (
                                  <Minimize2 className="h-5 w-5" />
                                ) : (
                                  <Maximize2 className="h-5 w-5" />
                        )}
                              </Button>
                    </div>
                  )}
                        </>
                      )}
                    </div>
                      </CardContent>
                    </Card>

                {/* Mobile Back Button */}
                <div className="fixed bottom-4 left-4 sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowQuizView(false);
                      setActiveTab("notes");
                    }}
                    className="h-10 px-4 bg-background shadow-lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Content
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseWeekView;
