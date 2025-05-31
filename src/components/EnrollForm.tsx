import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCourseDetails, useEnrollCourse, useUpdateProgress, useReviewCounts } from '@/services/courseService';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useQueryClient } from '@tanstack/react-query';
import { Star, Lock, Play, CheckCircle, Users, Clock, Globe, Award, BookOpen, ChevronDown, ChevronUp, GraduationCap, BookOpenCheck, Target, Sparkles } from 'lucide-react';
import CourseReviews from '@/components/CourseReviews';
import axios from '@/lib/axios';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MCQOption {
  text: string;
  isCorrect: boolean;
}

interface MCQQuestion {
  question: string;
  options: MCQOption[];
  explanation?: string;
}

interface RoadmapDay {
  day: number;
  topics: string;
  video: string;
  transcript?: string;
  notes?: string;
  mcqs: MCQQuestion[];
  code?: string;
  language?: string;
  description?: string;
  completed?: boolean;
}

interface Review {
  _id: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Instructor {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  level: string;
  instructor: Instructor | string;
  roadmap: RoadmapDay[];
  completedDays?: number[];
  courseUrl?: string;
  enrollmentStatus?: string;
  language?: string;
  image?: string;
  progress?: number;
  students?: number;
  skills?: string[];
  originalPrice?: number;
}

interface EnrollFormProps {
  courseId?: string;
}

const EnrollForm: React.FC<EnrollFormProps> = ({ courseId }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: reviewCounts } = useReviewCounts();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const { data: course, isLoading, isError, refetch } = useCourseDetails(courseId);
  const enrollMutation = useEnrollCourse();
  const updateProgressMutation = useUpdateProgress();

  // Get review data from the cache
  const reviewData = course?._id ? (reviewCounts?.[course._id] || { totalReviews: 0, rating: 0 }) : { totalReviews: 0, rating: 0 };

  useEffect(() => {
    refetch();
  }, [isAuthenticated, token, refetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    }
  }, [isAuthenticated, courseId, queryClient]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!course?._id) return;
      try {
        const response = await axios.get<Review[]>(`/api/courses/${course._id}/reviews`);
        setReviews(response.data);
        console.log('Fetched reviews:', response.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    fetchReviews();
  }, [course?._id]);

  const handleReviewsChange = () => {
    // Refetch reviews when a review is added/updated/deleted
    if (course?._id) {
      axios.get<Review[]>(`/api/courses/${course._id}/reviews`)
        .then(response => {
          setReviews(response.data);
          console.log('Updated reviews:', response.data);
        })
        .catch(error => console.error('Error fetching reviews:', error));
    }
  };

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
        completedDays: [],
        token,
        progress: 1, 
        status: 'started'
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

  const handleDayClick = (day: RoadmapDay, index: number) => {
    if (!isUserEnrolled) {
      toast({
        title: "Enrollment Required",
        description: "Please enroll in the course to access this content.",
        variant: "destructive",
      });
      return;
    }

    const previousDaysCompleted = course?.roadmap
      ?.slice(0, index)
      .every(d => d.completed);

    if (!previousDaysCompleted) {
      toast({
        title: "Previous Days Required",
        description: "Please complete the previous days first.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to the specific day in the course
    const courseIdentifier = course?.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}/weeks?day=${day.day}`);
  };

  const renderCourseContent = () => {
    if (!course?.roadmap) return null;

    return (
      <div className="mt-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Course Content</h2>
          <p className="text-sm text-gray-500">
            {course.roadmap.length} lessons • {course?.duration || 'Self-paced'} • All levels
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {course.roadmap.map((day, index) => {
            const isLocked = !isUserEnrolled;
            const isCompleted = course.completedDays?.includes(day.day) || false;
            const isPreviousCompleted = index === 0 || 
              (course.completedDays?.includes(index) || false);

            return (
              <div
                key={index}
                onClick={() => {
                  if (!isLocked && (isPreviousCompleted || isCompleted)) {
                    const courseIdentifier = course?.courseUrl || courseId;
                    navigate(`/course/${courseIdentifier}/weeks?day=${day.day}`);
                  }
                }}
                className={`relative group cursor-pointer rounded-xl border transition-all duration-200
                  ${isLocked 
                    ? 'border-gray-200 hover:border-gray-300 bg-white' 
                    : isCompleted
                      ? 'border-[#2D1F8F] bg-white hover:shadow-sm'
                      : isPreviousCompleted
                        ? 'border-[#2D1F8F]/30 hover:border-[#2D1F8F] hover:shadow-sm bg-white'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
              >
                <div className="flex items-start p-4 gap-4">
                  {/* Day Number Badge */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                    ${isCompleted 
                      ? 'bg-[#2D1F8F] text-white ring-2 ring-[#2D1F8F]/10' 
                      : isPreviousCompleted
                        ? 'bg-[#2D1F8F]/10 text-[#2D1F8F] ring-2 ring-[#2D1F8F]/5'
                        : 'bg-gray-100 text-gray-500 ring-2 ring-gray-50'
                    }`}>
                    {day.day}
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold leading-tight ${
                        isLocked || (!isPreviousCompleted && !isCompleted) 
                          ? 'text-gray-500' 
                          : 'text-gray-900'
                      }`}>
                        {day.topics}
                      </h3>
                      {isCompleted && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#2D1F8F]/10 text-[#2D1F8F]">
                          Completed
                        </span>
                      )}
                    </div>
                    {day.description && (
                      <p className={`text-xs leading-relaxed ${
                        isLocked || (!isPreviousCompleted && !isCompleted) 
                          ? 'text-gray-400' 
                          : 'text-gray-600'
                      }`}>
                        {day.description}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    transition-colors duration-200
                    ${isCompleted 
                      ? 'text-[#2D1F8F] bg-[#2D1F8F]/5' 
                      : isLocked || !isPreviousCompleted 
                        ? 'text-gray-400 bg-gray-50'
                        : 'text-[#2D1F8F] bg-[#2D1F8F]/5 group-hover:bg-[#2D1F8F]/10'
                    }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isLocked || !isPreviousCompleted ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Completion Status */}
                <div className={`px-4 py-2.5 border-t text-xs font-medium flex items-center gap-2
                  ${isCompleted 
                    ? 'border-[#2D1F8F]/10 text-[#2D1F8F] bg-[#2D1F8F]/5' 
                    : isPreviousCompleted
                      ? 'border-gray-100 text-[#2D1F8F] bg-[#2D1F8F]/5'
                      : 'border-gray-100 text-gray-500 bg-gray-50/50'
                  }`}>
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed this lesson</span>
                    </>
                  ) : isPreviousCompleted ? (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Continue with this lesson</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Complete previous lessons to unlock</span>
                    </>
                  )}
                </div>

                {/* Locked Overlay */}
                {(isLocked || (!isPreviousCompleted && !isCompleted)) && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <div className="text-center p-6">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 ring-4 ring-gray-50">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {!isUserEnrolled 
                          ? "Lesson Locked" 
                          : "Complete Previous Lessons"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {!isUserEnrolled 
                          ? "Enroll in this course to unlock all content" 
                          : "Complete the previous lessons to unlock this content"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRatingStars = () => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`h-4 w-4 ${
                value <= (reviewData.rating || 0)
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium ml-1">{(reviewData.rating || 0).toFixed(1)}</span>
        <span className="text-sm text-muted-foreground ml-1">•</span>
        <span className="text-sm text-muted-foreground">{reviewData.totalReviews || 0} reviews</span>
      </div>
    );
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

  // Add type guard function
  const isInstructorObject = (instructor: Instructor | string): instructor is Instructor => {
    return typeof instructor === 'object' && instructor !== null && '_id' in instructor;
  };

  if (!isAuthenticated) {
    actionButton = (
      <Button 
        size="lg" 
        onClick={handleEnroll} 
        className="mb-4 w-full bg-[#2D1F8F] hover:bg-[#2D1F8F]/90"
      >
        Enroll Now
      </Button>
    );
  } else if (!isUserEnrolled) {
    actionButton = (
      <Button 
        size="lg" 
        onClick={handleEnroll} 
        className="mb-4 w-full bg-[#2D1F8F] hover:bg-[#2D1F8F]/90"
        disabled={enrollMutation.isPending}
      >
        {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
      </Button>
    );
  } else if (allCourseDaysCompleted()) {
    actionButton = (
      <div className="space-y-2">
        <div className="bg-[#2D1F8F]/5 border border-[#2D1F8F]/20 rounded-lg p-3 text-center">
          <p className="text-[#2D1F8F] text-sm font-medium">
            🎉 Congratulations! You've completed the course!
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleResumeCourse} 
          className="mb-4 w-full bg-[#2D1F8F] hover:bg-[#2D1F8F]/90"
        >
          View Course
        </Button>
      </div>
    );
  } else if (allUploadedDaysCompleted()) {
    actionButton = (
      <div className="space-y-2">
        <div className="bg-[#2D1F8F]/5 border border-[#2D1F8F]/20 rounded-lg p-3 text-center">
          <p className="text-[#2D1F8F] text-sm">
            You've completed all available content! More content will be added soon.
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleResumeCourse} 
          className="mb-4 w-full bg-[#2D1F8F] hover:bg-[#2D1F8F]/90"
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
        className="mb-4 w-full bg-[#2D1F8F] hover:bg-[#2D1F8F]/90"
      >
        Resume Course
      </Button>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/50">
        {/* Hero Section */}
        <div className="bg-[#2D1F8F] text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="max-w-4xl">
              {/* Course Level Badge */}
              <div className="mb-3">
                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                  {course?.level || 'All Levels'}
                </Badge>
              </div>

              {/* Course Title */}
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                {course?.title}
              </h1>

              {/* Short Description */}
              <p className="text-base text-white/90 mb-4">
                {course?.description?.slice(0, 150)}...
              </p>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                {/* Rating */}
                <div className="flex items-center gap-2 text-white/90">
                  {renderRatingStars()}
                </div>

                {/* Students */}
                {course?.students !== undefined && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Users className="w-4 h-4 text-white/90" />
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                )}

                {/* Duration */}
                {course?.duration && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Clock className="w-4 h-4 text-white/90" />
                    <span>{course.duration}</span>
                  </div>
                )}

                {/* Language */}
                {course?.language && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Globe className="w-4 h-4 text-white/90" />
                    <span>{course.language}</span>
                  </div>
                )}
              </div>

              {/* Instructor Info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  {isInstructorObject(course?.instructor) && course.instructor.avatar ? (
                    <img 
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-white/10 text-white text-base">
                      {isInstructorObject(course?.instructor) ? 
                        course.instructor.name.split(' ').map(n => n[0]).join('') :
                        'IN'
                      }
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="text-base font-medium text-white">
                    {isInstructorObject(course?.instructor) ? 
                      course.instructor.name :
                      course?.instructor || 'Instructor'
                    }
                  </h3>
                  {isInstructorObject(course?.instructor) && course.instructor.title && (
                    <p className="text-sm text-white/75">{course.instructor.title}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2">
              {/* About This Course */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <BookOpenCheck className="w-6 h-6 text-[#2D1F8F]" />
                  About This Course
                </h2>
                <div className="prose prose-gray max-w-none">
                  <div className={`relative ${!isDescriptionExpanded && 'max-h-[300px] overflow-hidden'}`}>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-4">
                      {course?.longDescription || course?.description}
                    </p>
                    {!isDescriptionExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
                    )}
                  </div>
                  {(course?.longDescription?.length || course?.description?.length || 0) > 300 && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="flex items-center gap-2 text-[#2D1F8F] hover:text-[#2D1F8F]/80 font-medium mt-4"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          Show Less
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Read More
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Enrollment Card - Mobile Only */}
              <div className="lg:hidden mb-8">
                <div className="bg-white rounded-2xl shadow-lg border p-6">
                  <div className="space-y-6">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={course?.image}
                        alt={course?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Price Section */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#2D1F8F]">
                        {course?.price}
                      </span>
                      {course?.originalPrice && (
                        <span className="text-lg text-gray-500 line-through">
                          {course.originalPrice}
                        </span>
                      )}
                    </div>

                    {actionButton}

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#2D1F8F]" />
                        This course includes:
                      </h4>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-gray-600">
                          <Play className="w-5 h-5 text-[#2D1F8F]" />
                          {course?.duration || '10 hours'} of video content
                        </li>
                        {course?.language && (
                          <li className="flex items-center gap-3 text-gray-600">
                            <Globe className="w-5 h-5 text-[#2D1F8F]" />
                            {course.language}
                          </li>
                        )}
                        <li className="flex items-center gap-3 text-gray-600">
                          <Award className="w-5 h-5 text-[#2D1F8F]" />
                          Certificate of completion
                        </li>
                        <li className="flex items-center gap-3 text-gray-600">
                          <Clock className="w-5 h-5 text-[#2D1F8F]" />
                          Lifetime access
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* What You'll Learn */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <Target className="w-6 h-6 text-[#2D1F8F]" />
                  What You'll Learn
                </h2>
                {course?.skills && course.skills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.skills.map((skill, index) => (
                      <div key={index} className="flex items-start gap-3 bg-[#2D1F8F]/5 p-4 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-[#2D1F8F] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{skill}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4">
                    <div className="w-12 h-12 rounded-full bg-[#2D1F8F]/5 flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6 text-[#2D1F8F]" />
                    </div>
                    <p className="text-gray-600">No skills have been specified for this course yet.</p>
                  </div>
                )}
              </div>

              {/* Course Content */}
              <div className="mb-8">
                {renderCourseContent()}
              </div>

              {/* Course Reviews Section */}
              <div className="bg-white rounded-2xl p-8 border shadow-sm">
                {course && (
                  <CourseReviews
                    courseId={course._id}
                    courseTitle={course.title}
                    reviews={reviews}
                    onReviewsChange={handleReviewsChange}
                  />
                )}
              </div>
            </div>

            {/* Right Column - Enrollment Card Desktop Only */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-lg border p-6 sticky top-24">
                <div className="space-y-6">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={course?.image}
                      alt={course?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Price Section */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#2D1F8F]">
                      {course?.price}
                    </span>
                    {course?.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        {course.originalPrice}
                      </span>
                    )}
                  </div>

                  {actionButton}

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#2D1F8F]" />
                      This course includes:
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-gray-600">
                        <Play className="w-5 h-5 text-[#2D1F8F]" />
                        {course?.duration || '10 hours'} of video content
                      </li>
                      {course?.language && (
                        <li className="flex items-center gap-3 text-gray-600">
                          <Globe className="w-5 h-5 text-[#2D1F8F]" />
                          {course.language}
                        </li>
                      )}
                      <li className="flex items-center gap-3 text-gray-600">
                        <Award className="w-5 h-5 text-[#2D1F8F]" />
                        Certificate of completion
                      </li>
                      <li className="flex items-center gap-3 text-gray-600">
                        <Clock className="w-5 h-5 text-[#2D1F8F]" />
                        Lifetime access
                      </li>
                    </ul>
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
