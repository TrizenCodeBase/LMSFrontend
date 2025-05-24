import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import FilterableCoursesSection from '@/components/FilterableCoursesSection';
import { useAllCourses, useEnrollCourse, useUpdateProgress } from '@/services/courseService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CardLoader } from '@/components/loaders';

const ExploreCourses = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: courses, isLoading, isError } = useAllCourses();
  const enrollMutation = useEnrollCourse();
  const updateProgressMutation = useUpdateProgress();
  
  // Handler for when a course card is clicked
  const handleCourseClick = (courseId: string) => {
    const course = courses?.find(c => c._id === courseId);
    const courseIdentifier = course?.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}`);
  };
  
  // Handler for enrolling in a course
  const handleEnrollClick = async (courseId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in courses.",
        variant: "destructive",
      });
      navigate('/login', { state: { from: `/explore-courses` } });
      return;
    }
    
    const course = courses?.find(c => c._id === courseId);
    const courseIdentifier = course?.courseUrl || courseId;
    // Navigate to payment form
    navigate(`/course/${courseIdentifier}/payment`);
  };
  
  // Handler for starting a course
  const handleStartClick = async (courseId: string) => {
    if (!token) return;
    
    try {
      await updateProgressMutation.mutateAsync({ 
        courseId: courseId.split('-')[0], // Extract courseId from courseUrl if needed
        progress: 1, 
        status: 'started',
        token 
      });
      
      navigate(`/course/${courseId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start the course. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handler for resuming a course
  const handleResumeClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-32" />
            ))}
          </div>
          
          <CardLoader count={6} />
        </main>
      </DashboardLayout>
    );
  }
  
  if (isError) {
    return (
      <DashboardLayout>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
            <p className="text-muted-foreground mb-6">We couldn't load the courses. Please try again later.</p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </main>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Explore Courses</h1>
          <p className="text-muted-foreground mt-1">Discover new courses and expand your knowledge</p>
        </div>
        
        <FilterableCoursesSection 
          courses={courses || []} 
          onCourseClick={handleCourseClick}
          onEnrollClick={handleEnrollClick}
          onStartClick={handleStartClick}
          onResumeClick={handleResumeClick}
        />
      </main>
    </DashboardLayout>
  );
};

export default ExploreCourses;
