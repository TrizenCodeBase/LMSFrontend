import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/contexts/AuthContext';
import { 
  useQuizzesAttemptedCount, 
  useUserQuizStats, 
  useCoursesByIds,
  useEnrolledCourses,
  Course,
  QuizSubmission 
} from '@/services/courseService';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, Clock, Lock, ChevronRight, Search, Filter,
  BookOpen, Award, Star, AlertCircle, GraduationCap,
  PlayCircle, XCircle
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface QuizStats {
  totalSubmissions: number;
  uniqueQuizzes: number;
  coursesWithSubmissions: number;
  averageScore: number;
  submissions: QuizSubmission[];
}

interface AttemptedCount {
  completed: number;
  inProgress: number;
  total: number;
}

interface AvailableQuiz {
  courseId: string;
  courseTitle: string;
  courseUrl: string;
  dayNumber: number;
  title: string;
  isAttempted: boolean;
  lastScore?: number;
  lastAttemptDate?: string;
  attempts: number;
}

interface RoadmapDay {
  day: number;
  topics: string[];
  mcqs?: any[];
  description?: string;
}

interface EnrolledCourse extends Course {
  roadmap?: RoadmapDay[];
  courseUrl: string;
  title: string;
  _id: string;
}

// Encouraging quotes for the header
const QUOTES = [
  {
    text: "Learning is a journey — every quiz takes you one step closer to mastery.",
    author: "Trizen Ventures"
  },
  {
    text: "The more you practice, the more you understand. Keep going!",
    author: "Trizen Ventures"
  }
];

// Add MAX_ATTEMPTS constant
const MAX_ATTEMPTS = 2;

const Assignments = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { data: enrolledCourses = [], isLoading: isLoadingCourses } = useEnrolledCourses(token);
  const { data: quizStats, isLoading: isLoadingQuizStats } = useUserQuizStats(token);
  const { 
    data: attemptedCount, 
    isLoading: countLoading 
  } = useQuizzesAttemptedCount(token) as { 
    data: AttemptedCount | undefined; 
    isLoading: boolean 
  };

  // Extract unique courseIds from submissions
  const courseIds = useMemo(() => {
    if (!quizStats?.submissions) return [];
    const ids = quizStats.submissions
      .map(sub => sub.courseId)
      .filter(Boolean); // Filter out any undefined, null, or empty strings
    return Array.from(new Set(ids));
  }, [quizStats?.submissions]);

  // Fetch course details
  const { data: courses, isLoading: coursesLoading } = useCoursesByIds(courseIds);

  // Create a map of courseId to course details
  const courseMap = useMemo(() => {
    if (!courses) return new Map<string, Course>();
    return new Map(courses.map(course => [course._id, course]));
  }, [courses]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentQuote, setCurrentQuote] = useState(QUOTES[0]);
  const [availableQuizzes, setAvailableQuizzes] = useState<AvailableQuiz[]>([]);

  // Group submissions by quiz title and course
  const groupedSubmissions = React.useMemo(() => {
    if (!quizStats?.submissions) return [];

    // First, group all submissions by quiz
    const grouped = quizStats.submissions.reduce((acc, submission) => {
      const key = `${submission.courseUrl}-${submission.title}-${submission.dayNumber}`;
      
      if (!acc[key]) {
        // Initialize with first submission
        acc[key] = {
          courseUrl: submission.courseUrl,
          courseName: submission.courseName || 'Untitled Course',
          title: submission.title,
          dayNumber: submission.dayNumber,
          attempts: 1, // Start with 1 attempt
          submissions: [submission], // Store all submissions
          currentScore: submission.score,
          maxScore: submission.score,
          lastAttemptDate: submission.submittedDate,
          status: submission.score >= 80 ? 'completed' : submission.score > 0 ? 'inProgress' : 'locked'
        };
      } else {
        // Add submission to existing group
        acc[key].submissions.push(submission);
        acc[key].attempts = acc[key].submissions.length; // Count total submissions as attempts
        acc[key].currentScore = submission.score; // Latest score
        acc[key].maxScore = Math.max(acc[key].maxScore, submission.score); // Keep track of best score
        
        // Update last attempt date if this submission is more recent
        if (new Date(submission.submittedDate) > new Date(acc[key].lastAttemptDate)) {
          acc[key].lastAttemptDate = submission.submittedDate;
        }
        
        // Update status based on max score
        if (acc[key].maxScore >= 80) {
          acc[key].status = 'completed';
        } else if (acc[key].maxScore > 0) {
          acc[key].status = 'inProgress';
        }
      }
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by last attempt date (most recent first)
    return Object.values(grouped).sort((a, b) => 
      new Date(b.lastAttemptDate).getTime() - new Date(a.lastAttemptDate).getTime()
    );
  }, [quizStats?.submissions]);

  // Filter submissions
  const filteredSubmissions = React.useMemo(() => {
    return groupedSubmissions.filter(submission => {
      const matchesSearch = submission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (submission.courseName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [groupedSubmissions, searchQuery, statusFilter]);

  // Rotate quotes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(prev => {
        const currentIndex = QUOTES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % QUOTES.length;
        return QUOTES[nextIndex];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Calculate overall progress
  const totalProgress = quizStats ? 
    Math.round((quizStats.totalSubmissions / (quizStats.uniqueQuizzes || 1)) * 100) : 0;

  const getStatusBadge = (submission: any) => {
    if (submission.maxScore >= 80) {
      return (
        <Badge className="bg-emerald-500 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (submission.maxScore > 0) {
      return (
        <Badge className="bg-amber-500 text-white">
          <Clock className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-200 text-gray-700">
        <Lock className="w-3 h-3 mr-1" />
        Locked
      </Badge>
    );
  };

  const handleViewDetails = (submission: any) => {
    if (!submission.courseUrl) {
      console.error('Course URL not found');
      return;
    }

    // Navigate to the quiz page using query parameter for day
    navigate(`/course/${submission.courseUrl}/weeks?day=${submission.dayNumber}`);

    // Trigger confetti if the quiz is completed
    if (submission.maxScore >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleCourseClick = (submission: any) => {
    if (!submission.courseUrl) {
      console.error('Course URL not found');
      return;
    }

    navigate(`/course/${submission.courseUrl}/weeks?day=${submission.dayNumber}`);
  };

  // Fetch available quizzes and their submission status
  useEffect(() => {
    const fetchAvailableQuizzes = async () => {
      if (!token || !enrolledCourses) return;

      try {
        // Get all quizzes from enrolled courses
        const quizzes: AvailableQuiz[] = [];
        
        enrolledCourses.forEach(course => {
          if (course.roadmap) {
            course.roadmap.forEach(day => {
              if (day.mcqs && day.mcqs.length > 0) {
                quizzes.push({
                  courseId: course._id,
                  courseTitle: course.title,
                  courseUrl: course.courseUrl,
                  dayNumber: day.day,
                  title: `Day ${day.day} Quiz`,
                  isAttempted: false,
                  attempts: 0
                });
              }
            });
          }
        });

        // Check submission status for each quiz
        if (quizStats?.submissions) {
          quizzes.forEach(quiz => {
            const submission = quizStats.submissions.find(
              sub => sub.courseUrl === quiz.courseUrl && sub.dayNumber === quiz.dayNumber
            );
            if (submission) {
              quiz.isAttempted = true;
              quiz.lastScore = submission.score;
              quiz.lastAttemptDate = submission.submittedDate;
              quiz.attempts = submission.attempts;
            }
          });
        }

        setAvailableQuizzes(quizzes);
      } catch (error) {
        console.error('Error fetching available quizzes:', error);
      }
    };

    fetchAvailableQuizzes();
  }, [token, enrolledCourses, quizStats]);

  if (isLoadingQuizStats || countLoading || coursesLoading) {
  return (
      <DashboardLayout>
        <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[300px] rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Hero Section with Enhanced Styling */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3F3FFF] via-[#6B4DFF] to-[#8466ff] p-8 md:p-10 shadow-xl"
          >
            {/* Enhanced Background Pattern */}
            <div className="absolute inset-0">
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute left-0 bottom-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10" />
            </div>

            {/* Content with Enhanced Layout */}
            <div className="relative z-10 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-sm">
                  Your Learning Journey
                </h1>
                <motion.div
                  key={currentQuote.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed">
                    {currentQuote.text}
                  </p>
                  <p className="text-sm text-white/70 font-medium">
                    — {currentQuote.author}
                  </p>
                </motion.div>
              </motion.div>

              {/* Enhanced Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Total Quizzes</p>
                      <p className="text-lg font-semibold text-white">
                        {availableQuizzes.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Completed</p>
                      <p className="text-lg font-semibold text-white">
                        {attemptedCount?.completed || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Average Score</p>
                      <p className="text-lg font-semibold text-white">
                        {quizStats?.averageScore?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Decorative Icon */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none hidden lg:block transform rotate-12">
              <GraduationCap className="w-72 h-72 text-white" />
            </div>
          </motion.div>

          {/* Enhanced Search and Filter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quizzes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#FAFAFA] border-gray-100 focus:border-[#3F3FFF] focus:ring-[#3F3FFF]/10 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] border-gray-100 bg-[#FAFAFA]">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <SelectValue placeholder="Filter by status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quizzes</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="inProgress">In Progress</SelectItem>
                    <SelectItem value="locked">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Available Quizzes Section with Enhanced Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-7xl mx-auto p-6"
          >
            <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#3F3FFF]/10">
                  <BookOpen className="w-6 h-6 text-[#3F3FFF]" />
                </div>
                Available Quizzes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableQuizzes.map((quiz) => (
                  <motion.div
                    key={`${quiz.courseUrl}-${quiz.dayNumber}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#3F3FFF]/20 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="space-y-4">
                      {/* Course Name with Enhanced Style */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#3F3FFF]/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-[#3F3FFF]" />
                        </div>
                        <span className="text-sm font-medium text-[#3F3FFF] line-clamp-1">
                          {quiz.courseTitle}
                        </span>
                      </div>

                      {/* Quiz Title and Status with Enhanced Style */}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {quiz.title}
                        </h3>
                        {quiz.isAttempted ? (
                          <Badge className="bg-green-500/10 text-green-600 border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Attempted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-[#3F3FFF] text-[#3F3FFF] bg-[#3F3FFF]/5">
                            <PlayCircle className="w-3.5 h-3.5 mr-1" />
                            Not Started
                          </Badge>
                        )}
                      </div>

                      {/* Score and Date with Enhanced Style */}
                      {quiz.isAttempted && quiz.lastScore !== undefined && (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Last Score</span>
                            <span className="font-medium text-[#3F3FFF]">{quiz.lastScore}%</span>
                          </div>
                          <Progress 
                            value={quiz.lastScore} 
                            className="h-2 bg-[#3F3FFF]/10"
                          />
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Last attempt: {new Date(quiz.lastAttemptDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" />
                              {quiz.attempts ? `${MAX_ATTEMPTS - quiz.attempts} attempts remaining` : `${MAX_ATTEMPTS - 1} attempts remaining`}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Button with Enhanced Style */}
                      <Button
                        variant={quiz.isAttempted ? "outline" : "default"}
                        className={cn(
                          "w-full group",
                          quiz.isAttempted 
                            ? "text-[#3F3FFF] hover:bg-[#3F3FFF]/5 border-[#3F3FFF]/20" 
                            : "bg-gradient-to-r from-[#3F3FFF] to-[#6B4DFF] hover:opacity-90 text-white"
                        )}
                        onClick={() => navigate(`/course/${quiz.courseUrl}/weeks?day=${quiz.dayNumber}`)}
                        disabled={quiz.attempts >= MAX_ATTEMPTS}
                      >
                        {quiz.attempts >= MAX_ATTEMPTS ? (
                          <>
                            Maximum Attempts Reached
                            <Lock className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          <>
                            {quiz.isAttempted ? "Review Quiz" : "Start Quiz"}
                            <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </Button>
                      
                      {quiz.attempts >= MAX_ATTEMPTS && (
                        <div className="text-xs text-gray-500 text-center mt-2">
                          You have reached the maximum number of attempts for this quiz
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Enhanced No Quizzes Message */}
          {availableQuizzes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 px-4 rounded-xl bg-white border border-gray-100 shadow-sm"
            >
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#3F3FFF]/5 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-[#3F3FFF]" />
                </div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">No Quizzes Found</h2>
                <p className="text-gray-600 mb-8">
                  {searchQuery 
                    ? "Try adjusting your search or filters"
                    : "You don't have any quizzes yet. Start a course to see quizzes here."}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="text-[#3F3FFF] hover:bg-[#3F3FFF]/5 border-[#3F3FFF]/20"
                >
                  {searchQuery ? "Clear Filters" : "Explore Courses"}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default Assignments;
