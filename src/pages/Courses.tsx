
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/CourseCard";
import { useEnrolledCourses, useUpdateProgress } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const Courses = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const { data: enrolledCourses, isLoading, isError } = useEnrolledCourses(token);
  const updateProgressMutation = useUpdateProgress();
  
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
    
    navigate(`/course/${courseId}/weeks`);
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
      
      navigate(`/course/${courseId}/weeks`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start the course. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleResumeClick = (courseId: string) => {
    navigate(`/course/${courseId}/weeks`);
  };
  
  // Group courses by status
  const pendingCourses = enrolledCourses?.filter(course => 
    course.status === 'pending' || course.enrollmentStatus === 'pending'
  ) || [];
  
  const activeCourses = enrolledCourses?.filter(course => 
    course.status !== 'pending' && course.enrollmentStatus !== 'pending'
  ) || [];
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-md" />
            ))}
          </div>
        </main>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-1">Continue your learning journey</p>
        </div>
        
        {(!enrolledCourses || enrolledCourses.length === 0) ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">You haven't enrolled in any courses yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Explore our catalog and find courses that match your interests and career goals
            </p>
            <Button onClick={handleExploreCoursesClick}>
              Explore Courses
            </Button>
          </div>
        ) : (
          <div>
            {pendingCourses.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Pending Enrollments</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingCourses.map((course) => (
                    <CourseCard
                      key={course._id}
                      id={course._id}
                      image={course.image}
                      title={course.title}
                      description={course.description}
                      duration={course.duration}
                      rating={course.rating}
                      students={course.students}
                      level={course.level}
                      progress={course.progress}
                      instructor={course.instructor}
                      enrollmentStatus="pending"
                      onClick={() => {}} // Disabled click for pending courses
                    />
                  ))}
                </div>
              </div>
            )}
            
            {activeCourses.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">My Courses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {activeCourses.map((course) => (
                    <CourseCard
                      key={course._id}
                      id={course._id}
                      image={course.image}
                      title={course.title}
                      description={course.description}
                      duration={course.duration}
                      rating={course.rating}
                      students={course.students}
                      level={course.level}
                      progress={course.progress}
                      instructor={course.instructor}
                      enrollmentStatus={course.status as 'enrolled' | 'started' | 'completed'}
                      onClick={() => handleCourseClick(course._id)}
                      onStartClick={course.status === 'enrolled' ? () => handleStartClick(course._id) : undefined}
                      onResumeClick={course.status === 'started' ? () => handleResumeClick(course._id) : undefined}
                    />
                  ))}
                </div>
              </div>
            ) : pendingCourses.length > 0 && (
              <div className="text-center py-8 border rounded-lg bg-card mt-8">
                <p className="text-muted-foreground mb-4">
                  You don't have any active courses yet. Your enrollments are pending approval.
                </p>
                <Button onClick={handleExploreCoursesClick} variant="outline">
                  Explore More Courses
                </Button>
              </div>
            )}
            
            <div className="text-center mt-8">
              <Button variant="outline" onClick={handleExploreCoursesClick}>
                Discover More Courses
              </Button>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default Courses;
