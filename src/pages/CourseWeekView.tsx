import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../lib/axios';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, CheckCircle, AlertCircle, Menu, Lock, Unlock, Clock, ArrowRight, Loader2, Save } from "lucide-react";
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
      <div ref={playerRef}>
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
      </div>
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

const QuizResultsDisplay = ({ results }: { results: QuizResults }) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-secondary";
    if (score >= 50) return "text-primary";
    return "text-destructive";
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Quiz Results - Day {results.dayNumber}</h3>
            <Badge className={cn(
              "text-white",
              results.score >= 70 ? "bg-secondary" : 
              results.score >= 50 ? "bg-primary" : 
              "bg-destructive"
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
  const [quizCompleted, setQuizCompleted] = useState<number[]>([]);
  const [notes, setNotes] = useState<Record<number, { _id: string; content: string }>>({});
  const { token, isAuthenticated, loading, user } = useAuth();
  const { toast } = useToast();
  const updateProgressMutation = useUpdateProgress();
  const navigate = useNavigate();
  const [quizResults, setQuizResults] = useState<Record<number, QuizResults>>({});
  const location = useLocation();
  const [isMarking, setIsMarking] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [unsavedNotes, setUnsavedNotes] = useState<Record<number, string>>({});

  // Remove unused refs and state
  const [contentSections, setContentSections] = useState<ContentSections>({
    transcript: false,
    topics: false,
    mcqs: false
  });

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

  useEffect(() => {
    if (course && course.roadmap) {
      if (course.roadmap.length > 0 && selectedDay === 0) {
        setSelectedDay(course.roadmap[0].day);
      }
      
      // Update completed days only when course data changes
      if (typeof course.progress === 'number' && course.roadmap) {
        // If the course has completedDays property, use it
        if (course.completedDays) {
          setCompletedDays(course.completedDays);
        } else {
          // Otherwise calculate from progress
        const completedCount = Math.round((course.progress * course.roadmap.length) / 100);
        const newCompletedDays = Array.from({ length: completedCount }, (_, i) => i + 1);
        setCompletedDays(newCompletedDays);
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

  const handleDayComplete = async (day: number) => {
    try {
      setIsMarking(true);
    
      // Calculate new completed days
      let newCompletedDays: number[];
      if (completedDays.includes(day)) {
        // If unchecking a day, remove it and all days after it
        newCompletedDays = completedDays.filter(d => d < day);
      } else {
        // If checking a day, only add that specific day
        // First check if there are any gaps
        const previousDay = day - 1;
        if (day > 1 && !completedDays.includes(previousDay)) {
          toast({
            description: (
              <CustomToast 
                title="Invalid Action"
                description="You must complete the previous day first."
                type="error"
              />
            ),
            duration: 3000,
            className: "p-0 bg-transparent border-0"
          });
          setIsMarking(false);
          return;
        }
        newCompletedDays = [...completedDays, day];
      }
      
      // Use course._id for the API call
      if (!course?._id) {
        throw new Error('Course ID not found');
      }
      
      // Calculate progress percentage
      const progressPercentage = Math.round((newCompletedDays.length / (course?.roadmap.length || 1)) * 100);
      
      let status = 'enrolled';
      if (progressPercentage > 0 && progressPercentage < 100) {
        status = 'started';
      } else if (progressPercentage === 100) {
        status = 'completed';
      }
      
      // Make the API call
      const result = await updateProgressMutation.mutateAsync({
        courseId: course._id,
        progress: progressPercentage,
        status: status as 'enrolled' | 'started' | 'completed',
        token,
        completedDays: newCompletedDays
      });
      
      // Only update the state if the API call was successful
      if (result) {
        const wasCompleted = completedDays.includes(day);
        setCompletedDays(newCompletedDays);
        
        // Reset watched videos state for the uncompleted day and subsequent days
        if (wasCompleted) {
          setWatchedVideos(prev => prev.filter(v => v <= day));
        } else {
          // If marking as complete, navigate to next day if available
          const nextDay = course?.roadmap.find(d => d.day === day + 1);
          if (nextDay) {
            setSelectedDay(nextDay.day);
          }
        }
        
        // Show appropriate toast message
          toast({
            description: (
              <CustomToast 
              title="Progress Updated"
              description={wasCompleted 
                ? "Day marked as incomplete. Subsequent days are now locked."
                : "Day marked as complete. Moving to next day."}
              type={wasCompleted ? "info" : "success"}
              />
            ),
          duration: 3000,
            className: "p-0 bg-transparent border-0"
          });
        } else {
        throw new Error('Failed to update progress');
      }

    } catch (error: any) {
      // Revert to original state on error
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

  const handleVideoComplete = (day: number) => {
    console.log(`Video ${day} completed`);
    setWatchedVideos(prev => [...prev, day]);
  };

  const handleQuizComplete = async (score: number) => {
    if (!course?._id || !token) return;

    const currentDay = selectedDay;
    const dayData = course?.roadmap.find(day => day.day === currentDay);
    
    try {
      // Submit to database
      const response = await axios.post('/api/quiz-submissions', {
        courseId: course._id,
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

    // Only update state without URL changes
    setSelectedDay(day);
    setIsSidebarOpen(false);
    setShowQuiz(false);
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
      const content = unsavedNotes[day] || notes[day]?.content || '';
      
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

  const SidebarContent = () => {
    const totalDurationDays = course?.duration ? extractDurationDays(course.duration) : 0;
    const currentRoadmapDays = course?.roadmap?.length || 0;
    const remainingDays = Math.max(0, totalDurationDays - currentRoadmapDays);

    return (
      <>
        
        <div className="p-4 space-y-2">
          {course?.roadmap.map((day) => (
            <button
              key={day.day}
              id={`sidebar-day-${day.day}`}
              onClick={() => handleDaySelect(day.day)}
              className={cn(
                "flex flex-col w-full p-3 rounded-lg text-sm gap-1 transition-colors text-left",
                selectedDay === day.day
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : isDayLocked(day.day)
                  ? "bg-gray-100 hover:bg-gray-200 cursor-not-allowed"
                  : "hover:bg-muted",
                completedDays.includes(day.day) && selectedDay !== day.day && "text-primary"
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
                    : "text-primary"
                )}>
                  Quiz: {day.mcqs.length} questions
                </div>
              )}
            </button>
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
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-80 border-r bg-muted/40">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Course Content</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-10rem)] md:h-[calc(100vh-10rem)]">
            <SidebarContent />
          </ScrollArea>
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Course Content</h2>
            </div>
            <ScrollArea className="flex-1">
              <SidebarContent />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Add course name in main content header */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
            {currentDay && (
              <div className="max-w-4xl mx-auto space-y-6 pt-12 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center mb-4">
                  <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold mb-2">Day {currentDay.day}</h1>
                  <p className="text-sm md:text-base text-muted-foreground">{currentDay.topics}</p>
                  </div>
                </div>

                {/* Video Card */}
                    <Card>
                      <CardContent className="p-4 md:p-6">
                    <MemoizedVideoPlayer 
                          videoUrl={currentDay.video} 
                      onVideoComplete={handleVideoCompleteCallback}
                          isEnabled={isVideoEnabled(currentDay.day)}
                        />
                      </CardContent>
                    </Card>

                {/* Navigation and Mark Complete Buttons */}
                <div className="flex items-center justify-end gap-4 my-6">
                  <Button
                    onClick={() => handleDaySelect(currentDay.day - 1)}
                    variant="outline"
                    disabled={currentDay.day === 1}
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Previous
                  </Button>

                  <Button
                    onClick={() => handleDayComplete(currentDay.day)}
                    disabled={isMarking}
                    className={cn(
                      "flex items-center gap-2",
                      isMarking && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isMarking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        {completedDays.includes(currentDay.day) ? (
                          <>
                            <span>Completed</span>
                            <CheckCircle className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            <span>Complete and Continue</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>

                {/* Tabbed Content */}
                <Tabs defaultValue="notes" className="w-full">
                  <TabsList className="w-full border-b justify-start rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger 
                      value="transcript" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                    >
                      Transcript
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notes" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                    >
                      Notes
                    </TabsTrigger>
                    <TabsTrigger 
                      value="quiz" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      disabled={!isMCQsEnabled(currentDay.day)}
                    >
                      Quiz
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="transcript" className="mt-4">
                    <Card>
                      <CardContent className="p-4 md:p-6">
                        {currentDay.transcript ? (
                          <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap">
                            {currentDay.transcript}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No transcript available for this video.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-4">
                    <NotesSection
                      day={currentDay.day}
                      value={unsavedNotes[currentDay.day] ?? notes[currentDay.day]?.content ?? ''}
                      onChange={handleNotesChange}
                      onSave={() => saveNotes(currentDay.day)}
                      isSaving={isSavingNote}
                    />
                  </TabsContent>

                  <TabsContent value="quiz" className="mt-4">
                    <Card>
                      <CardContent className="p-4 md:p-6">
                      {currentDay.mcqs && currentDay.mcqs.length > 0 ? (
                          <div className="space-y-4">
                            {!showQuiz ? (
                              <>
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
                                    <div className="flex items-center justify-center gap-2 text-secondary">
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
                              </>
                        ) : (
                              <MCQQuiz
                                questions={currentDay.mcqs}
                                onComplete={handleQuizComplete}
                                onCancel={() => setShowQuiz(false)}
                                dayNumber={currentDay.day}
                              />
                        )}
                    </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No quiz questions available for this lesson.
                          </p>
                  )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseWeekView;
