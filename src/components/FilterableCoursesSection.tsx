import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import CourseCard from "./CourseCard";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/services/courseService";
import { Input } from "@/components/ui/input";
import { Search, X, SlidersHorizontal, Code, Database, Smartphone, Cloud, Shield, Palette, TrendingUp, Blocks, Megaphone } from "lucide-react";
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

// Course categories with icons
const categories = [
  { id: "all", name: "All", icon: SlidersHorizontal, type: "category" },
  { id: "Web Development", name: "Web Development", icon: Code, type: "category" },
  { id: "Mobile Development", name: "Mobile Development", icon: Smartphone, type: "category" },
  { id: "Data Science", name: "Data Science", icon: Database, type: "category" },
  { id: "Machine Learning", name: "Machine Learning", icon: Database, type: "category" },
  { id: "Cloud Computing", name: "Cloud Computing", icon: Cloud, type: "category" },
  { id: "DevOps", name: "DevOps", icon: Cloud, type: "category" },
  { id: "Cybersecurity", name: "Cybersecurity", icon: Shield, type: "category" },
  { id: "Blockchain", name: "Blockchain", icon: Blocks, type: "category" },
  { id: "Design", name: "Design", icon: Palette, type: "category" },
  { id: "Digital Marketing", name: "Digital Marketing", icon: Megaphone, type: "category" }
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
  const [sortBy, setSortBy] = useState("popular");
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

  // Sort courses based on selected criteria
  const sortCourses = (coursesToSort: Course[]) => {
    switch (sortBy) {
      case "popular":
        return [...coursesToSort].sort((a, b) => (b.students || 0) - (a.students || 0));
      case "rating":
        return [...coursesToSort].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "newest":
        // Using enrollment count as a proxy for newness since createdAt is not available
        return [...coursesToSort].sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
      case "title":
        return [...coursesToSort].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return coursesToSort;
    }
  };

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = filteredCourses;
    return sortCourses(filtered);
  }, [filteredCourses, sortBy]);

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
    <section id="courses-section" className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideFilters && (
          <>
            {/* Enhanced Search and Filters Section */}
            <div className="mb-8 space-y-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Search Bar with Enhanced Design */}
                <div className="relative flex-1 min-w-[300px] group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4B3F72] transition-colors duration-200 group-hover:text-primary" />
                  <Input 
                    placeholder="Search courses by title, description, or instructor..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 w-full border-[#E0DFF5] focus:border-[#4B3F72] focus:ring-[#4B3F72]/20 rounded-xl text-base transition-all duration-200 hover:border-[#4B3F72] focus:shadow-sm"
                  />
                </div>

                {/* Advanced Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-[160px] h-12 border-[#E0DFF5] rounded-xl transition-all duration-200 hover:border-[#4B3F72] focus:shadow-sm">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-[160px] h-12 border-[#E0DFF5] rounded-xl transition-all duration-200 hover:border-[#4B3F72] focus:shadow-sm">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(language => (
                        <SelectItem key={language} value={language}>{language}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] h-12 border-[#E0DFF5] rounded-xl transition-all duration-200 hover:border-[#4B3F72] focus:shadow-sm">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                    </SelectContent>
                  </Select>

                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="h-12 text-[#4B3F72] border-[#E0DFF5] hover:bg-[#F3F1FB] transition-all duration-300 rounded-xl hover:border-[#4B3F72] focus:shadow-sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>

              {/* Category Pills with Enhanced Design */}
              <div className="flex flex-wrap items-center gap-3">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                  <Badge 
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    className={cn(
                        "text-sm py-2.5 px-5 cursor-pointer transition-all duration-300 rounded-xl select-none flex items-center gap-2 hover:scale-105",
                      activeCategory === category.id 
                          ? "bg-[#4B3F72] text-white hover:bg-[#3D3459] shadow-sm" 
                          : "border-[#DAD4EC] text-[#4B3F72] hover:bg-[#F3F1FB] hover:border-[#4B3F72] hover:shadow-sm"
                    )}
                    onClick={() => setActiveCategory(category.id)}
                  >
                      <Icon className="h-4 w-4" />
                    {category.name}
                  </Badge>
                  );
                })}
              </div>
            </div>

            {/* Results Summary */}
            {filteredAndSortedCourses.length > 0 && (
              <div className="mb-6 flex items-center justify-between animate-fadeIn">
                <p className="text-[#4B3F72]">
                  Showing <span className="font-medium">{filteredAndSortedCourses.length}</span> {filteredAndSortedCourses.length === 1 ? 'course' : 'courses'}
                  {activeCategory !== "all" && <span> in <span className="font-medium">{categories.find(c => c.id === activeCategory)?.name}</span></span>}
                </p>
              </div>
            )}
          </>
        )}
      
        {activeCategory === "instructors" ? (
          renderInstructorCards()
        ) : filteredAndSortedCourses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E6E3F1] shadow-sm animate-fadeIn">
            <div className="max-w-md mx-auto px-4">
              <div className="mb-6 w-16 h-16 mx-auto rounded-full bg-[#F3F1FB] flex items-center justify-center">
                <Search className="w-8 h-8 text-[#4B3F72]" />
              </div>
              <h3 className="text-xl font-semibold text-[#4B3F72] mb-2">No Courses Found</h3>
              <p className="text-[#5F5F6E] mb-6">We couldn't find any courses matching your criteria. Try adjusting your filters or search terms.</p>
              {!hideFilters && activeFilterCount > 0 && (
                <Button 
                  variant="outline"
                  onClick={clearFilters}
                  className="text-[#4B3F72] border-[#E0DFF5] hover:bg-[#F3F1FB] transition-all duration-300 hover:border-[#4B3F72] focus:shadow-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={cn(
            "grid gap-8 animate-fadeIn",
            hideFilters 
              ? "grid-cols-1" 
              : "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 max-w-[1600px] mx-auto gap-x-10"
          )}>
            {filteredAndSortedCourses.map((course, index) => {
              const isEnrolled = enrolledCourses?.some(ec => ec._id === course._id);
              const enrolledCourse = enrolledCourses?.find(ec => ec._id === course._id);
              const enrollmentStatus = enrolledCourse?.status || enrolledCourse?.enrollmentStatus;
              const hasStarted = enrollmentStatus === 'started';
              
              // Convert status to allowed type
              const normalizedStatus = enrollmentStatus === 'approved' ? 'enrolled' : 
                                     enrollmentStatus === 'rejected' ? 'pending' : 
                                     enrollmentStatus as 'enrolled' | 'started' | 'completed' | 'pending' | undefined;
              
              return (
                <div 
                  key={course._id}
                  className="group w-full animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-full rounded-xl overflow-hidden">
                    <CourseCard 
                      id={course._id}
                      title={course.title}
                      description={course.description}
                      image={course.image}
                      duration={course.duration}
                      rating={course.rating || 0}
                      totalRatings={course.totalRatings || 0}
                      students={course.students || course.enrollmentCount || 0}
                      level={course.level}
                      language={course.language}
                      instructor={course.instructor}
                      courseUrl={course.courseUrl}
                      onClick={() => onCourseClick(course._id)}
                      onEnrollClick={!isEnrolled ? () => onEnrollClick(course._id) : undefined}
                      onStartClick={isEnrolled && !hasStarted ? () => onStartClick(course._id) : undefined}
                      onResumeClick={isEnrolled && hasStarted ? () => onResumeClick(course._id) : undefined}
                      progress={isEnrolled ? (enrolledCourse?.progress || 0) : undefined}
                      enrollmentStatus={normalizedStatus}
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

