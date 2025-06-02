import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Play, Plus, ArrowRight, Star, Loader2, GraduationCap } from "lucide-react";
import ReviewDialog from "./ReviewDialog";
import { useQueryClient } from '@tanstack/react-query';
import { useReviewCounts } from "@/services/courseService";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CourseCardProps {
  id: string;
  image: string;
  title: string;
  description: string;
  duration: string;
  rating: number;
  totalRatings: number;
  students: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  language?: string;
  onClick?: () => void;
  progress?: number;
  enrollmentStatus?: 'enrolled' | 'started' | 'completed' | 'pending';
  onEnrollClick?: (e: React.MouseEvent) => void;
  onStartClick?: (e: React.MouseEvent) => void;
  onResumeClick?: (e: React.MouseEvent) => void;
  instructor?: string;
  roadmap?: { day: number; topics: string }[];
  courseUrl?: string;
  daysCompletedPerDuration?: string;
  completedDays?: number[];
  isLoading?: boolean;
  hideEnrollButton?: boolean;
}

const CourseCard = ({
  id,
  image,
  title,
  description,
  duration,
  rating,
  totalRatings,
  students,
  level,
  language,
  onClick,
  progress = 0,
  enrollmentStatus,
  onEnrollClick,
  onStartClick,
  onResumeClick,
  instructor,
  roadmap = [],
  courseUrl,
  daysCompletedPerDuration,
  completedDays,
  isLoading = false,
  hideEnrollButton = false
}: CourseCardProps) => {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: reviewCounts } = useReviewCounts();
  
  const courseReviewData = reviewCounts?.[id] || { totalReviews: 0, rating: 0 };
  
  // Log course review information
  useEffect(() => {
    console.log(`Course: ${title}`);
    console.log(`Total Reviews from API: ${courseReviewData.totalReviews}`);
    console.log(`Rating from API: ${courseReviewData.rating}`);
    console.log('------------------------');
  }, [title, courseReviewData]);
  
  // Handle button clicks without propagating to the card
  const handleActionClick = (e: React.MouseEvent, callback?: (e: React.MouseEvent) => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (callback) callback(e);
  };

  const handleReviewSubmitted = () => {
    // Invalidate relevant queries to refetch course data
    queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    queryClient.invalidateQueries({ queryKey: ['reviewCounts'] });
  };
  
  // Calculate progress based on course duration
  const calculateProgress = () => {
    // If we have daysCompletedPerDuration, use it directly
    if (typeof daysCompletedPerDuration === 'string') {
      const [completed, total] = daysCompletedPerDuration.split('/').map(Number);
      return Math.round((completed / total) * 100);
    }
    
    // If we have completedDays and duration, calculate from those
    if (completedDays && duration) {
      const totalDurationDays = parseInt(duration.split(' ')[0]); // Assuming duration is in format "X days"
      const completedDaysCount = completedDays.length;
      return Math.min(100, Math.round((completedDaysCount / totalDurationDays) * 100));
    }
    
    // Fallback to progress prop
    return progress;
  };

  const actualProgress = calculateProgress();
  const isFullyComplete = actualProgress === 100;

  // Get the actual days completed text
  const getDaysCompletedText = () => {
    if (daysCompletedPerDuration) {
      return daysCompletedPerDuration;
    }
    if (completedDays && duration) {
      const totalDays = parseInt(duration.split(' ')[0]);
      return `${completedDays.length}/${totalDays}`;
    }
    return '';
  };

  const daysCompletedText = getDaysCompletedText();
  
  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`h-4 w-4 ${
                value <= rating
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium ml-1">{courseReviewData.rating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground ml-1">•</span>
        <span className="text-sm text-muted-foreground">{courseReviewData.totalReviews} reviews</span>
      </div>
    );
  };
  
  const handleEnrollClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in courses.",
        variant: "destructive",
      });
      navigate('/login', { state: { from: `/explore-courses` } });
      return;
    }

    setIsActionLoading(true);
    try {
      if (onEnrollClick) {
        await onEnrollClick(e);
      }
      // Navigate to enrollment form with course ID or URL
      const courseIdentifier = courseUrl || id;
      navigate(`/course/${courseIdentifier}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderActionButton = () => {
    console.log('Enrollment Status:', enrollmentStatus); // Debug log

    // If hideEnrollButton is true and not enrolled, don't show any button
    if (hideEnrollButton && !enrollmentStatus) {
      return null;
    }

    if (enrollmentStatus === 'completed') {
      return (
        <Badge className="px-3 py-1 rounded-full bg-green-600 text-white flex items-center gap-1">
          <Check className="h-3 w-3" />
          Completed
        </Badge>
      );
    }

    if (enrollmentStatus === 'pending') {
      return (
        <Badge className="px-3 py-1 rounded-full bg-yellow-600 text-white flex items-center gap-1">
          <span className="h-2 w-2 bg-white rounded-full animate-pulse mr-1"></span>
          Pending
        </Badge>
      );
    }

    if (enrollmentStatus === 'started' && onResumeClick) {
        return (
          <Button 
          size="sm"
          className="w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm disabled:opacity-50 px-6 py-2"
          onClick={(e) => handleActionClick(e, onResumeClick)}
          disabled={isActionLoading}
        >
          {isActionLoading ? (
            <>
              Resuming...
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            </>
          ) : (
            <>
              Resume
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
          </Button>
        );
      }

    if (enrollmentStatus === 'enrolled') {
      if (onStartClick) {
        return (
          <Button 
            size="sm"
            className="w-full rounded-md bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm disabled:opacity-50 px-6 py-2"
            onClick={(e) => handleActionClick(e, onStartClick)}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <>
                Starting...
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              </>
            ) : (
              <>
                Start Course
                <Play className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        );
      }
      return (
        <Button 
          size="sm"
          className="w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm disabled:opacity-50 px-6 py-2"
          onClick={(e) => handleActionClick(e, onResumeClick)}
          disabled={isActionLoading}
        >
          {isActionLoading ? (
            <>
              Resuming...
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            </>
          ) : (
            <>
              Resume
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      );
    }

    // Show Enroll button only if not enrolled
    if (!enrollmentStatus) {
      return (
        <Button 
          variant="outline"
          size="sm"
          className="w-full rounded-md border border-primary text-primary hover:bg-primary/10 hover:text-primary font-medium shadow-sm disabled:opacity-50 px-6 py-2"
          onClick={handleEnrollClick}
          disabled={isActionLoading}
        >
          {isActionLoading ? (
            <>
              Enrolling...
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            </>
          ) : (
            <>
              Enroll
              <Plus className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      );
    }

    return null;
  };

  return (
      <Card 
      className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col max-w-[290px] w-full bg-white border border-[#E6E3F1] rounded-xl ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={onClick}
      >
      <div className="relative w-full pt-[55%]">
          <img 
            src={image} 
            alt={title} 
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          {isFullyComplete && (
            <Badge className="bg-green-600/90 backdrop-blur-sm text-white shadow-sm py-0.5 px-2 text-xs">
                <Check className="h-3 w-3 mr-1" />
                Completed
              </Badge>
          )}
          {enrollmentStatus && enrollmentStatus !== 'pending' && (
          <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsReviewDialogOpen(true);
              }}
              className="bg-white/90 backdrop-blur-sm hover:bg-white text-primary rounded-full px-2 py-0.5 text-xs font-medium shadow-sm flex items-center gap-1 transition-all hover:scale-105"
            >
              <Star className="h-3 w-3" />
              Review
          </button>
          )}
        </div>
        </div>
        
      <div className="flex-1 p-4">
        <div className="space-y-2">
          <h3 className="text-base font-semibold leading-tight group-hover:text-primary transition-colors duration-300">{title}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
          </div>
          
        <div className="flex items-center gap-4 mt-3 pb-3 border-b border-[#E6E3F1]">
          {/* Instructor */}
          {instructor && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 shrink-0 rounded-full bg-[#4B3F72]/10 flex items-center justify-center">
                <span className="text-xs font-medium text-[#4B3F72]">{instructor.charAt(0)}</span>
              </div>
              <span className="text-xs text-muted-foreground truncate">{instructor}</span>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium">{courseReviewData.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({courseReviewData.totalReviews})</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Course Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[#4B3F72]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs">{duration}</span>
            </div>

            <div className="flex items-center gap-1 text-[#4B3F72]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-xs">{students.toLocaleString()}</span>
            </div>

            {language && (
              <div className="flex items-center gap-1 text-[#4B3F72]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span className="text-xs">{language}</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-[#4B3F72]">
              <GraduationCap className="h-3 w-3" />
              <span className="text-xs">{level}</span>
            </div>
          </div>
          </div>
          
        {/* Progress Bar */}
            {(enrollmentStatus === 'enrolled' || enrollmentStatus === 'started' || enrollmentStatus === 'completed') && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{daysCompletedText ? `${daysCompletedText} days (${actualProgress}%)` : `${actualProgress}%`}</span>
                  </div>
            <div className="w-full bg-[#F3F1FB] h-1.5 rounded-full overflow-hidden">
                    <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isFullyComplete ? 'bg-green-600' : 'bg-[#4B3F72]'
                      }`}
                      style={{ width: `${actualProgress}%` }}
                    ></div>
                  </div>
                  {isFullyComplete && (
              <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                <Check className="h-2.5 w-2.5" />
                      Course completed
                    </p>
                  )}
              </div>
            )}

        {/* Action Button */}
        <div className="mt-3 flex justify-end">
              {renderActionButton()}
            </div>
              </div>

        {/* Review Dialog */}
        <ReviewDialog
          isOpen={isReviewDialogOpen}
          onClose={() => setIsReviewDialogOpen(false)}
        courseId={id}
          courseTitle={title}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </Card>
  );
};

export default CourseCard;
