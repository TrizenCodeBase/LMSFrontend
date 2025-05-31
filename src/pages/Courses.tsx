import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/CourseCard";
import { useEnrolledCourses, useUpdateProgress } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, Clock, Award, ArrowRight, Loader2, Search, Filter, 
  GraduationCap, Sparkles, Target, ChevronRight, AlertCircle
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Motivational quotes array
const MOTIVATIONAL_QUOTES = [
  {
    text: "Learning is a journey. Every step you take brings progress.",
    author: "Trizen Ventures"
  },
  {
    text: "The best way to predict your future is to create it.",
    author: "Trizen Ventures"
  },
  {
    text: "Every expert was once a beginner. Keep going!",
    author: "Trizen Ventures"
  }
];

const Courses = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { toast } = useToast();
  const { data: enrolledCourses, isLoading, isError } = useEnrolledCourses(token);
  const updateProgressMutation = useUpdateProgress();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentQuote, setCurrentQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  
  const handleCourseClick = (courseId: string) => {
    // Only navigate to course if not in pending status
    const course = enrolledCourses?.find(c => c._id === courseId);
    if (course && (course.status === 'pending' || course.enrollmentStatus === 'pending')) {
      toast({
        title: "Enrollment Pending",
        description: "Your enrollment is pending approval. You'll be notified when it's approved.",
      });
      return;
    }
    
    // Use courseUrl if available, otherwise use courseId
    const courseIdentifier = course?.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}/weeks`);
  };
  
  const handleExploreCoursesClick = () => {
    navigate('/explore-courses');
  };
  
  const handleStartClick = async (courseId: string) => {
    if (!token) return;
    
    try {
      await updateProgressMutation.mutateAsync({ 
        courseId, 
        progress: 1, 
        status: 'started',
        token 
      });
      
      const course = enrolledCourses?.find(c => c._id === courseId);
      const courseIdentifier = course?.courseUrl || courseId;
      navigate(`/course/${courseIdentifier}/weeks`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start the course. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleResumeClick = (courseId: string) => {
    const course = enrolledCourses?.find(c => c._id === courseId);
    const courseIdentifier = course?.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}/weeks`);
  };
  
  // Group courses by status
  const pendingCourses = enrolledCourses?.filter(course => 
    course.status === 'pending' || course.enrollmentStatus === 'pending'
  ) || [];
  
  const activeCourses = enrolledCourses?.filter(course => 
    course.status !== 'pending' && course.enrollmentStatus !== 'pending'
  ) || [];
  
  // Filter and sort courses
  const filterAndSortCourses = (courses: any[]) => {
    if (!courses) return [];
    
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime();
      if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  };

  // Calculate stats with animation triggers
  const stats = React.useMemo(() => {
    if (!enrolledCourses) return { totalCourses: 0, inProgress: 0, completed: 0, totalProgress: 0 };
    
    const total = enrolledCourses.length;
    const inProgress = enrolledCourses.filter(c => c.status === 'started').length;
    const completed = enrolledCourses.filter(c => c.status === 'completed').length;
    const avgProgress = enrolledCourses.reduce((acc, curr) => acc + (curr.progress || 0), 0) / total;

    return {
      totalCourses: total,
      inProgress,
      completed,
      totalProgress: Math.round(avgProgress)
    };
  }, [enrolledCourses]);

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

  const cardHoverVariants = {
    initial: {
      scale: 1,
      boxShadow: "none"
    },
    hover: {
      scale: 1.01,
      boxShadow: "0 4px 12px -1px rgba(0, 0, 0, 0.05)",
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const bannerVariants = {
    initial: { 
      opacity: 0, 
      y: -20,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  useEffect(() => {
    // Rotate quotes every 10 seconds
    const interval = setInterval(() => {
      setCurrentQuote(prev => {
        const currentIndex = MOTIVATIONAL_QUOTES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % MOTIVATIONAL_QUOTES.length;
        return MOTIVATIONAL_QUOTES[nextIndex];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <main className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-white to-purple-50">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="mb-6">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-80" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const filteredActiveCourses = filterAndSortCourses(activeCourses);
  const latestCourse = filteredActiveCourses[0];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Enhanced Welcome Banner */}
          <motion.div
            variants={bannerVariants}
            initial="initial"
            animate="animate"
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3A0CA3] to-[#4361EE] p-8 md:p-10"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute left-0 bottom-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Welcome Back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                </h1>
                <motion.div
                  key={currentQuote.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  <p className="text-xl md:text-2xl text-white/90 font-medium">
                    {currentQuote.text}
                  </p>
                  <p className="text-sm text-white/70">
                    — {currentQuote.author}
                  </p>
                </motion.div>
              </motion.div>

              {/* Quick Stats */}
              {enrolledCourses && enrolledCourses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Current Progress</p>
                        <p className="text-lg font-semibold text-white">
                          {stats.totalProgress}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Active Courses</p>
                        <p className="text-lg font-semibold text-white">
                          {stats.inProgress}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Completed</p>
                        <p className="text-lg font-semibold text-white">
                          {stats.completed}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Decorative Icon */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
              <GraduationCap className="w-64 h-64 text-white" />
            </div>
          </motion.div>

          {(!enrolledCourses || enrolledCourses.length === 0) ? (
            <motion.div
              variants={cardHoverVariants}
              initial="initial"
              whileHover="hover"
              className="text-center py-16 px-4 rounded-2xl bg-white border border-gray-100"
            >
              <div className="max-w-md mx-auto">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-50 flex items-center justify-center"
                >
                  <BookOpen className="w-10 h-10 text-[#3A0CA3]" />
                </motion.div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">Start Your Learning Journey</h2>
                <p className="text-gray-600 mb-8">
                  Explore our catalog and find courses that match your interests and career goals
                </p>
                <Button 
                  onClick={handleExploreCoursesClick}
                  className="bg-[#3A0CA3] hover:bg-[#3A0CA3]/90 text-white px-8 py-2 rounded-full"
                >
                  Explore Courses
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Continue Learning Section */}
              {latestCourse && (
                <motion.div
                  variants={cardHoverVariants}
                  initial="initial"
                  whileHover="hover"
                  className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
                    <Button 
                      variant="ghost" 
                      className="text-[#3A0CA3] hover:bg-[#3A0CA3]/5"
                      onClick={() => handleCourseClick(latestCourse._id)}
                    >
                      View All <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                  </div>
                  <motion.div 
                    className="flex flex-col md:flex-row gap-6 items-center bg-[#FAFAFA] p-6 rounded-xl"
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-full md:w-1/3 overflow-hidden rounded-xl">
                      <motion.img 
                        src={latestCourse.image} 
                        alt={latestCourse.title}
                        className="w-full h-48 object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{latestCourse.title}</h3>
                      <p className="text-gray-600 mb-4">{latestCourse.description}</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {latestCourse.duration || 'Self-paced'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {latestCourse.progress}% Complete
                          </span>
                        </div>
                      </div>
                      <Progress value={latestCourse.progress} className="h-2 mb-4" />
                      <Button 
                        onClick={() => handleResumeClick(latestCourse._id)}
                        className="bg-[#3A0CA3] hover:bg-[#3A0CA3]/90"
                      >
                        Continue Learning
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Search and Filter Section */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search your courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-[#FAFAFA] border-gray-100 focus:border-[#3A0CA3] focus:ring-[#3A0CA3]/10"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px] border-gray-100 bg-[#FAFAFA]">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          <SelectValue placeholder="Filter by status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        <SelectItem value="enrolled">Not Started</SelectItem>
                        <SelectItem value="started">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-[180px] border-gray-100 bg-[#FAFAFA]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <SelectValue placeholder="Sort by" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="progress">Progress</SelectItem>
                        <SelectItem value="title">Title A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Course Sections */}
              <AnimatePresence mode="wait">
                {pendingCourses.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 text-[#3A0CA3] animate-spin" />
                      <h2 className="text-xl font-semibold text-[#3A0CA3]">Pending Enrollments</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingCourses.map((course) => (
                        <motion.div
                          key={course._id}
                          variants={cardHoverVariants}
                          initial="initial"
                          whileHover="hover"
                          layout
                          className="bg-white rounded-xl border border-gray-100"
                        >
                          <CourseCard 
                            id={course._id}
                            title={course.title}
                            description={course.description}
                            image={course.image}
                            duration={course.duration}
                            rating={course.rating || 0}
                            totalRatings={course.totalRatings || 0}
                            students={course.students || course.enrollmentCount || 0}
                            level={course.level || "Beginner"}
                            language={course.language}
                            instructor={course.instructor}
                            courseUrl={course.courseUrl}
                            onClick={() => {}}
                            enrollmentStatus="pending"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeCourses.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filterAndSortCourses(activeCourses).map((course) => (
                      <motion.div
                        key={course._id}
                        variants={itemVariants}
                        className="group"
                      >
                        <CourseCard
                          id={course._id}
                          title={course.title}
                          description={course.description}
                          image={course.image}
                          duration={course.duration}
                          rating={course.rating || 0}
                          totalRatings={course.totalRatings || 0}
                          students={course.students || course.enrollmentCount || 0}
                          level={course.level || "Beginner"}
                          language={course.language}
                          instructor={course.instructor}
                          courseUrl={course.courseUrl}
                          onClick={() => handleCourseClick(course._id)}
                          onStartClick={() => handleStartClick(course._id)}
                          onResumeClick={() => handleResumeClick(course._id)}
                          progress={course.progress || 0}
                          enrollmentStatus={course.status === 'started' ? 'started' : 'enrolled'}
                          completedDays={course.completedDays}
                          roadmap={course.roadmap}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    variants={cardHoverVariants}
                    initial="initial"
                    whileHover="hover"
                    className="text-center py-16 px-4 rounded-2xl bg-white border border-gray-100"
                  >
                    <div className="max-w-md mx-auto">
                      <AlertCircle className="w-16 h-16 mx-auto mb-6 text-[#2D1F8F]/40" />
                      <h2 className="text-2xl font-semibold mb-3 text-gray-900">No Courses Found</h2>
                      <p className="text-gray-600 mb-8">
                        {searchQuery 
                          ? "Try adjusting your search or filters"
                          : "You don't have any active courses yet."}
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="border-[#2D1F8F] text-[#2D1F8F] hover:bg-[#2D1F8F] hover:text-white transition-all duration-300"
                      >
                        {searchQuery ? "Clear Filters" : "Explore Courses"}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Discover More Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-8"
                >
                  <Button 
                    variant="outline" 
                    onClick={handleExploreCoursesClick}
                    className="border-[#3A0CA3]/20 text-[#3A0CA3] hover:bg-[#3A0CA3]/5 hover:border-[#3A0CA3]/30 group"
                  >
                    Discover More Courses
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default Courses;
