import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import CourseCard from "./CourseCard";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/services/courseService";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { Star, Users } from "lucide-react";

interface FilterableCoursesSectionProps {
  courses: Course[];
  onCourseClick: (courseId: string, status?: string) => void;
  onEnrollClick: (courseId: string) => void;
  onStartClick?: (courseId: string) => void;
  onResumeClick?: (courseId: string) => void;
  isExploreView?: boolean;
  onGoToMyCourses?: () => void;
  hideEnrollButton?: boolean;
  hideFilters?: boolean;
  activeTab?: string;
  isHomePage?: boolean;
  enrolledCourses?: Course[];
}

// Extended course type with additional UI-specific properties
interface ExtendedCourse extends Course {
  instructorAvatar?: string;
  instructorTitle?: string;
  tags?: string[];
  isTrending?: boolean;
  isNew?: boolean;
  isTopRated?: boolean;
  lastUpdated?: string;
  totalLessons: number;
  enrollmentCount: number;
}

// Course categories with view types
const categories = [
  { id: "all", name: "All", type: "category" },
  // { id: "recommended", name: "Recommended", type: "view" }, 
  { id: "Web Development", name: "Web Development", type: "category" },
  { id: "Mobile Development", name: "Mobile Development", type: "category" },
  { id: "Data Science", name: "Data Science", type: "category" },
  { id: "Machine Learning", name: "Machine Learning", type: "category" },
  { id: "Cloud Computing", name: "Cloud Computing", type: "category" },
  { id: "DevOps", name: "DevOps", type: "category" },
  { id: "Cybersecurity", name: "Cybersecurity", type: "category" },
  { id: "Blockchain", name: "Blockchain", type: "category" },
  { id: "Design", name: "Design", type: "category" },
  { id: "Digital Marketing", name: "Digital Marketing", type: "category" }
];

const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const languages = [
  "All Languages",
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Kannada",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Punjabi"
];

const FilterableCoursesSection = ({ 
  courses, 
  onCourseClick,
  onEnrollClick,
  onStartClick,
  onResumeClick,
  isExploreView = false,
  onGoToMyCourses,
  hideEnrollButton = false,
  hideFilters = false,
  activeTab,
  isHomePage = false,
  enrolledCourses = []
}: FilterableCoursesSectionProps) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const { user } = useAuth();

  // Function to get recommended courses based on user's enrolled courses
  const getRecommendedCourses = (allCourses: Course[]) => {
    if (!user?.enrolledCourses?.length) return allCourses;

    // Get categories of enrolled courses
    const userCategories = user.enrolledCourses
      .map(course => course.category)
      .filter(Boolean);

    // Filter courses in same categories but not enrolled
    return allCourses.filter(course => 
      userCategories.includes(course.category) && 
      !user.enrolledCourses.find(ec => ec._id === course._id)
    );
  };

  // Function to get trending courses based on enrollment count
  const getTrendingCourses = (allCourses: Course[]) => {
    return [...allCourses]
      .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      .slice(0, 8); // Show top 8 trending courses
  };

  // Function to get top instructors based on course reviews
  const getTopInstructors = (allCourses: Course[]) => {
    const instructorStats = allCourses.reduce((acc: any, course) => {
      if (!course.instructor) return acc;
      
      const courseStudents = course.students || course.enrollmentCount || 0;
      
      if (!acc[course.instructor]) {
        acc[course.instructor] = {
          name: course.instructor,
          totalRating: course.rating || 0,
          courseCount: 1,
          totalStudents: courseStudents,
          courses: [course]
        };
      } else {
        acc[course.instructor].totalRating += course.rating || 0;
        acc[course.instructor].courseCount += 1;
        acc[course.instructor].totalStudents += courseStudents;
        acc[course.instructor].courses.push(course);
      }
      return acc;
    }, {});

    // Convert to array and sort by average rating
    return Object.values(instructorStats)
      .map((instructor: any) => ({
        ...instructor,
        averageRating: instructor.totalRating / instructor.courseCount,
        totalStudents: instructor.totalStudents || 0
      }))
      .sort((a: any, b: any) => b.averageRating - a.averageRating);
  };

  // Filter courses based on all criteria
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Apply view-specific filtering
    if (activeCategory === "recommended") {
      filtered = getRecommendedCourses(courses);
    } else if (activeCategory === "trending") {
      filtered = getTrendingCourses(courses);
    } else if (activeCategory === "instructors") {
      // For instructors view, we'll handle the display differently
      return filtered;
    } else if (activeCategory !== "all") {
      // Filter by category
      filtered = courses.filter(course => 
        course.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Apply search and other filters
    return filtered.filter(course => {
      const searchMatch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.instructor && course.instructor.toLowerCase().includes(searchQuery.toLowerCase()));

      const levelMatch = selectedLevel === "All Levels" || course.level === selectedLevel;
      const languageMatch = selectedLanguage === "All Languages" || 
        (course.language && course.language === selectedLanguage);

      return searchMatch && levelMatch && languageMatch;
    });
  }, [courses, activeCategory, searchQuery, selectedLevel, selectedLanguage, user]);

  // Count active filters
  const activeFilterCount = hideFilters ? 0 : [
    activeCategory !== "all",
    selectedLevel !== "All Levels",
    selectedLanguage !== "All Languages"
  ].filter(Boolean).length;

  const clearFilters = () => {
    setActiveCategory("all");
    setSelectedLevel("All Levels");
    setSelectedLanguage("All Languages");
    setSearchQuery("");
  };

  // Render instructor cards
  const renderInstructorCards = () => {
    const topInstructors = getTopInstructors(courses);

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
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {instructor.totalStudents.toLocaleString()} students enrolled
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">{instructor.averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">average rating</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Function to get enrollment status for a course
  const getEnrollmentStatus = (courseId: string) => {
    const enrolledCourse = enrolledCourses.find(ec => ec._id === courseId);
    return enrolledCourse?.status || enrolledCourse?.enrollmentStatus;
  };

  return (
    <section id="courses-section" className="min-h-screen bg-gradient-to-b from-[#F9FAFC] to-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideFilters && (
          <>
            {/* Search and Filters Section */}
            <div className="mb-8 space-y-6 bg-[#F4F2FA] p-6 rounded-xl shadow-[0_4px_12px_rgba(75,63,114,0.05)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B3F72]" />
                  <Input 
                    placeholder="Search courses..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-11 w-full bg-white shadow-[0_2px_8px_rgba(75,63,114,0.08)] hover:shadow-[0_4px_12px_rgba(75,63,114,0.12)] transition-all duration-300 border-[#E0DFF5] focus:border-[#4B3F72] focus:ring-[#4B3F72]/20 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Level Filter */}
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="h-11 w-[140px] bg-white shadow-[0_2px_8px_rgba(75,63,114,0.08)] hover:shadow-[0_4px_12px_rgba(75,63,114,0.12)] transition-all duration-300 border-[#E0DFF5] rounded-xl">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-[#E0DFF5] shadow-[0_8px_16px_rgba(75,63,114,0.12)]">
                      {levels.map(level => (
                        <SelectItem 
                          key={level} 
                          value={level}
                          className="cursor-pointer hover:bg-[#F3F1FB] focus:bg-[#F3F1FB] transition-colors duration-200"
                        >
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Language Filter */}
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="h-11 w-[140px] bg-white shadow-[0_2px_8px_rgba(75,63,114,0.08)] hover:shadow-[0_4px_12px_rgba(75,63,114,0.12)] transition-all duration-300 border-[#E0DFF5] rounded-xl">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-[#E0DFF5] shadow-[0_8px_16px_rgba(75,63,114,0.12)]">
                      {languages.map(language => (
                        <SelectItem 
                          key={language} 
                          value={language}
                          className="cursor-pointer hover:bg-[#F3F1FB] focus:bg-[#F3F1FB] transition-colors duration-200"
                        >
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-11 px-4 text-[#4B3F72] border-[#E0DFF5] shadow-[0_2px_8px_rgba(75,63,114,0.08)] hover:shadow-[0_4px_12px_rgba(75,63,114,0.12)] hover:bg-[#F3F1FB] hover:border-[#4B3F72] transition-all duration-300 rounded-xl"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {categories.map(category => (
                  <Badge 
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    className={cn(
                      "text-sm py-2 px-4 cursor-pointer transition-all duration-300 rounded-xl",
                      activeCategory === category.id 
                        ? "bg-[#4B3F72] text-white shadow-[0_4px_12px_rgba(75,63,114,0.2)] hover:shadow-[0_6px_16px_rgba(75,63,114,0.25)] translate-y-0 hover:-translate-y-0.5" 
                        : "border-[#DAD4EC] text-[#4B3F72] hover:bg-[#F3F1FB] hover:border-[#4B3F72] bg-white shadow-[0_2px_8px_rgba(75,63,114,0.08)] hover:shadow-[0_4px_12px_rgba(75,63,114,0.12)]"
                    )}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      
        {activeCategory === "instructors" ? (
          renderInstructorCards()
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E6E3F1] shadow-[0_4px_12px_rgba(75,63,114,0.08)]">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-[#4B3F72] mb-2">No Courses Found</h3>
              <p className="text-[#5F5F6E] mb-6">We couldn't find any courses matching your criteria. Try adjusting your filters or search terms.</p>
              {!hideFilters && activeFilterCount > 0 && (
                <Button 
                  variant="outline"
                  onClick={clearFilters}
                  className="text-[#4B3F72] border-[#E0DFF5] shadow-[0_2px_8px_rgba(75,63,114,0.08)] hover:shadow-[0_4px_12px_rgba(75,63,114,0.12)] hover:bg-[#F3F1FB] transition-all duration-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6 sm:gap-8 bg-[#F8F6FB] p-8 rounded-xl shadow-[0_4px_16px_rgba(75,63,114,0.06)]",
            hideFilters 
              ? "grid-cols-1" 
              : "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 max-w-[1400px] mx-auto"
          )}>
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourses?.some(ec => ec._id === course._id);
              const enrolledCourse = enrolledCourses?.find(ec => ec._id === course._id);
              const enrollmentStatus = enrolledCourse?.status || enrolledCourse?.enrollmentStatus;
              const hasStarted = enrollmentStatus === 'started';
              
              return (
                <div 
                  key={course._id}
                  className="group w-full"
                >
                  <div className="transform transition-all duration-300 group-hover:-translate-y-1 w-full shadow-[0_4px_12px_rgba(75,63,114,0.08)] group-hover:shadow-[0_8px_24px_rgba(75,63,114,0.12)]">
                    <CourseCard 
                      id={course._id}
                      title={course.title}
                      description={course.description}
                      image={course.image}
                      duration={course.duration}
                      rating={course.rating || 0}
                      totalRatings={course.totalRatings || 0}
                      students={course.students || course.enrollmentCount || 0}
                      level={course.level || "Beginner"}
                      language={course.language}
                      instructor={course.instructor}
                      courseUrl={course.courseUrl}
                      onClick={() => onCourseClick(course._id)}
                      onEnrollClick={!isEnrolled ? () => onEnrollClick(course._id) : undefined}
                      onStartClick={isEnrolled && !hasStarted ? () => onStartClick(course._id) : undefined}
                      onResumeClick={isEnrolled && hasStarted ? () => onResumeClick(course._id) : undefined}
                      progress={isEnrolled ? (enrolledCourse?.progress || 0) : undefined}
                      enrollmentStatus={isEnrolled ? enrollmentStatus : undefined}
                      completedDays={isEnrolled ? enrolledCourse?.completedDays : undefined}
                      roadmap={course.roadmap}
                      hideEnrollButton={hideEnrollButton}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FilterableCoursesSection;
