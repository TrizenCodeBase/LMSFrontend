import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import FilterableCoursesSection from '@/components/FilterableCoursesSection';
import CourseTabs from '@/components/CourseTabs';
import { useAllCourses, useEnrollCourse, useEnrolledCourses, useUpdateProgress } from '@/services/courseService';
import { useInstructorDetails } from '@/services/instructorService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CardLoader } from '@/components/loaders';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, BookOpen, PlusCircle, Sparkles, Check, Play } from "lucide-react";
import { CustomToast } from "@/components/ui/custom-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import axios from '@/lib/axios';

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
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [instructorProfiles, setInstructorProfiles] = useState<{ [key: string]: any }>({});

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

  // Effect to fetch instructor profiles when courses change
  useEffect(() => {
    const fetchInstructorProfiles = async () => {
      if (!courses) return;
      
      try {
        // Get unique instructor IDs
        const instructorIds = [...new Set(courses.map(course => course.instructorId).filter(Boolean))];
        
        // Fetch instructor profiles
        const profiles = await Promise.all(
          instructorIds.map(async (id) => {
            try {
              const response = await axios.get(`/api/instructors/${id}`);
              return { id, data: response.data };
            } catch (error) {
              console.error(`Error fetching instructor ${id}:`, error);
              // Return null for failed fetches, but don't break the whole process
              return { id, data: null };
            }
          })
        );
        
        // Update state with profiles, filtering out failed fetches
        const profileMap = profiles.reduce((acc, { id, data }) => {
          if (data) {
            acc[id] = data;
          }
          return acc;
        }, {});
        
        setInstructorProfiles(profileMap);
      } catch (error) {
        console.error('Error fetching instructor profiles:', error);
        // Don't update state if the overall process fails
      }
    };

    fetchInstructorProfiles();
  }, [courses]);

  // Function to get profile picture for an instructor
  const getInstructorProfilePicture = (instructorId: string) => {
    return instructorProfiles[instructorId]?.profilePicture || null;
  };

  // Function to get top instructors based on course reviews
  const getTopInstructors = () => {
    if (!courses) return [];
    
    const instructorStats = courses.reduce((acc: any, course) => {
      if (!course.instructor || !course.instructorId) return acc;
      
      // Calculate students count - handle both array and number types
      const studentCount = Array.isArray(course.students) 
        ? course.students.length 
        : (typeof course.students === 'number' ? course.students : 0);
      
      if (!acc[course.instructorId]) {
        acc[course.instructorId] = {
          name: course.instructor,
          instructorId: course.instructorId,
          profilePicture: getInstructorProfilePicture(course.instructorId),
          totalRating: course.rating || 0,
          courseCount: 1,
          totalStudents: studentCount,
          courses: [course],
          category: course.category
        };
      } else {
        acc[course.instructorId].totalRating += course.rating || 0;
        acc[course.instructorId].courseCount += 1;
        acc[course.instructorId].totalStudents += studentCount;
        acc[course.instructorId].courses.push(course);
        // If instructor teaches multiple categories, show "Multiple Categories"
        if (acc[course.instructorId].category !== course.category) {
          acc[course.instructorId].category = 'Multiple Categories';
        }
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

  // Add these helper functions after getTopInstructors
  const getRecommendationSections = () => {
    if (!courses) return [];

    // Get courses by category
    const coursesByCategory = courses.reduce((acc: any, course) => {
      if (!course.category) return acc;
      if (!acc[course.category]) {
        acc[course.category] = [];
      }
      acc[course.category].push(course);
      return acc;
    }, {});

    // Sort courses within each category by rating
    Object.keys(coursesByCategory).forEach(category => {
      coursesByCategory[category].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    });

    // Create sections
    return Object.entries(coursesByCategory)
      .map(([category, courses]: [string, any]) => ({
        title: `Top ${category} Courses`,
        description: `Highest rated courses in ${category}`,
        courses: courses.slice(0, 4), // Show top 4 courses per category
        icon: category.toLowerCase().includes('web') ? '🌐' :
              category.toLowerCase().includes('data') ? '📊' :
              category.toLowerCase().includes('mobile') ? '📱' :
              category.toLowerCase().includes('design') ? '🎨' :
              '📚'
      }))
      .filter(section => section.courses.length > 0);
  };

  const getTrendingSections = () => {
    if (!courses) return [];

    // Get most enrolled courses
    const trendingCourses = [...courses]
      .sort((a, b) => {
        const aStudents = Array.isArray(a.students) ? a.students.length : (a.students || a.enrollmentCount || 0);
        const bStudents = Array.isArray(b.students) ? b.students.length : (b.students || b.enrollmentCount || 0);
        return bStudents - aStudents;
      })
      .slice(0, 8); // Show top 8 trending courses

    return [
      {
        title: "Trending Now",
        description: "Most popular courses among our students",
        courses: trendingCourses,
        icon: "🔥"
      }
    ];
  };

  // Get filtered courses based on active tab
  const getFilteredCourses = () => {
    switch (activeTab) {
      case 'recommended':
      case 'trending':
        return courses || [];
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

  const handleViewInstructorCourses = (instructor: any) => {
    setActiveTab('all-courses');
    // Filter courses by instructor name
    const instructorCourses = courses?.filter(course => course.instructor === instructor.name) || [];
    setFilteredCourses(instructorCourses);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setFilteredCourses([]); // Clear filtered courses when changing tabs
  };

  // Render instructor cards
  const renderInstructorView = () => {
    const topInstructors = getTopInstructors();

    return (
      <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {topInstructors.map((instructor: any, index: number) => (
            <Card 
              key={instructor.instructorId} 
              className="group overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-0">
                {/* Header Section with Gradient */}
                <div className="relative h-28 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 group-hover:from-primary/20 group-hover:via-primary/10 group-hover:to-primary/20 transition-all duration-500">
                  <div className="absolute -bottom-8 left-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-white shadow-lg flex items-center justify-center border-2 border-white overflow-hidden transform group-hover:scale-110 transition-transform duration-300">
                        {instructor.profilePicture ? (
                          <img 
                            src={instructor.profilePicture} 
                            alt={instructor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-primary">
                            {instructor.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="px-6 pt-12 pb-5">
                  <div className="space-y-4">
                    {/* Instructor Info */}
                    <div>
                      <h3 className="font-semibold text-base text-gray-900 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                        {instructor.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse" />
                        <span>{instructor.category}</span>
                      </div>
                    </div>

                    {/* Stats Grid with Hover Effects */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-primary/5 rounded-lg px-3 py-2 text-center group-hover:bg-primary/10 transition-colors duration-300">
                        <div className="text-base font-bold text-primary transform group-hover:scale-110 transition-transform duration-300">
                          {instructor.totalStudents.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="bg-primary/5 rounded-lg px-3 py-2 text-center group-hover:bg-primary/10 transition-colors duration-300">
                        <div className="text-base font-bold text-primary transform group-hover:scale-110 transition-transform duration-300">
                          {instructor.courseCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Courses</p>
                      </div>
                    </div>

                    {/* Rating Section with Animation */}
                    <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-all duration-300">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 transform group-hover:rotate-12 transition-transform duration-300" />
                        <div>
                          <span className="font-bold text-sm">{instructor.averageRating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground ml-1">rating</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-white text-[10px] px-1.5 py-0.5 group-hover:bg-primary/5 transition-colors duration-300">
                        Top Rated
                      </Badge>
                    </div>

                    {/* Course Preview with Hover Effect */}
                    {instructor.courses.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-medium text-muted-foreground">Popular Course</h4>
                        <div className="bg-muted/20 rounded-lg p-2.5 group-hover:bg-primary/5 transition-all duration-300 transform group-hover:translate-x-1">
                          <h5 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors duration-300">
                            {instructor.courses[0].title}
                          </h5>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {instructor.courses[0].description}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Button with Hover Animation */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full border-primary/20 text-primary hover:bg-primary/5 hover:text-primary group-hover:border-primary transition-all duration-300 transform hover:scale-[1.02]"
                      onClick={() => handleViewInstructorCourses(instructor)}
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-1.5 transform group-hover:rotate-12 transition-transform duration-300" />
                      View All Courses
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Instructors Message with Animation */}
        {topInstructors.length === 0 && (
          <div className="text-center py-12 animate-fadeIn">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30 animate-pulse" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Instructors Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't find any instructors matching your criteria.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Update the renderCourseSections function with improved card UI
  const renderCourseSections = (sections: any[]) => {
    return (
      <div className="space-y-12">
        {sections.map((section, index) => (
          <section key={index}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full">
                <span className="text-xl">{section.icon}</span>
                <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
              </div>
              <div className="h-[1px] flex-1 bg-gray-200" />
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {section.courses.map((course: any) => {
                const isEnrolled = enrolledCourses?.some(ec => ec._id === course._id);
                const enrollmentStatus = enrolledCourses?.find(ec => ec._id === course._id)?.status;
                
                return (
                  <Card 
                    key={course._id} 
                    className={cn(
                      "group relative overflow-hidden bg-white border-0",
                      "shadow-sm hover:shadow-[0_4px_20px_rgb(0,0,0,0.1)] transition-all duration-300"
                    )}
                  >
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img 
                        src={course.image} 
                        alt={course.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      
                      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5 items-end">
                        {isEnrolled && (
                          <div className="bg-white/90 backdrop-blur-sm text-primary text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            {enrollmentStatus === 'completed' ? (
                              <>
                                <Check className="h-3 w-3" />
                                Completed
                              </>
                            ) : enrollmentStatus === 'started' ? (
                              <>
                                <Play className="h-3 w-3" />
                                In Progress
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3" />
                                Enrolled
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5">
                        {course.level && (
                          <Badge 
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5",
                              course.level === "Beginner" ? "bg-green-500/90 text-white" :
                              course.level === "Intermediate" ? "bg-yellow-500/90 text-white" :
                              "bg-red-500/90 text-white"
                            )}
                          >
                            {course.level}
                          </Badge>
                        )}
                        {course.rating >= 4.5 && (
                          <div className="bg-yellow-500/90 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Top Rated
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                              <span className="font-medium">{course.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span>
                                {Array.isArray(course.students) 
                                  ? course.students.length 
                                  : (course.students || course.enrollmentCount || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {course.instructor && (
                          <div className="flex items-center gap-2 py-2 border-t">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {course.instructor.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">
                                {course.instructor}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Instructor
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="default"
                          size="sm"
                          className={cn(
                            "w-full font-medium text-xs",
                            isEnrolled 
                              ? "bg-primary text-white hover:bg-primary/90"
                              : "bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary"
                          )}
                          onClick={() => handleCourseClick(course._id)}
                        >
                          {isEnrolled ? (
                            enrollmentStatus === 'completed' ? 'View Course' :
                            enrollmentStatus === 'started' ? 'Continue Learning' :
                            'Go to Course'
                          ) : (
                            'Learn More'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
          </section>
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
          <CourseTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'top-instructors' ? (
            renderInstructorView()
          ) : activeTab === 'recommended' ? (
            renderCourseSections(getRecommendationSections())
          ) : activeTab === 'trending' ? (
            renderCourseSections(getTrendingSections())
          ) : (
            <>
              {filteredCourses.length > 0 && (
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Showing courses by {filteredCourses[0]?.instructor}
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setFilteredCourses([])}
                    className="text-sm"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            <FilterableCoursesSection 
                courses={filteredCourses.length > 0 ? filteredCourses : getFilteredCourses()} 
              onCourseClick={handleCourseClick}
              onEnrollClick={handleEnrollClick}
              onStartClick={handleStartClick}
              onResumeClick={handleResumeClick}
              isExploreView={true}
              hideFilters={activeTab !== 'all-courses'}
              activeTab={activeTab}
              enrolledCourses={enrolledCourses || []}
            />
            </>
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
                    onClick={() => window.location.href = "mailto:courses@trizenventures.com?subject=Course Request"}
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
