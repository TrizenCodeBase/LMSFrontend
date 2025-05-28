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
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in this course.",
      });
      navigate('/login', { state: { from: `/course/${courseId}/details` } });
      return;
    }
    
    // Use courseUrl for navigation if available
    const courseIdentifier = course?.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}/payment`);
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
      <main className="flex-1 bg-gradient-to-b from-background to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  {course.title}
                </h1>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
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
                  <div className="text-muted-foreground">•</div>
                  <div className="text-muted-foreground">{course?.students?.toLocaleString()} students</div>
                  {course?.language && (
                    <>
                      

                    </>
                  )}
                </div>

                {/* Short Description */}
                <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                  <p className="text-sm font-semibold text-foreground">
                    {course.description}
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
                      {course.longDescription || course.description}
                    </p>
                  </div>
                </div>

                {/* Instructor Info */}
                <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    {course.instructorDetails?.profilePicture ? (
                      <img 
                        src={course.instructorDetails.profilePicture}
                        alt={course.instructorDetails.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{course.instructorDetails?.name || course.instructor}</p>
                    <p className="text-sm text-muted-foreground">Course Instructor</p>
                    
                  </div>
                </div>
              </div>
            </div>

            {/* Course Image and Enroll Section */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-lg p-6 sticky top-24">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-auto object-cover rounded-lg mb-4"
                />
                
                <div className="mb-6">
                  
                  
                  {/* Enroll Button */}
                  <Button 
                    className="w-full mb-4" 
                    size="lg"
                    onClick={handleEnroll}
                  >
                    Enroll Now
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">This course includes:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {course.duration || '10 hours'} of video content
                    </li>
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
                    {course.language && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Language: {course.language}
                      </li>
                    )}
                  </ul>
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
                    {(course.skills || [
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
                    {(course.roadmap || []).map((day, index) => (
                      <div 
                        key={index} 
                        className="bg-white border rounded-lg p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-10 ease-in w-full min-h-[220px]"
                      >
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
                            {index + 1}
                          </div>
                        </div>
                        <h3 className="font-medium text-base mb-3">{day.topics}</h3>
                        {day.notes && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground italic line-clamp-2">
                              {day.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Reviews Section */}
          <div className="mt-12 bg-card rounded-xl p-8 border">
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
      </main>
      <Footer />
    </div>
  );
};

export default CourseDetails; 