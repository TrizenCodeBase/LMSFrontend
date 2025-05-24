import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Play, Plus, ArrowRight } from "lucide-react";

interface CourseCardProps {
  id: string;
  image: string;
  title: string;
  description: string;
  duration: string;
  rating: number;
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
}

const CourseCard = ({
  id,
  image,
  title,
  description,
  duration,
  rating,
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
  courseUrl
}: CourseCardProps) => {
  
  // Handle button clicks without propagating to the card
  const handleActionClick = (e: React.MouseEvent, callback?: (e: React.MouseEvent) => void) => {
    e.stopPropagation();
    if (callback) callback(e);
  };
  
  // Calculate progress based on course duration
  const calculateProgress = () => {
    if (!duration || !roadmap) return progress;
    const totalDurationDays = parseInt(duration.split(' ')[0]); // Assuming duration is in format "X days"
    const availableDays = roadmap.length;
    const completedDays = Math.ceil((progress / 100) * availableDays); // Calculate actual completed days
    
    // Calculate progress based on completed days relative to total duration
    const progressBasedOnDuration = Math.min(100, Math.round((completedDays / totalDurationDays) * 100));
    
    // If all available content is completed but there are more days than duration
    if (progress === 100) {
      if (availableDays > totalDurationDays) {
        // Show progress based on total duration days
        return 100;
      }
      // If we have fewer days than duration, show progress based on completed days
      return progressBasedOnDuration;
    }
    
    // If not all content is completed, show progress based on completed days
    return progressBasedOnDuration;
  };

  const actualProgress = calculateProgress();
  const isFullyComplete = progress === 100 && (!duration || parseInt(duration.split(' ')[0]) <= roadmap.length);
  
  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col"
      onClick={onClick}
    >
      <div className="relative w-full pt-[56.25%]">
        <img 
          src={image} 
          alt={title} 
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {isFullyComplete && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-600 text-white">
              <Check className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="flex-1">
        <div className="flex items-center justify-between">
          <Badge variant={
            level === "Beginner" ? "outline" : 
            level === "Intermediate" ? "secondary" : 
            "default"
          }>
            {level}
          </Badge>
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow-500"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
        </div>
        <h3 className="mt-2 font-semibold leading-tight">{title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        
        {instructor && (
          <p className="text-sm text-muted-foreground mt-1">Instructor: {instructor}</p>
        )}
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            <span>{students} students</span>
          </div>
          {language && (
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
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
              <span>{language}</span>
            </div>
          )}
        </div>
        
        <CardFooter className="px-0 pb-0 pt-4">
          {enrollmentStatus && (
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{actualProgress}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isFullyComplete ? 'bg-green-600' : 'bg-primary'
                    }`}
                    style={{ width: `${actualProgress}%` }}
                  ></div>
                </div>
                {progress === 100 && !isFullyComplete && (
                  <p className="text-xs text-blue-600 mt-1">
                    All available content completed
                  </p>
                )}
              </div>

              {enrollmentStatus === 'enrolled' && onStartClick && (
                <Button 
                  size="sm"
                  className="rounded-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm"
                  onClick={(e) => handleActionClick(e, onStartClick)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start Course
                </Button>
              )}
              
              {enrollmentStatus === 'started' && onResumeClick && (
                <Button 
                  size="sm"
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                  onClick={(e) => handleActionClick(e, onResumeClick)}
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              )}
              
              {isFullyComplete ? (
                <Badge className="px-3 py-1 rounded-full bg-green-600 text-white flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Completed
                </Badge>
              ) : enrollmentStatus === 'pending' && (
                <Badge className="px-3 py-1 rounded-full bg-yellow-600 text-white flex items-center gap-1">
                  <span className="h-2 w-2 bg-white rounded-full animate-pulse mr-1"></span>
                  Pending
                </Badge>
              )}
            </div>
          )}

          {!enrollmentStatus && onEnrollClick && (
            <div className="flex justify-end w-full">
              <Button 
                variant="outline"
                size="sm"
                className="rounded-full border border-primary text-primary hover:bg-primary/10 hover:text-primary font-medium shadow-sm"
                onClick={(e) => handleActionClick(e, onEnrollClick)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Enroll
              </Button>
            </div>
          )}
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
