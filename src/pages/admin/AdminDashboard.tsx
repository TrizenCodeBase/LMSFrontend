import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  Bell,
  AlertTriangle,
  UserCog,
  GraduationCap,
  TrendingUp,
  Clock,
  Award,
  BarChart2,
  Activity,
  Search,
  Sun,
  Moon
} from "lucide-react";
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { PageLoader } from '@/components/loaders';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import axios from '@/lib/axios';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface UserCourse {
  _id: string;
  userId: string;
  courseId: string;
  progress: number;
  status: string;
  completedDays: string[];
  enrolledAt: string;
  lastAccessedAt: string;
  updatedAt: string;
  courseUrl: string;
  daysCompletedPerDuration: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  instructor: string;
  instructorId: string;
  duration: string;
  rating: number;
  students: number;
  level: string;
  category: string;
  skills: string[];
}

interface StudentProgress {
  _id: string;
  userId: string;
  name: string;
  daysCompletedPerDuration: string;
  lastAccessedAt: string;
  progress: number;
  status: string;
}

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  students: StudentProgress[];
}

// Add helper function to extract duration
const extractDuration = (daysCompletedPerDuration: string): number => {
  const [_, total] = daysCompletedPerDuration.split('/').map(Number);
  return total;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Fetch courses from MongoDB courses collection
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        // Try the standard courses endpoint first
        const response = await axios.get<Course[]>('/api/courses');
        console.log('Fetched courses response:', response);
        
        if (response.data && Array.isArray(response.data)) {
          console.log('Successfully loaded courses:', response.data);
          setCourses(response.data);
          
          // Set the first course as selected by default if none selected
          if (response.data.length > 0 && !selectedCourse) {
            setSelectedCourse(response.data[0]._id);
          }
        } else {
          console.warn('Courses data is not in expected format:', response.data);
          setCourses([]);
        }
      } catch (error: any) {
        console.error('Error fetching courses:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // Fallback to admin courses endpoint if first attempt fails
        try {
          const adminResponse = await axios.get<Course[]>('/api/admin/courses');
          console.log('Fetched courses from admin endpoint:', adminResponse);
          
          if (adminResponse.data && Array.isArray(adminResponse.data)) {
            console.log('Successfully loaded courses from admin endpoint:', adminResponse.data);
            setCourses(adminResponse.data);
            
            if (adminResponse.data.length > 0 && !selectedCourse) {
              setSelectedCourse(adminResponse.data[0]._id);
            }
          } else {
            console.warn('Admin courses data is not in expected format:', adminResponse.data);
            setCourses([]);
          }
        } catch (adminError: any) {
          console.error('Error fetching courses from admin endpoint:', {
            message: adminError.message,
            status: adminError.response?.status,
            data: adminError.response?.data
          });
          setCourses([]);
        }
      }
      setIsLoadingCourses(false);
    };

    fetchCourses();
  }, []);

  // Debug log for courses state changes
  useEffect(() => {
    console.log('Current courses state:', courses);
  }, [courses]);

  // Fetch student progress when selected course changes
  useEffect(() => {
    const fetchStudentProgress = async () => {
      if (!selectedCourse) return;
      
      setIsLoadingProgress(true);
      try {
        // Fetch enrolled students and their progress from usercourses collection using the new endpoint
        const response = await axios.get<UserCourse[]>(`/api/usercourses/course/${selectedCourse}`);
        console.log('Fetched user courses:', response.data);

        const selectedCourseData = courses.find(c => c._id === selectedCourse);
        if (!selectedCourseData) {
          console.error('Selected course data not found');
          setCourseProgress([]);
          setIsLoadingProgress(false);
          return;
        }

        if (response.data && Array.isArray(response.data)) {
          // Fetch user details for each enrolled student
          const userDetailsPromises = response.data.map(async (userCourse) => {
            try {
              const userResponse = await axios.get<User>(`/api/users/${userCourse.userId}`);
              return userResponse.data;
            } catch (error) {
              // If user is not found, return null
              console.error(`Error fetching user details for userId ${userCourse.userId}:`, error);
              return null;
            }
          });

          const userDetails = await Promise.all(userDetailsPromises);
          console.log('Fetched user details:', userDetails);

          // Only include students whose userId exists in the users collection
          const filteredStudents = response.data
            .map((userCourse, index) => {
              const user = userDetails[index];
              if (!user) return null; // Skip if user not found
              return {
                _id: userCourse._id,
                userId: userCourse.userId,
                name: user.name,
                daysCompletedPerDuration: userCourse.daysCompletedPerDuration || '0/0',
                lastAccessedAt: userCourse.lastAccessedAt || new Date().toISOString(),
                progress: userCourse.progress || 0,
                status: userCourse.status || 'enrolled'
              };
            })
            .filter(Boolean); // Remove nulls

          const progress: CourseProgress = {
            courseId: selectedCourseData._id,
            courseTitle: selectedCourseData.title,
            students: filteredStudents
          };

          console.log('Processed course progress:', progress);
          setCourseProgress([progress]);
        } else {
          console.warn('No student data received or invalid format');
          setCourseProgress([]);
        }
      } catch (error: any) {
        console.error('Error fetching student progress:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        setCourseProgress([]);
      }
      setIsLoadingProgress(false);
    };

    if (selectedCourse) {
      fetchStudentProgress();
    }
  }, [selectedCourse, courses]);

  // Debug logs for progress state changes
  useEffect(() => {
    console.log('Current course progress state:', courseProgress);
  }, [courseProgress]);

  const currentProgress = courseProgress[0];
  const currentStudents = currentProgress?.students || [];

  // Sort students based on progress
  const sortedStudents = [...currentStudents].sort((a, b) => {
    const aProgress = Number(a.daysCompletedPerDuration.split('/')[0]) / Number(a.daysCompletedPerDuration.split('/')[1]) * 100;
    const bProgress = Number(b.daysCompletedPerDuration.split('/')[0]) / Number(b.daysCompletedPerDuration.split('/')[1]) * 100;
    return sortOrder === 'desc' ? bProgress - aProgress : aProgress - bProgress;
  });

  // Calculate metrics for current course
  const calculateMetrics = () => {
    const currentStudents = courseProgress[0]?.students || [];
    if (!currentStudents.length) return { activeStudentsPercentage: 0, averageCompletion: 0 };

    // Calculate active students (accessed in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeStudents = currentStudents.filter(student => 
      new Date(student.lastAccessedAt) > sevenDaysAgo
    ).length;
    const activeStudentsPercentage = Math.round((activeStudents / currentStudents.length) * 100);

    // Calculate average completion from daysCompletedPerDuration
    const completionRates = currentStudents.map(student => {
      const [completed, total] = student.daysCompletedPerDuration.split('/').map(Number);
      return total > 0 ? (completed / total) * 100 : 0;
    });
    const averageCompletion = completionRates.length 
      ? Math.round(completionRates.reduce((acc, curr) => acc + curr, 0) / completionRates.length)
      : 0;

    return { activeStudentsPercentage, averageCompletion };
  };

  const { activeStudentsPercentage, averageCompletion } = calculateMetrics();

  // Add a function to fully refresh all dashboard data
  const handleFullRefresh = async () => {
    setIsLoadingCourses(true);
    setIsLoadingProgress(true);
    setCourses([]);
    setCourseProgress([]);
    await refetch(); // Refetch main dashboard stats
    // Refetch courses and progress
    try {
      const response = await axios.get<Course[]>('/api/courses');
      if (response.data && Array.isArray(response.data)) {
        setCourses(response.data);
        if (response.data.length > 0) {
          setSelectedCourse(response.data[0]._id);
        }
      }
    } catch (error) {
      setCourses([]);
    }
    setIsLoadingCourses(false);
    setIsLoadingProgress(false);
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PageLoader message="Loading dashboard data..." />
        </motion.div>
      </AdminLayout>
    );
  }
  
  if (error || !data) {
    return (
      <AdminLayout>
        <motion.div 
          className="flex flex-col items-center justify-center h-[600px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium text-red-500">Failed to load dashboard data</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </motion.div>
      </AdminLayout>
    );
  }

  const statCards = [
    { 
      title: "Total Students", 
      value: data.userStats.totalStudents, 
      icon: Users, 
      color: "from-blue-50 to-blue-100",
      textColor: "text-blue-600",
      change: "+12% from last month",
      metric: "Active learners"
    },
    { 
      title: "Total Courses", 
      value: data.courseStats.totalCourses, 
      icon: BookOpen, 
      color: "from-green-50 to-green-100",
      textColor: "text-green-600",
      change: "+5 new this month",
      metric: "Published courses"
    },
    { 
      title: "Total Instructors", 
      value: data.userStats.totalInstructors, 
      icon: GraduationCap, 
      color: "from-purple-50 to-purple-100",
      textColor: "text-purple-600",
      change: "+3 new instructors",
      metric: "Active teachers"
    },
  ];

  return (
    <AdminLayout>
      <motion.div 
        className="space-y-8 px-6 py-8 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero Banner with Infinity Symbol */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[#34226C]/5 mix-blend-multiply" />
          <svg
            className="absolute right-0 top-0 opacity-[0.03] text-[#34226C] transform translate-x-1/3 -translate-y-1/4"
            width="800"
            height="800"
            viewBox="0 0 100 100"
          >
            <path
              d="M50 30 C60 30 70 0 80 20 C90 40 60 50 50 50 C40 50 10 40 20 20 C30 0 40 30 50 30"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Header Section with Gradient */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#34226C] to-[#5f3dc4] p-8 shadow-lg">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10"
          >
            <h2 className="text-2xl font-medium tracking-tight text-white mb-2">Dashboard Overview</h2>
            <p className="text-purple-100/80">Welcome back, Admin! Here's what's happening.</p>
          </motion.div>
          <div className="absolute inset-0 bg-[url('/infinity-pattern.svg')] opacity-10" />
        </div>

        {/* Stats Grid with Enhanced Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
          <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
          >
              <Card className="overflow-hidden border-l-4 border-l-[#34226C] bg-white hover:bg-purple-50/50 transition-all duration-300 hover:shadow-lg shadow-md group">
                <CardContent className="p-6">
                  <motion.div 
                    className="flex items-center justify-between mb-4"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className="p-2.5 rounded-xl bg-gradient-to-br from-[#5f3dc4] to-[#34226C]"
                      animate={{ 
                        boxShadow: ["0 0 0 0 rgba(52, 34, 108, 0.2)", "0 0 0 10px rgba(52, 34, 108, 0)"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
            >
                      <card.icon className="h-4 w-4 text-white" />
                    </motion.div>
                    <motion.span 
                      className="text-xs font-medium text-[#5f3dc4]"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {card.change}
                    </motion.span>
          </motion.div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <motion.div 
                      className="flex items-baseline gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <motion.h3 
                        className="text-2xl font-semibold text-[#34226C]"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {card.value.toLocaleString()}
                      </motion.h3>
                    </motion.div>
                    <p className="text-xs text-gray-500">{card.metric}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions with Enhanced Styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {data.enrollmentStats.pendingEnrollments > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-l-4 border-l-yellow-400 bg-white hover:bg-yellow-50/50 transition-all duration-300 hover:shadow-lg shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="p-2.5 rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={{ 
                            boxShadow: ["0 0 0 0 rgba(234, 179, 8, 0.2)", "0 0 0 10px rgba(234, 179, 8, 0)"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Bell className="h-4 w-4" />
                        </motion.div>
                        <div>
                          <h3 className="text-base font-medium">Pending Enrollments</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {data.enrollmentStats.pendingEnrollments} requests need review
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => navigate('/admin/enrollment-requests')}
                        variant="outline" 
                        className="h-9 px-3 text-xs border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-900/20 hover:shadow-md transition-all duration-300"
                      >
                        Review
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <Progress 
                          value={75} 
                          className="h-1.5 bg-yellow-100 [--progress-foreground:theme(colors.yellow.500)]" 
                        />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {data.instructorStats.pendingApplications > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-l-4 border-l-primary bg-white hover:bg-purple-50/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="p-2.5 rounded-xl bg-primary/10 text-primary"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <UserCog className="h-4 w-4" />
                        </motion.div>
                        <div>
                          <h3 className="text-base font-medium">Instructor Applications</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {data.instructorStats.pendingApplications} applications pending
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => navigate('/admin/instructor-approvals')}
                        variant="outline" 
                        className="h-9 px-3 text-xs"
                      >
                        Review
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <Progress value={60} className="h-1.5" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Course Engagement Section */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <motion.div className="lg:col-span-2">
            <Card className="border-l-4 border-l-[#34226C] bg-white hover:shadow-lg shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                  >
                        <BarChart2 className="h-4 w-4 text-[#34226C]" />
                  </motion.div>
                      Course Engagement
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <motion.span 
                        className="text-xs"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {courses.length} Courses
                      </motion.span>
                      <span className="text-xs">•</span>
                      <motion.span
                        className="text-xs"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        {currentStudents.length} Students
                      </motion.span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                  <Select
                    value={selectedCourse}
                    onValueChange={(value) => {
                      setSelectedCourse(value);
                      setCourseProgress([]);
                    }}
                    disabled={isLoadingCourses}
                  >
                      <SelectTrigger className="h-9 w-[200px] text-xs border-border">
                      <SelectValue>
                        {isLoadingCourses 
                            ? "Loading..." 
                            : (courses.find(c => c._id === selectedCourse)?.title || "Select course")}
                      </SelectValue>
                    </SelectTrigger>
                      <SelectContent>
                      {courses.length === 0 ? (
                        <SelectItem value="no-courses" disabled>
                          No courses available
                        </SelectItem>
                      ) : (
                        courses.map((course) => (
                          <SelectItem 
                            key={course._id} 
                            value={course._id}
                              className="py-2.5"
                          >
                              <div className="text-sm font-medium">{course.title}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {course.instructor}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="h-9 px-3 text-xs gap-2 border-[#34226C] text-[#34226C] hover:bg-purple-50 transition-all duration-300"
                    >
                      <motion.div
                        animate={{ rotate: sortOrder === 'desc' ? 0 : 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </motion.div>
                      {sortOrder === 'desc' ? 'Highest Progress' : 'Lowest Progress'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Course Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      className="space-y-2 p-4 rounded-xl bg-[#e6e0f7] transition-all duration-300 hover:shadow-lg shadow-md"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-xs font-medium">Active Students</span>
                        <motion.span 
                          className="text-xs font-medium text-primary"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {activeStudentsPercentage}%
                        </motion.span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <Progress 
                          value={activeStudentsPercentage} 
                          className="h-1.5 bg-purple-100" 
                          style={{
                            '--progress-background': 'linear-gradient(90deg, #5f3dc4, #34226C)'
                          } as React.CSSProperties}
                        />
                      </motion.div>
                    </motion.div>
                    <motion.div 
                      className="space-y-2 p-4 rounded-xl bg-[#e6e0f7] transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-xs font-medium">Completion Rate</span>
                        <span className="text-xs font-medium text-primary">{averageCompletion}%</span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <Progress 
                          value={averageCompletion} 
                          className="h-1.5"
                        />
                      </motion.div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3" />
                        Course average
                      </p>
                    </motion.div>
                  </div>

                  {/* Student Progress Cards - Now using sortedStudents */}
                  <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence>
                      {sortedStudents.map((student, index) => {
                              const [completed, total] = student.daysCompletedPerDuration.split('/').map(Number);
                              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                              const lastAccessed = new Date(student.lastAccessedAt).toLocaleDateString();
                              const isComplete = percentage === 100;
                              
                              return (
                                <motion.div
                                  key={student._id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                                >
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white border-l-4 border-l-[#34226C] hover:bg-[#e6e0f7]/20 transition-all group shadow-md hover:shadow-lg">
                                    <motion.div 
                                className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#5f3dc4] to-[#34226C] flex items-center justify-center text-white font-medium text-sm"
                                whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-[#34226C]">{student.name}</span>
                                        {isComplete && (
                                          <motion.span 
                                      className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#e6e0f7] text-[#34226C] font-medium"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                          >
                                      Complete
                                          </motion.span>
                                        )}
                                      </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                      >
                                        <Progress 
                                          value={percentage} 
                                        className="h-1.5 bg-purple-100 [--progress-foreground:theme(colors.purple.600)]"
                                        />
                                      </motion.div>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="font-medium text-[#34226C]">{percentage}%</span>
                                    <span>•</span>
                                    <span>{completed}/{total} days</span>
                                  </div>
                                </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-l-4 border-l-[#34226C] bg-white hover:shadow-lg shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Activity className="h-4 w-4 text-primary" />
                    </motion.div>
                        Recent Activity
                    </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowActivityPanel(!showActivityPanel)}
                    className="h-8 w-8 hover:bg-accent"
                  >
                    <motion.div
                      animate={{ rotate: showActivityPanel ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </motion.div>
                  </Button>
                </div>
                <CardDescription className="mt-1">Latest actions and events</CardDescription>
              </CardHeader>
              <AnimatePresence>
                {showActivityPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="pt-0">
                      <ScrollArea className="h-[600px] -mx-2 px-2">
                        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-0 before:h-full before:w-px before:bg-[#e6e0f7]">
                          <AnimatePresence>
                            {data.recentActivities.map((activity, index) => (
                              <motion.div
                                key={activity.id || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ x: 2 }}
                              >
                                <div className="relative flex items-start gap-4 py-2">
                                  <motion.div 
                                    className="absolute left-[-1.65rem] p-1.5 rounded-full bg-accent"
                                    animate={{ 
                                      scale: [1, 1.2, 1],
                                      boxShadow: [
                                        "0 0 0 0 rgba(var(--primary), 0.2)",
                                        "0 0 0 4px rgba(var(--primary), 0)",
                                        "0 0 0 0 rgba(var(--primary), 0.2)"
                                      ]
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  >
                                    <div className="h-1 w-1 rounded-full bg-primary" />
                                  </motion.div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{activity.action}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-muted-foreground">{activity.user}</span>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <motion.span 
                                        className="text-xs text-muted-foreground"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                      >
                                    {activity.time}
                                      </motion.span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;

