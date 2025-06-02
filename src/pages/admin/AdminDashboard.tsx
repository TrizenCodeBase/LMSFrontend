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
        className="space-y-6 px-6 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
            <p className="text-muted-foreground mt-1">Welcome back, Admin! Here's what's happening.</p>
          </motion.div>
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-full"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleFullRefresh}
              className="flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/5 transition-all duration-300"
            >
              <Clock className="h-4 w-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </Button>
            <Button 
              onClick={handleFullRefresh}
              className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 transition-all duration-300"
            >
              <Activity className="h-4 w-4" />
              Refresh Data
            </Button>
          </motion.div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {data.enrollmentStats.pendingEnrollments > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-0 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="p-2 rounded-full bg-yellow-100 text-yellow-600"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Bell className="h-5 w-5" />
                        </motion.div>
                        <h3 className="font-semibold text-lg">Pending Enrollments</h3>
                      </div>
                      <Button 
                        onClick={() => navigate('/admin/enrollment-requests')}
                        variant="outline" 
                        className="border-yellow-200 text-yellow-700 hover:bg-yellow-100/50 transition-all duration-300"
                      >
                        Review Requests
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Pending Requests</span>
                        <motion.span 
                          className="font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          {data.enrollmentStats.pendingEnrollments}
                        </motion.span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <Progress value={75} className="h-2 bg-yellow-100" />
                      </motion.div>
                      <p className="text-sm text-yellow-700">
                        {data.enrollmentStats.pendingEnrollments} requests need your attention
                      </p>
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
                <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="p-2 rounded-full bg-blue-100 text-blue-600"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <UserCog className="h-5 w-5" />
                        </motion.div>
                        <h3 className="font-semibold text-lg">Instructor Applications</h3>
                      </div>
                      <Button 
                        onClick={() => navigate('/admin/instructor-approvals')}
                        variant="outline" 
                        className="border-blue-200 text-blue-700 hover:bg-blue-100/50 transition-all duration-300"
                      >
                        Review Applications
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Pending Applications</span>
                        <motion.span 
                          className="font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          {data.instructorStats.pendingApplications}
                        </motion.span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <Progress value={60} className="h-2 bg-blue-100" />
                      </motion.div>
                      <p className="text-sm text-blue-700">
                        {data.instructorStats.pendingApplications} applications awaiting review
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-0 bg-white/80 hover:bg-white/90 transition-all duration-300">
                <CardContent className="p-6">
                  <motion.div 
                    className="flex items-center justify-between mb-4"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`p-2 rounded-lg ${card.color}`}>
                      <card.icon className={`h-5 w-5 ${card.textColor}`} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </motion.div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <motion.div 
                      className="flex items-baseline gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <h3 className="text-2xl font-semibold text-primary">{card.value.toLocaleString()}</h3>
                      <span className="text-xs text-green-500">{card.change}</span>
                    </motion.div>
                    <p className="text-xs text-muted-foreground">{card.metric}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Platform Metrics */}
        <div className="grid gap-4 grid-cols-1 max-w-6xl mx-auto">
          {/* Course Engagement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <Card className="border-0 bg-white/90 transition-all duration-300 dark:bg-gray-950/90">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 group">
                      <BarChart2 className="h-4 w-4 text-primary" />
                      <motion.span
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-primary"
                      >
                        Course Engagement
                      </motion.span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {courses.length} Courses Available
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {currentStudents.length} Active Students
                      </span>
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedCourse}
                    onValueChange={(value) => {
                      setSelectedCourse(value);
                      setCourseProgress([]);
                    }}
                    disabled={isLoadingCourses}
                  >
                    <SelectTrigger className="w-full md:w-[280px] border-input focus:ring-1 focus:ring-ring">
                      <SelectValue>
                        {isLoadingCourses 
                          ? "Loading courses..." 
                          : (courses.find(c => c._id === selectedCourse)?.title || "Select a course")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {courses.length === 0 ? (
                        <SelectItem value="no-courses" disabled>
                          No courses available
                        </SelectItem>
                      ) : (
                        courses.map((course) => (
                          <SelectItem 
                            key={course._id} 
                            value={course._id}
                            className="flex flex-col items-start py-2 hover:bg-accent cursor-pointer"
                          >
                            <div className="font-medium text-base">{course.title}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {course.instructor}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {course.duration}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Course Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      className="space-y-2 p-4 rounded-lg bg-accent/50 transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between text-sm">
                        <span>Active Students</span>
                        <span className="font-medium text-primary">{activeStudentsPercentage}%</span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <Progress 
                          value={activeStudentsPercentage} 
                          className="h-2 transition-all duration-300" 
                          style={{
                            background: `linear-gradient(90deg, var(--primary) ${activeStudentsPercentage}%, var(--muted) ${activeStudentsPercentage}%)`
                          }}
                        />
                      </motion.div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Last 7 days
                      </p>
                    </motion.div>
                    <motion.div 
                      className="space-y-2 p-4 rounded-lg bg-accent/50 transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span className="font-medium text-primary">{averageCompletion}%</span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <Progress 
                          value={averageCompletion} 
                          className="h-2 transition-all duration-300"
                          style={{
                            background: `linear-gradient(90deg, var(--primary) ${averageCompletion}%, var(--muted) ${averageCompletion}%)`
                          }}
                        />
                      </motion.div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3" />
                        Course average
                      </p>
                    </motion.div>
                  </div>

                  {/* Student Progress List */}
                  <AnimatePresence>
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold tracking-wide text-primary">
                          Student Progress ({currentStudents.length} students)
                        </h4>
                        {(isLoadingCourses || isLoadingProgress) && (
                          <span className="text-xs text-muted-foreground">Loading...</span>
                        )}
                      </div>
                      
                      <ScrollArea className="h-[400px] w-full rounded-lg border border-border bg-accent/50">
                        <div className="grid grid-cols-1 gap-3 p-4">
                          <AnimatePresence>
                            {currentStudents.map((student, index) => {
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
                                  whileHover={{ scale: 1.01, x: 4 }}
                                >
                                  <div 
                                    className={`flex items-center gap-4 p-4 rounded-lg bg-background border border-border hover:bg-accent/50 transition-all group relative ${
                                      isComplete ? 'ring-1 ring-primary/20' : ''
                                    }`}
                                  >
                                    <motion.div 
                                      className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg"
                                      whileHover={{ scale: 1.05, rotate: 5 }}
                                      whileTap={{ scale: 0.95 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium">{student.name}</span>
                                        {isComplete && (
                                          <motion.span 
                                            className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-medium dark:bg-emerald-900/50 dark:text-emerald-300"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.05 }}
                                          >
                                            Completed
                                          </motion.span>
                                        )}
                                        {!isComplete && (
                                          <motion.span 
                                            className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.05 }}
                                          >
                                            {student.status}
                                          </motion.span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                                        <span>Last accessed: {lastAccessed}</span>
                                        <span className="mx-1">•</span>
                                        <span>Progress: <span className="font-medium text-primary">{percentage}%</span></span>
                                        <span className="mx-1">•</span>
                                        <span className="font-medium">{completed} / {total} days</span>
                                      </div>
                                      <motion.div 
                                        className="flex items-center gap-2"
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                      >
                                        <Progress 
                                          value={percentage} 
                                          className="h-2 flex-1 transition-all duration-300"
                                          style={{
                                            background: `linear-gradient(90deg, var(--primary) ${percentage}%, var(--muted) ${percentage}%)`
                                          }}
                                        />
                                      </motion.div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </ScrollArea>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
          >
            <Card className="border-0 bg-white/90 transition-all duration-300 dark:bg-gray-950/90">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 group">
                      <Activity className="h-4 w-4 text-primary" />
                      <motion.span
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-primary"
                      >
                        Recent Activity
                      </motion.span>
                    </CardTitle>
                    <CardDescription>Latest actions and events</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowActivityPanel(!showActivityPanel)}
                    className="w-8 h-8 hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 transition-colors duration-300 dark:hover:from-violet-950/40 dark:hover:to-indigo-950/40"
                  >
                    <motion.div
                      animate={{ rotate: showActivityPanel ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </motion.div>
                  </Button>
                </div>
              </CardHeader>
              <AnimatePresence>
                {showActivityPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <ScrollArea className="h-[300px] w-full pr-2">
                        <div className="space-y-4">
                          <AnimatePresence>
                            {data.recentActivities.map((activity, index) => (
                              <motion.div
                                key={activity.id || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ x: 4, scale: 1.01 }}
                              >
                                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-indigo-50/50 transition-all duration-300 dark:hover:from-violet-950/20 dark:hover:to-indigo-950/20">
                                  <motion.div 
                                    className="p-2 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900 dark:to-indigo-900"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                  </motion.div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-indigo-900 dark:text-indigo-100">{activity.action}</p>
                                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {activity.time}
                                  </span>
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

