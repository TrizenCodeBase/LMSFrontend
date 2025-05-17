import { useState } from "react";
import { Button } from "@/components/ui/button";
import CourseCard from "./CourseCard";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/services/courseService";

interface FilterableCoursesSectionProps {
  courses: Course[];
  onCourseClick?: (courseId: string) => void;
  onEnrollClick?: (courseId: string) => void;
  onStartClick?: (courseId: string) => void;
  onResumeClick?: (courseId: string) => void;
}

// Course categories
const categories = [
  { id: "all", name: "All" },
  { id: "Web Development", name: "Web Development" },
  { id: "Mobile Development", name: "Mobile Development" },
  { id: "Data Science", name: "Data Science" },
  { id: "Machine Learning", name: "Machine Learning" },
  { id: "Cloud Computing", name: "Cloud Computing" },
  { id: "DevOps", name: "DevOps" },
  { id: "Cybersecurity", name: "Cybersecurity" },
  { id: "Blockchain", name: "Blockchain" },
  { id: "Design", name: "Design" },
  { id: "Digital Marketing", name: "Digital Marketing" }
];

const FilterableCoursesSection = ({ 
  courses, 
  onCourseClick,
  onEnrollClick,
  onStartClick,
  onResumeClick
}: FilterableCoursesSectionProps) => {
  const [activeCategory, setActiveCategory] = useState("all");

  // Filter courses based on selected category
  const filteredCourses = activeCategory === "all" 
    ? courses 
    : courses.filter(course => {
        // Case-insensitive comparison of categories
        return course.category && course.category.toLowerCase() === activeCategory.toLowerCase();
      });

  return (
    <section id="courses-section" className="section-padding">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold mb-4">Explore Our Top Courses</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover our most popular courses taught by industry experts and designed for real-world applications
        </p>
      </div>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map(category => (
          <Badge 
            key={category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            className={`text-sm py-1 px-3 cursor-pointer ${
              activeCategory === category.id 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-primary/10"
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </Badge>
        ))}
      </div>
      
      {filteredCourses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No courses found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
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
              enrollmentStatus={course.status || course.enrollmentStatus}
              instructor={course.instructor}
              onClick={() => onCourseClick && onCourseClick(course._id)}
              onEnrollClick={onEnrollClick ? () => onEnrollClick(course._id) : undefined}
              onStartClick={onStartClick ? () => onStartClick(course._id) : undefined}
              onResumeClick={onResumeClick ? () => onResumeClick(course._id) : undefined}
            />
          ))}
        </div>
      )}
      
      <div className="mt-12 text-center">
        <Button size="lg" variant="outline" className="px-8">
          View All Courses
        </Button>
      </div>
    </section>
  );
};

export default FilterableCoursesSection;
