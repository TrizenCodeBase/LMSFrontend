import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import FilterableCoursesSection from '@/components/FilterableCoursesSection';
import CourseTabs from '@/components/CourseTabs';
import { useAllCourses, useEnrollCourse, useEnrolledCourses, useUpdateProgress } from '@/services/courseService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CardLoader } from '@/components/loaders';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, BookOpen, PlusCircle, Sparkles } from "lucide-react";
import { CustomToast } from "@/components/ui/custom-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ExploreCourses = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: courses, isLoading, isError } = useAllCourses();
  const { data: enrolledCourses } = useEnrolledCourses(token);
  const enrollMutation = useEnrollCourse();
  const updateProgressMutation = useUpdateProgress();
  const [activeTab, setActiveTab] = useState("all-courses");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  // Function to get recommended courses based on course categories and ratings
  const getRecommendedCourses = () => {
    if (!courses) return [];

    // Simple recommendation based on highly rated courses
    return courses
      .filter(course => (course.rating || 0) >= 4.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8); // Show top 8 highly rated courses
  };

  // Function to get trending courses based on enrollment count
  const getTrendingCourses = () => {
    if (!courses) return [];
    return [...courses]
      .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      .slice(0, 8); // Show top 8 trending courses
  };

  // Function to get top instructors based on course reviews
  const getTopInstructors = () => {
    if (!courses) return [];
    
    const instructorStats = courses.reduce((acc: any, course) => {
      if (!course.instructor) return acc;
      
      if (!acc[course.instructor]) {
        acc[course.instructor] = {
          name: course.instructor,
          totalRating: course.rating || 0,
          courseCount: 1,
          totalStudents: course.enrollmentCount || 0,
          courses: [course]
        };
      } else {
        acc[course.instructor].totalRating += course.rating || 0;
        acc[course.instructor].courseCount += 1;
        acc[course.instructor].totalStudents += course.enrollmentCount || 0;
        acc[course.instructor].courses.push(course);
      }
      return acc;
    }, {});

    return Object.values(instructorStats)
      .map((instructor: any) => ({
        ...instructor,
        averageRating: instructor.totalRating / instructor.courseCount
      }))
      .sort((a: any, b: any) => b.averageRating - a.averageRating);
  };

  // Get filtered courses based on active tab
  const getFilteredCourses = () => {
    switch (activeTab) {
      case 'recommended':
        return getRecommendedCourses();
      case 'trending':
        return getTrendingCourses();
      case 'top-instructors':
        return []; // We'll handle this view differently
      default:
        return courses || [];
    }
  };

  const handleCourseClick = (courseId: string, status?: string) => {
    const course = courses?.find(c => c._id === courseId);
    if (!course) return;

    // Always navigate to enrollment form
    const courseIdentifier = course.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}`);
  };

  const handleEnrollClick = (courseId: string) => {
    const course = courses?.find(c => c._id === courseId);
    if (!course) return;

    // Navigate to enrollment form
    const courseIdentifier = course.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}`);
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
      
      const course = courses?.find(c => c._id === courseId);
      const courseIdentifier = course?.courseUrl || courseId;
      navigate(`/course/${courseIdentifier}/weeks`);
    } catch (error) {
      toast({
        description: (
          <CustomToast 
            title="Error"
            description="Could not start the course. Please try again."
            type="error"
          />
        ),
        duration: 3000,
        className: "p-0 bg-transparent border-0"
      });
    }
  };

  const handleResumeClick = (courseId: string) => {
    const course = courses?.find(c => c._id === courseId);
    const courseIdentifier = course?.courseUrl || courseId;
    navigate(`/course/${courseIdentifier}/weeks`);
  };

  const handleGoToMyCourses = () => {
    navigate('/my-courses');
  };

  // Render instructor cards
  const renderInstructorView = () => {
    const topInstructors = getTopInstructors();

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {topInstructors.map((instructor: any) => (
          <div key={instructor.name} className="bg-white rounded-xl shadow-sm border border-[#2D1F8F]/10 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#2D1F8F]/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-[#2D1F8F]">
                  {instructor.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{instructor.name}</h3>
                <p className="text-sm text-gray-500">{instructor.courseCount} courses</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">{instructor.averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">average rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{instructor.totalStudents} students</span>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full text-[#2D1F8F] border-[#2D1F8F]/20 hover:bg-[#2D1F8F]/5"
                  onClick={() => {
                    // You can add functionality to view instructor's courses
                    // For now, we'll just show their courses in the main view
                    setActiveTab('all-courses');
                  }}
                >
                  View Courses
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <CardLoader key={n} />
            ))}
          </div>
          </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b">
          <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'top-instructors' ? (
            renderInstructorView()
          ) : (
            <FilterableCoursesSection 
              courses={getFilteredCourses()} 
              onCourseClick={handleCourseClick}
              onEnrollClick={handleEnrollClick}
              onStartClick={handleStartClick}
              onResumeClick={handleResumeClick}
              isExploreView={true}
              hideFilters={activeTab !== 'all-courses'}
              activeTab={activeTab}
              enrolledCourses={enrolledCourses || []}
            />
          )}

          {/* Request a Course CTA */}
          <section className="my-12 px-6">
            <Card className="bg-gradient-to-br from-[#2D1F8F]/5 to-[#2D1F8F]/10 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="mx-auto max-w-2xl">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-[#2D1F8F]" />
                  <h2 className="text-2xl font-semibold mb-2">Don't see what you're looking for?</h2>
                  <p className="text-muted-foreground mb-6">
                    We're constantly adding new courses based on student requests. 
                    Let us know what you'd like to learn!
                  </p>
                  <Button 
                    size="lg"
                    className="bg-[#2D1F8F] hover:bg-[#2D1F8F]/90"
                    onClick={() => window.location.href = "mailto:requests@example.com?subject=Course Request"}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Request a Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
      </main>
      </div>

      {/* Enrollment Form Dialog */}
      <Dialog open={showEnrollForm} onOpenChange={setShowEnrollForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enroll in Course</DialogTitle>
            <DialogDescription>
              You're about to enroll in {selectedCourse?.title}. This course will be added to your learning dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Course Duration</h4>
                  <p className="text-sm text-muted-foreground">{selectedCourse?.duration}</p>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Difficulty Level</h4>
                  <p className="text-sm text-muted-foreground">{selectedCourse?.level}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">What you'll learn</h4>
                <p className="text-sm text-muted-foreground">{selectedCourse?.description}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEnrollForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedCourse && handleEnrollClick(selectedCourse._id)}
                className="bg-[#2D1F8F] hover:bg-[#2D1F8F]/90"
              >
                Confirm Enrollment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ExploreCourses;
