import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCourseDetails, useEnrollCourse, useUpdateProgress } from '@/services/courseService';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useQueryClient } from '@tanstack/react-query';

interface RoadmapDay {
  topics: string;
  video?: string;
  notes?: string;
  duration?: string;
  description?: string;
  completed?: boolean;
  day: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  longDescription?: string;
  instructor: string;
  instructorAvatar?: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  students: number;
  rating: number;
  enrollmentStatus?: string;
  duration?: string;
  days?: number;
  level?: string;
  language?: string;
  learningObjectives?: string[];
  requirements?: string[];
  targetAudience?: string[];
  roadmap?: RoadmapDay[];
  content?: any[];
  skills?: string[];
  progress?: number;
  image?: string;
  courseUrl?: string;
}

interface EnrollFormProps {
  courseId?: string;
}

const EnrollForm: React.FC<EnrollFormProps> = ({ courseId }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: course, isLoading, isError, refetch } = useCourseDetails(courseId, token);
  const enrollMutation = useEnrollCourse();
  const updateProgressMutation = useUpdateProgress();

  useEffect(() => {
    refetch();
  }, [isAuthenticated, token, refetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    }
  }, [isAuthenticated, courseId, queryClient]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in this course.",
        variant: "destructive",
      });
      navigate('/login', { state: { from: `/course/${courseId}` } });
      return;
    }
    
    // Use courseUrl if available
    const courseIdentifier = course?.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}/payment`);
  };

  const handleStartCourse = async () => {
    if (!token) return;
    
    try {
      await updateProgressMutation.mutateAsync({ 
        courseId: courseId!, 
        progress: 1, 
        status: 'started',
        token 
      });
      
      toast({
        title: "Course Started",
        description: "You can now access all course materials.",
      });
      
      // Redirect to my courses
      setTimeout(() => {
        navigate('/my-courses');
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start the course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResumeCourse = () => {
    const courseIdentifier = course?.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}/weeks`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Skeleton className="h-8 sm:h-12 w-3/4 mb-3 sm:mb-4" />
            <Skeleton className="h-16 sm:h-24 w-full mb-4 sm:mb-6" />
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Skeleton className="h-4 sm:h-6 w-24 sm:w-32" />
            </div>
            <Skeleton className="h-8 sm:h-10 w-28 sm:w-36 mb-3 sm:mb-4" />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-8 sm:mb-10">
              <Skeleton className="h-4 sm:h-6 w-32 sm:w-40" />
              <Skeleton className="h-4 sm:h-6 w-36 sm:w-48" />
            </div>
            {/* Course Highlights Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 sm:h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !course) {
    return (
      <DashboardLayout>
        <div className="min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Course Not Found</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              The course you're looking for doesn't seem to exist.
            </p>
            <Button onClick={() => navigate('/explore-courses')}>
              Browse Courses
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Determine button type based on enrollment status and authentication
  let actionButton;
  const isUserEnrolled = isAuthenticated && course?.enrollmentStatus && 
    ['enrolled', 'started', 'completed'].includes(course.enrollmentStatus);

  // Helper function to check if all uploaded days are completed
  const allUploadedDaysCompleted = () => {
    if (!course?.roadmap || !course?.progress) return false;
    return course.progress === 100;
  };

  // Helper function to check if all course duration days are completed
  const allCourseDaysCompleted = () => {
    if (!course?.duration || !course?.roadmap) return false;
    const totalDurationDays = parseInt(course.duration.split(' ')[0]); // Assuming duration is in format "X days"
    return course.roadmap.length === totalDurationDays && course.progress === 100;
  };

  if (!isAuthenticated) {
    actionButton = (
      <Button 
        size="lg" 
        onClick={handleEnroll} 
        className="mb-4 w-full bg-primary hover:bg-primary/90"
      >
        Enroll Now
      </Button>
    );
  } else if (!isUserEnrolled) {
    actionButton = (
      <Button 
        size="lg" 
        onClick={handleEnroll} 
        className="mb-4 w-full bg-primary hover:bg-primary/90"
        disabled={enrollMutation.isPending}
      >
        {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
      </Button>
    );
  } else if (allCourseDaysCompleted()) {
    actionButton = (
      <div className="space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-green-700 text-sm font-medium">
            🎉 Congratulations! You've completed the course!
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleResumeCourse} 
          className="mb-4 w-full bg-green-600 hover:bg-green-700"
        >
          View Course
        </Button>
      </div>
    );
  } else if (allUploadedDaysCompleted()) {
    actionButton = (
      <div className="space-y-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-blue-700 text-sm">
            You've completed all available content! More content will be added soon.
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleResumeCourse} 
          className="mb-4 w-full bg-blue-600 hover:bg-blue-700"
        >
          Resume Course
        </Button>
      </div>
    );
  } else if (course?.enrollmentStatus === 'enrolled' || course?.enrollmentStatus === 'started') {
    actionButton = (
      <Button 
        size="lg" 
        onClick={handleResumeCourse} 
        className="mb-4 w-full bg-blue-600 hover:bg-blue-700"
      >
        Resume Course
      </Button>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  {course?.title}
                </h1>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 flex">★★★★☆</span>
                    <span className="font-medium">{course?.rating}</span>
                    <span className="text-muted-foreground">({Math.floor(course?.students / 15)} reviews)</span>
                  </div>
                  <div className="text-muted-foreground">•</div>
                  <div className="text-muted-foreground">{course?.students?.toLocaleString()} students</div>
                </div>

                {/* Short Description */}
                              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <p className="text-sm font-semibold text-foreground">
                  {course?.description}
                </p>
              </div>

                {/* Long Description */}
                              <div className="bg-card rounded-xl p-6 border space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About This Course
                </h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {course?.longDescription}
                  </p>
                </div>
              </div>

                {/* Instructor Info */}
                <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
                  <img 
                    src={course?.instructorAvatar || 'https://ui-avatars.com/api/?name=' + course?.instructor}
                    alt={course?.instructor}
                    className="w-16 h-16 rounded-full border-2 border-border"
                  />
                  <div>
                    <p className="font-semibold text-lg">{course?.instructor}</p>
                    <p className="text-sm text-muted-foreground">Course Instructor</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-lg p-6 sticky top-24">
                <div className="space-y-4">
                <img
                    src={course?.image}
                    alt={course?.title}
                    className="w-full h-100 object-cover rounded-lg mb-4"
                  />
                  {/* <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold">{course?.price}</span>
                    {course?.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {course?.originalPrice}
                      </span>
                    )}
                  </div> */}

                  {actionButton}

                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">This course includes:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {course?.duration || '10 hours'} of video content
                      </li>
                      {course?.language && (
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Language: {course.language}
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Certificate of completion
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Lifetime access
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Content Preview */}
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <div className="grid grid-cols-1 lg:grid-cols-8 gap-8 px-4 sm:px-6 lg:px-8">
              <div className="lg:col-span-8 space-y-8">
                {/* What you'll learn */}
                <div className="bg-card rounded-xl p-8">
                  <h2 className="text-xl font-semibold mb-6">What you'll learn</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {(course?.skills || [
                      "No skills specified for this course"
                    ]).map((skill, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <svg className="w-6 h-6 mt-0.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-base">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Course Content */}
                <div className="bg-card rounded-xl p-8">
                  <h2 className="text-xl font-semibold mb-8">Course Content</h2>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {(course?.roadmap || []).map((day, index) => {
                    const handleDayClick = () => {
                      if (course?.enrollmentStatus === 'enrolled' || course?.enrollmentStatus === 'started') {
                        // Scroll to top smoothly
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    };

                    return (
                      <div 
                        key={index} 
                        onClick={handleDayClick}
                        className="bg-white border rounded-lg p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-10 ease-in w-full min-h-[220px] cursor-pointer hover:scale-[1.02]"
                        >
                          <div className="flex items-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
                              {index + 1}
                            </div>
                          </div>
                          <h3 className="font-medium text-base mb-3">{day.topics}</h3>
                          {day.description && (
                            <p className="text-xs text-muted-foreground mb-3">
                              {day.description}
                            </p>
                          )}
                          {day.notes && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground italic line-clamp-2">
                                {day.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EnrollForm;
