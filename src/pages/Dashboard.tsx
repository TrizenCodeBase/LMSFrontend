import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEnrolledCourses, useQuizzesAttemptedCount, useQuizSubmissionsDebug, useUserQuizStats } from "@/services/courseService";
import { useInstructorMessages, useSendMessage } from "@/services/chatService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Clock, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Trophy, 
  ArrowRight, 
  Users,
  Target,
  Star,
  BookMarked,
  Award,
  TrendingUp,
  Zap,
  Crown,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";

// Achievement data
const achievements = [
  {
    id: 1,
    title: "Fast Learner",
    description: "Completed 5 lessons in one day",
    progress: 80,
    icon: Zap
  },
  {
    id: 2,
    title: "Consistent Scholar",
    description: "Logged in 5 days in a row",
    progress: 100,
    icon: Crown
  },
  {
    id: 3,
    title: "Quiz Master",
    description: "Scored 100% in 3 quizzes",
    progress: 60,
    icon: Award
  }
];

interface User {
  id: string;
  token: string;
  // ... other user properties ...
}

interface QuizSubmission {
  courseUrl: string;
  title: string;
  score: number;
  submittedDate: string;
  dayNumber: number;
}

interface QuizStats {
  totalSubmissions: number;
  uniqueQuizzes: number;
  coursesWithSubmissions: number;
  averageScore: number;
  submissions: QuizSubmission[];
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'quiz' | 'lesson' | 'deadline';
  courseTitle?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [quizCount, setQuizCount] = useState(0);
  const { data: enrolledCourses, isLoading, isError } = useEnrolledCourses(token);
  const { data: quizzesTaken = 0, isLoading: isLoadingQuizzes } = useQuizzesAttemptedCount(token);
  const { data: quizDebug } = useQuizSubmissionsDebug(token);
  const { data: messages = [], isLoading: isLoadingMessages } = useInstructorMessages(user?.id || '');
  const [selectedDate] = useState<Date>(new Date());
  const { data: quizStats, isLoading: isLoadingQuizStats } = useUserQuizStats(
    // @ts-ignore - we know the token exists on the user object
    user?.token || null
  );
  const [showSchedule, setShowSchedule] = useState(false);
  
  // Mock upcoming events - replace this with actual data fetching
  const upcomingEvents: Event[] = [
    // This will be empty for now to show the "No events" state
  ];

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const pulseAnimation = {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Add the exact same MongoDB query logic as countSubmissions.js
  useEffect(() => {
    const fetchQuizSubmissions = async () => {
      try {
        const targetUserId = user?.id;
        if (!targetUserId) return;

        const response = await fetch('/api/quiz-submissions/exact-count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        console.log('Matching documents found:', data.count);
        setQuizCount(data.count);
      } catch (error) {
        console.error('Error fetching quiz submissions:', error);
      }
    };

    if (user?.id && token) {
      fetchQuizSubmissions();
    }
  }, [user?.id, token]);

  // Log quiz statistics similar to countSubmissions.js
  useEffect(() => {
    if (quizStats) {
      console.log('\n=== QUIZ SUBMISSIONS COUNT ===');
      console.log('User ID:', user?.id);
      console.log('Total documents found:', quizStats.totalSubmissions);
      console.log('\nMatching documents found:', quizStats.totalSubmissions);
      
      if (quizStats.submissions && quizStats.submissions.length > 0) {
        console.log('\nMatching submissions:');
        quizStats.submissions.forEach((sub, i) => {
          console.log(`\n${i + 1}. ${sub.courseUrl} - Day ${sub.dayNumber}`);
          console.log(`   Score: ${sub.score}%`);
          console.log(`   Date: ${sub.submittedDate}`);
        });
      }
    }
  }, [quizStats, user?.id]);

  // Calculate total lessons completed across all enrolled courses
  const totalLessonsCompleted = useMemo(() => {
    if (!enrolledCourses?.length) return 0;

    return enrolledCourses.reduce((total, course) => {
      if (course.daysCompletedPerDuration) {
        const [completed] = course.daysCompletedPerDuration.split('/').map(Number);
        return total + (completed || 0);
      }
      return total;
    }, 0);
  }, [enrolledCourses]);

  // Log total lessons completed
  console.log('Total lessons completed across all courses:', totalLessonsCompleted);

  // Calculate overall progress from enrolled courses
  const overallProgress = useMemo(() => {
    if (!enrolledCourses?.length) return 0;

    const totalProgress = enrolledCourses.reduce((sum, course) => {
      // If we have daysCompletedPerDuration, calculate progress from that
      if (course.daysCompletedPerDuration) {
        const [completed, total] = course.daysCompletedPerDuration.split('/').map(Number);
        return sum + ((completed / total) * 100);
      }
      // If we have direct progress value, use that
      if (typeof course.progress === 'number') {
        return sum + course.progress;
      }
      return sum;
    }, 0);

    // Calculate average progress
    const averageProgress = Math.round(totalProgress / enrolledCourses.length);
    return averageProgress;
  }, [enrolledCourses]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#4B3F72]/20 via-white to-white min-h-screen">
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4B3F72] to-[#635985] text-white p-8 
                   shadow-[0_20px_50px_rgba(75,63,114,0.2)] border border-white/20 backdrop-blur-sm"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">Welcome back, {user?.name || "testuser"}! 👋</h1>
              <p className="text-[#E0DFF5] opacity-90 text-lg">Track your progress and stay updated with your courses</p>
            </motion.div>
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(75, 63, 114, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 bg-white/95 hover:bg-white text-[#4B3F72] px-8 py-3 rounded-xl font-medium 
                       shadow-lg transition-all duration-300 flex items-center space-x-3 group
                       border border-white/40 backdrop-blur-sm"
              onClick={() => navigate('/explore-courses')}
            >
              <span>Explore New Courses</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
          <motion.div 
            className="absolute right-0 top-0 w-1/3 h-full opacity-10"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="w-full h-full bg-[url('/patterns/circuit.svg')] bg-repeat transform rotate-12 scale-150" />
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Lessons Viewed */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white shadow-[0_10px_30px_-15px_rgba(75,63,114,0.3)] 
                         hover:shadow-[0_20px_40px_-15px_rgba(75,63,114,0.4)] transition-all duration-500 
                         border border-[#4B3F72]/5 group hover:-translate-y-2
                         hover:bg-gradient-to-br hover:from-white hover:to-[#4B3F72]/5">
              <CardContent className="p-8">
              <div className="flex flex-col">
                  <div className="flex items-center space-x-3 mb-4">
                    <motion.div 
                      animate={pulseAnimation}
                      className="p-3 bg-gradient-to-br from-[#4B3F72]/10 to-[#4B3F72]/5 rounded-xl 
                              transition-all duration-500 group-hover:scale-110 group-hover:rotate-6
                              group-hover:bg-gradient-to-br group-hover:from-[#4B3F72]/20 group-hover:to-[#4B3F72]/10
                              border border-[#4B3F72]/10 shadow-inner"
                    >
                      <BookOpen className="w-6 h-6 text-[#4B3F72]" />
                    </motion.div>
                    <span className="text-sm font-medium text-gray-500">Lessons Viewed</span>
                  </div>
                  <div className="mt-2">
                  {isLoading ? (
                      <Skeleton className="h-12 w-24" />
                  ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-baseline space-x-2"
                      >
                        <span className="text-4xl font-bold bg-gradient-to-r from-[#4B3F72] to-[#635985] bg-clip-text text-transparent
                                     drop-shadow-sm">
                      {totalLessonsCompleted}
                        </span>
                        <span className="text-lg text-gray-500">lessons</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quiz Performance */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white shadow-[0_10px_30px_-15px_rgba(75,63,114,0.3)] 
                         hover:shadow-[0_20px_40px_-15px_rgba(75,63,114,0.4)] transition-all duration-500 
                         border border-[#4B3F72]/5 group hover:-translate-y-2
                         hover:bg-gradient-to-br hover:from-white hover:to-[#4B3F72]/5">
              <CardContent className="p-8">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-3 mb-4">
                    <motion.div 
                      animate={pulseAnimation}
                      className="p-3 bg-gradient-to-br from-[#4B3F72]/10 to-[#4B3F72]/5 rounded-xl 
                              transition-all duration-500 group-hover:scale-110 group-hover:rotate-6
                              group-hover:bg-gradient-to-br group-hover:from-[#4B3F72]/20 group-hover:to-[#4B3F72]/10
                              border border-[#4B3F72]/10 shadow-inner"
                    >
                      <CheckCircle2 className="w-6 h-6 text-[#4B3F72]" />
                    </motion.div>
                    <span className="text-sm font-medium text-gray-500">Quiz Performance</span>
                  </div>
                  <div className="mt-2">
                    {isLoadingQuizzes ? (
                      <Skeleton className="h-12 w-24" />
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-baseline space-x-2">
                          <span className="text-4xl font-bold bg-gradient-to-r from-[#4B3F72] to-[#635985] bg-clip-text text-transparent
                                       drop-shadow-sm">
                            {quizStats?.totalSubmissions || 0}
                          </span>
                          <span className="text-lg text-gray-500">submissions</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-[#4B3F72]/5 border border-[#4B3F72]/10 shadow-inner">
                            <div className="text-sm font-medium text-gray-600">Unique Quizzes</div>
                            <div className="text-xl font-bold text-[#4B3F72]">{quizStats?.uniqueQuizzes || 0}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-[#4B3F72]/5 border border-[#4B3F72]/10 shadow-inner">
                            <div className="text-sm font-medium text-gray-600">Avg Score</div>
                            <div className="text-xl font-bold text-[#4B3F72]">{quizStats?.averageScore || 0}%</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Overall Progress */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white shadow-[0_10px_30px_-15px_rgba(75,63,114,0.3)] 
                         hover:shadow-[0_20px_40px_-15px_rgba(75,63,114,0.4)] transition-all duration-500 
                         border border-[#4B3F72]/5 group hover:-translate-y-2
                         hover:bg-gradient-to-br hover:from-white hover:to-[#4B3F72]/5">
              <CardContent className="p-8">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-3 mb-4">
                    <motion.div 
                      animate={pulseAnimation}
                      className="p-3 bg-gradient-to-br from-[#4B3F72]/10 to-[#4B3F72]/5 rounded-xl 
                              transition-all duration-500 group-hover:scale-110 group-hover:rotate-6
                              group-hover:bg-gradient-to-br group-hover:from-[#4B3F72]/20 group-hover:to-[#4B3F72]/10
                              border border-[#4B3F72]/10 shadow-inner"
                    >
                      <TrendingUp className="w-6 h-6 text-[#4B3F72]" />
                    </motion.div>
                    <span className="text-sm font-medium text-gray-500">Overall Progress</span>
                  </div>
                  <div className="mt-2">
                    {isLoading ? (
                      <Skeleton className="h-12 w-24" />
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-baseline space-x-2">
                          <span className="text-4xl font-bold bg-gradient-to-r from-[#4B3F72] to-[#635985] bg-clip-text text-transparent
                                       drop-shadow-sm">
                            {overallProgress}%
                          </span>
                        </div>
                        <div className="w-full h-4 bg-[#E0DFF5] rounded-full overflow-hidden border border-[#4B3F72]/10">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${overallProgress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#4B3F72] to-[#635985] relative shadow-inner"
                          >
                            <motion.div 
                              animate={{ 
                                x: ["0%", "100%", "0%"],
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            />
                          </motion.div>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center justify-between">
                          <span>{enrolledCourses?.length || 0} courses enrolled</span>
                          <span className="text-[#4B3F72] font-medium">{overallProgress}% completed</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-white shadow-[0_10px_30px_-15px_rgba(75,63,114,0.3)] 
                         hover:shadow-[0_20px_40px_-15px_rgba(75,63,114,0.4)] transition-all duration-300">
              <CardHeader className="border-b border-[#4B3F72]/10 px-6 py-4 bg-gradient-to-r from-[#4B3F72]/5 to-transparent">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#4B3F72] to-[#635985] bg-clip-text text-transparent
                                  drop-shadow-sm">
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group"
                    >
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-white to-white/95"
                      >
                        <motion.div 
                          animate={pulseAnimation}
                          className="p-3 bg-gradient-to-br from-[#4B3F72]/10 to-[#4B3F72]/5 rounded-xl 
                                  group-hover:scale-110 group-hover:rotate-6 transition-all duration-500
                                  border border-[#4B3F72]/10 shadow-inner"
                        >
                          <achievement.icon className="w-6 h-6 text-[#4B3F72]" />
                        </motion.div>
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900">{achievement.title}</h4>
                          <p className="text-sm text-gray-500">{achievement.description}</p>
                          <div className="mt-3 h-2 w-full bg-[#E0DFF5] rounded-full overflow-hidden border border-[#4B3F72]/10">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${achievement.progress}%` }}
                              transition={{ duration: 1.5, delay: 0.2 + index * 0.1 }}
                              className="h-full bg-gradient-to-r from-[#4B3F72] to-[#635985] relative shadow-inner"
                            >
                              <motion.div 
                                animate={{ 
                                  x: ["0%", "100%", "0%"],
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              />
                            </motion.div>
                  </div>
                  </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Quiz Attempts */}
          {!isLoadingQuizStats && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Card className="bg-white shadow-[0_10px_30px_-15px_rgba(75,63,114,0.3)] 
                           hover:shadow-[0_20px_40px_-15px_rgba(75,63,114,0.4)] transition-all duration-300">
                <CardHeader className="border-b border-[#4B3F72]/10 px-6 py-4 bg-gradient-to-r from-[#4B3F72]/5 to-transparent">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#4B3F72] to-[#635985] bg-clip-text text-transparent
                                    drop-shadow-sm">
                    Recent Quiz Attempts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {quizStats?.submissions && quizStats.submissions.length > 0 ? (
                    <div className="space-y-4">
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-[#4B3F72]/5 to-transparent sticky top-0 backdrop-blur-sm
                                     border-b border-[#4B3F72]/10">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#4B3F72]/5">
                          <AnimatePresence>
                            {quizStats.submissions.map((submission, index) => (
                              <motion.tr 
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="hover:bg-[#4B3F72]/5 transition-colors duration-200"
                              >
                                <td className="px-6 py-4">
                                  <div className="font-medium text-gray-900">{submission.title}</div>
                                  <div className="text-sm text-gray-500">{submission.courseUrl}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm",
                                    submission.score >= 70 ? "bg-green-100 text-green-800 border border-green-200" : 
                                    submission.score >= 50 ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : 
                                    "bg-red-100 text-red-800 border border-red-200"
                                  )}>
                                    {submission.score}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {new Date(submission.submittedDate).toLocaleDateString()}
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Quiz Attempted</h3>
                      <p className="text-sm text-gray-500">Start taking quizzes to track your progress!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
          </div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {[
            {
              title: "Continue Learning",
              description: "Resume from where you left off",
              icon: BookMarked,
              onClick: () => navigate('/my-courses')
            },
            {
              title: "Ask a Question",
              description: "Get help from instructors",
              icon: MessageSquare,
              onClick: () => navigate('/contact-instructors')
            },
            {
              title: "View Schedule",
              description: "Check upcoming events",
              icon: Calendar,
              onClick: () => setShowSchedule(true)
            }
          ].map((action, index) => (
            <motion.div 
              key={action.title}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="bg-white shadow-[0_10px_30px_-15px_rgba(75,63,114,0.3)] 
                        hover:shadow-[0_20px_40px_-15px_rgba(75,63,114,0.4)] transition-all duration-500 
                        border-2 border-transparent hover:border-[#4B3F72]/10 cursor-pointer
                        hover:bg-gradient-to-br hover:from-white hover:to-[#4B3F72]/5"
                onClick={action.onClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <motion.div 
                      animate={pulseAnimation}
                      className="p-3 bg-gradient-to-br from-[#4B3F72]/10 to-[#4B3F72]/5 rounded-xl 
                              transition-all duration-500 group-hover:scale-110
                              border border-[#4B3F72]/10 shadow-inner"
                    >
                      <action.icon className="w-6 h-6 text-[#4B3F72]" />
                    </motion.div>
                      <div>
                      <h3 className="font-semibold text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
              </div>
            </CardContent>
          </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Schedule Dialog */}
        <AnimatePresence>
          {showSchedule && (
            <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
              <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm
                                    shadow-[0_20px_50px_rgba(75,63,114,0.3)] border border-[#4B3F72]/10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#4B3F72] to-[#635985] bg-clip-text text-transparent
                                      drop-shadow-sm">
                    Upcoming Events
                  </DialogTitle>
                </DialogHeader>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center space-x-4 p-4 rounded-xl bg-white/80 
                                   hover:bg-[#4B3F72]/5 transition-all duration-300 group
                                   border border-[#4B3F72]/5 shadow-sm hover:shadow-md"
                        >
                          <motion.div 
                            animate={pulseAnimation}
                            className={cn(
                              "p-3 rounded-xl transition-all duration-300 group-hover:scale-110 border shadow-inner",
                              event.type === 'quiz' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              event.type === 'deadline' ? 'bg-red-100 text-red-700 border-red-200' :
                              'bg-green-100 text-green-700 border-green-200'
                            )}
                          >
                            {event.type === 'quiz' ? <CheckCircle2 className="w-6 h-6" /> :
                             event.type === 'deadline' ? <Clock className="w-6 h-6" /> :
                             <BookOpen className="w-6 h-6" />}
                          </motion.div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            {event.courseTitle && (
                              <p className="text-sm text-gray-500">{event.courseTitle}</p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString()}
                            </p>
        </div>
                        </motion.div>
                      ))}
              </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center py-8"
                    >
                      <motion.div 
                        animate={pulseAnimation}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#4B3F72]/5 flex items-center justify-center
                                border border-[#4B3F72]/10 shadow-inner"
                      >
                        <Calendar className="w-10 h-10 text-[#4B3F72]" />
                      </motion.div>
                      <h3 className="text-xl font-medium text-gray-900">No Upcoming Events</h3>
                      <p className="text-base text-gray-500 mt-2">You're all caught up! Check back later for new events.</p>
                    </motion.div>
        )}
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
