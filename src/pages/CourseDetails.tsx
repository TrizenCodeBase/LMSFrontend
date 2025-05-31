import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { useCourseDetails, useReviewCounts } from '@/services/courseService';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Star } from 'lucide-react';
import CourseReviews from '@/components/CourseReviews';
import axios from '@/lib/axios';

interface RoadmapDay {
  day: number;
  topics: string;
  video: string;
  notes?: string;
  transcript?: string;
}

interface Review {
  _id: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const CourseDetails = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: course, isLoading, isError } = useCourseDetails(courseId);
  const { data: reviewCounts } = useReviewCounts();
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Get review data from the cache
  const reviewData = course?._id ? (reviewCounts?.[course._id] || { totalReviews: 0, rating: 0 }) : { totalReviews: 0, rating: 0 };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const handleEnroll = () => {
    const courseIdentifier = course?.courseUrl || courseId;
    
    if (!isAuthenticated) {
      // When not logged in, redirect to login with return path to enroll form
      navigate('/login', { state: { from: `/course/${courseIdentifier}` } });
      return;
    }
    
    // When logged in, go directly to enroll form
    navigate(`/course/${courseIdentifier}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-background">
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
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Course Not Found</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              The course you're looking for doesn't seem to exist.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
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
                {course.title}
              </h1>

              {/* Short Description */}
              <p className="text-base text-white/90 mb-4">
                {course.description?.slice(0, 150)}...
              </p>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                {/* Rating */}
                <div className="flex items-center gap-2 text-white/90">
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
                  <span className="text-sm text-white/75 ml-1">•</span>
                  <span className="text-sm text-white/75">{reviewData.totalReviews || 0} reviews</span>
                </div>

                {/* Students */}
                {course?.students !== undefined && (
                  <div className="flex items-center gap-2 text-white/90">
                    <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                )}

                {/* Duration */}
                {course?.duration && (
                  <div className="flex items-center gap-2 text-white/90">
                    <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{course.duration}</span>
                  </div>
                )}

                {/* Language */}
                {course?.language && (
                  <div className="flex items-center gap-2 text-white/90">
                    <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span>{course.language}</span>
                  </div>
                )}
              </div>

              {/* Instructor Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  {course.instructorDetails?.profilePicture ? (
                    <img 
                      src={course.instructorDetails.profilePicture}
                      alt={course.instructorDetails.name}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-base text-white">
                      {(course.instructorDetails?.name || course.instructor || 'IN').charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-medium text-white">
                    {course.instructorDetails?.name || course.instructor}
                  </h3>
                  <p className="text-sm text-white/75">Course Instructor</p>
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
                  <svg className="w-6 h-6 text-[#2D1F8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About This Course
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {course.description}
                  </p>
                </div>
              </div>

              {/* Course Content */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#2D1F8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Course Content
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {(course.roadmap || []).map((day, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer rounded-xl border border-gray-200 hover:border-[#2D1F8F]/20 bg-white hover:bg-[#2D1F8F]/10 transition-all duration-200 overflow-hidden"
                    >
                      <div className="flex items-start p-4 gap-4 relative">
                        {/* Left border with radius */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2D1F8F] rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 ring-2 ring-gray-50 z-10 group-hover:bg-[#2D1F8F]/10 group-hover:text-[#2D1F8F] group-hover:ring-[#2D1F8F]/20">
                          {day.day}
                        </div>
                        <div className="flex-grow min-w-0 space-y-1">
                          <h3 className="text-sm font-semibold leading-tight text-gray-900 group-hover:text-[#2D1F8F]">
                            {day.topics}
                          </h3>
                          {day.notes && (
                            <p className="text-xs text-gray-600 leading-relaxed group-hover:text-[#2D1F8F]/80">
                              {day.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 bg-gray-50 group-hover:bg-[#2D1F8F]/20 group-hover:text-[#2D1F8F] transition-colors duration-200">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                      <div className="px-4 py-2.5 border-t border-gray-100 text-xs font-medium flex items-center gap-2 text-gray-500 bg-gray-50/50 group-hover:bg-[#2D1F8F]/10 group-hover:text-[#2D1F8F] group-hover:border-[#2D1F8F]/20 transition-colors duration-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Sign in to unlock this lesson</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews Section */}
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

            {/* Right Column - Enrollment Card */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-lg border p-6 sticky top-24">
                <div className="space-y-6">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                 

                  <Button 
                    onClick={handleEnroll}
                    size="lg"
                    className="w-full bg-[#2D1F8F] hover:bg-[#2D1F8F]/90"
                  >
                    {isAuthenticated ? 'Enroll Now' : 'Sign in to Enroll'}
                  </Button>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#2D1F8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      This course includes:
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-gray-600">
                        <svg className="w-5 h-5 text-[#2D1F8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {course.duration || '10 hours'} of video content
                      </li>
                      {course.language && (
                        <li className="flex items-center gap-3 text-gray-600">
                          <svg className="w-5 h-5 text-[#2D1F8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          {course.language}
                        </li>
                      )}
                      <li className="flex items-center gap-3 text-gray-600">
                        <svg className="w-5 h-5 text-[#2D1F8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Certificate of completion
                      </li>
                      <li className="flex items-center gap-3 text-gray-600">
                        <svg className="w-5 h-5 text-[#2D1F8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Lifetime access
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CourseDetails; 