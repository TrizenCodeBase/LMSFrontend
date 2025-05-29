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
  Search
} from "lucide-react";
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { PageLoader } from '@/components/loaders';
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
  
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  
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
        <PageLoader message="Loading dashboard data..." />
      </AdminLayout>
    );
  }
  
  if (error || !data) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[600px]">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium text-red-500">Failed to load dashboard data</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { 
      title: "Total Students", 
      value: data.userStats.totalStudents, 
      icon: Users, 
      color: "bg-blue-100 text-blue-600",
      change: "+12% from last month",
      metric: "Active learners"
    },
    { 
      title: "Total Courses", 
      value: data.courseStats.totalCourses, 
      icon: BookOpen, 
      color: "bg-green-100 text-green-600",
      change: "+5 new this month",
      metric: "Published courses"
    },
    { 
      title: "Total Instructors", 
      value: data.userStats.totalInstructors, 
      icon: GraduationCap, 
      color: "bg-purple-100 text-purple-600",
      change: "+3 new instructors",
      metric: "Active teachers"
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
          <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
            <p className="text-muted-foreground">Welcome back, Admin! Here's what's happening.</p>
          </div>
          <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
              onClick={handleFullRefresh}
              className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10 hover:text-primary font-semibold shadow-sm transition-all"
            >
              <Clock className="h-4 w-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </Button>
            <Button 
              onClick={handleFullRefresh}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold shadow-md hover:from-blue-700 hover:to-indigo-600 transition-all"
            >
              <Activity className="h-4 w-4" />
            Refresh Data
          </Button>
          </div>
        </div>
        
        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending Enrollments Card */}
          {data.enrollmentStats.pendingEnrollments > 0 && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <Bell className="h-5 w-5" />
                </div>
                    <h3 className="font-semibold text-lg">Pending Enrollments</h3>
              </div>
              <Button 
                onClick={() => navigate('/admin/enrollment-requests')}
                variant="outline" 
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Review Requests
              </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending Requests</span>
                    <span className="font-medium">{data.enrollmentStats.pendingEnrollments}</span>
                  </div>
                  <Progress value={75} className="h-2 bg-yellow-100" />
                  <p className="text-sm text-yellow-700">
                    {data.enrollmentStats.pendingEnrollments} requests need your attention
                  </p>
                </div>
            </CardContent>
          </Card>
        )}
          
          {/* Pending Instructor Applications Card */}
          {data.instructorStats.pendingApplications > 0 && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <UserCog className="h-5 w-5" />
                  </div>
                    <h3 className="font-semibold text-lg">Instructor Applications</h3>
                </div>
                <Button 
                  onClick={() => navigate('/admin/instructor-approvals')}
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Review Applications
                </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending Applications</span>
                    <span className="font-medium">{data.instructorStats.pendingApplications}</span>
                  </div>
                  <Progress value={60} className="h-2 bg-blue-100" />
                  <p className="text-sm text-blue-700">
                    {data.instructorStats.pendingApplications} applications awaiting review
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card, index) => (
            <Card key={index} className="overflow-hidden shadow-md border-0 bg-gradient-to-br from-white via-blue-50 to-blue-100 hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-full ${card.color} shadow-md`}>
                  <card.icon className="h-6 w-6" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-primary drop-shadow-sm">{card.value.toLocaleString()}</h3>
                    <span className="text-xs text-green-500">{card.change}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{card.metric}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Course Engagement */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white via-indigo-50 to-blue-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-primary drop-shadow-sm">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Course Engagement
                  </CardTitle>
                  <CardDescription>
                    {courses.length} Courses Available
                  </CardDescription>
                </div>
                <Select
                  value={selectedCourse}
                  onValueChange={(value) => {
                    setSelectedCourse(value);
                    setCourseProgress([]); // Clear previous progress
                  }}
                  disabled={isLoadingCourses}
                >
                  <SelectTrigger className="w-[280px] border-primary focus:ring-2 focus:ring-primary/50">
                    <SelectValue>
                      {isLoadingCourses 
                        ? "Loading courses..." 
                        : (courses.find(c => c._id === selectedCourse)?.title || "Select a course")}
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
                          className="flex flex-col items-start py-2"
                        >
                          <div className="font-medium">{course.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {course.instructor} • {course.duration}
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
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50 shadow-sm">
                    <div className="flex justify-between text-sm">
                      <span>Active Students</span>
                      <span className="font-medium">{activeStudentsPercentage}%</span>
                    </div>
                    <Progress value={activeStudentsPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50 shadow-sm">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate</span>
                      <span className="font-medium">{averageCompletion}%</span>
                    </div>
                    <Progress value={averageCompletion} className="h-2" />
                    <p className="text-xs text-muted-foreground">Course average</p>
                  </div>
                </div>

                {/* Student Progress List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold tracking-wide text-primary">
                      Student Progress ({currentStudents.length} students)
                    </h4>
                    {(isLoadingCourses || isLoadingProgress) && (
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    )}
                  </div>
                  {isLoadingCourses ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Loading courses...</p>
                    </div>
                  ) : isLoadingProgress ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Loading student progress...</p>
                    </div>
                  ) : !selectedCourse ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Please select a course</p>
                    </div>
                  ) : currentStudents.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">No students enrolled in this course</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[320px] w-full rounded-md border bg-muted/30">
                      <div className="grid grid-cols-1 gap-3 p-4">
                        {currentStudents.map((student) => {
                          const [completed, total] = student.daysCompletedPerDuration.split('/').map(Number);
                          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                          const lastAccessed = new Date(student.lastAccessedAt).toLocaleDateString();
                          const isComplete = percentage === 100;
                          return (
                            <div key={student._id} 
                                 className={`flex items-center gap-6 p-5 rounded-xl shadow-sm bg-white border border-muted/40 hover:shadow-md transition-all group relative ${isComplete ? 'ring-2 ring-green-200' : ''}`}
                                 title={isComplete ? 'Completed' : 'In Progress'}>
                              {/* Avatar Circle */}
                              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                                {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-base" title={student.name}>{student.name}</span>
                                  {isComplete && (
                                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-semibold">Completed</span>
                                  )}
                                  {!isComplete && (
                                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">{student.status}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                  <span>Last accessed: {lastAccessed}</span>
                                  <span className="mx-1">•</span>
                                  <span>Progress: <span className="font-semibold text-primary">{percentage}%</span></span>
                                  <span className="mx-1">•</span>
                                  <span className="font-medium">{completed} / {total} days</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress value={percentage} className="h-2.5 flex-1 bg-muted/40" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
        <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest actions and events</CardDescription>
                </div>
              </div>
          </CardHeader>
          <CardContent>
              <ScrollArea className="h-[340px] w-full pr-2">
                <div className="space-y-4">
                  {data.recentActivities.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No recent activity found.</div>
                  ) : (
                    data.recentActivities.map((activity, index) => (
                      <div key={activity.id || index} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.user}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.time}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

