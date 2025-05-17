
import { Button } from "@/components/ui/button";
import CourseCard from "./CourseCard";

const courseData = [
  {
    id: "1", // Changed from number to string
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    title: "Complete Web Development Bootcamp",
    description: "Learn HTML, CSS, JavaScript, React and Node.js from scratch with real-world projects",
    duration: "42 hours",
    rating: 4.8,
    students: 12453,
    level: "Beginner" as const,
  },
  {
    id: "2", // Changed from number to string
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    title: "Python for Data Science & Machine Learning",
    description: "Master Python and dive into data analysis, visualization, and machine learning algorithms",
    duration: "38 hours",
    rating: 4.9,
    students: 8745,
    level: "Intermediate" as const,
  },
  {
    id: "3", // Changed from number to string
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    title: "UI/UX Design Masterclass",
    description: "Create stunning user interfaces and enhance user experience with industry-standard tools",
    duration: "29 hours",
    rating: 4.7,
    students: 5287,
    level: "Intermediate" as const,
  },
  {
    id: "4", // Changed from number to string
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    title: "Advanced Cloud Architecture",
    description: "Design scalable, secure, and resilient cloud solutions with AWS, Azure, and Google Cloud",
    duration: "35 hours",
    rating: 4.9,
    students: 3125,
    level: "Advanced" as const,
  },
  {
    id: "5", // Changed from number to string
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile apps for iOS and Android using React Native",
    duration: "31 hours",
    rating: 4.6,
    students: 4815,
    level: "Intermediate" as const,
  },
  {
    id: "6", // Changed from number to string
    image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    title: "Cybersecurity Fundamentals",
    description: "Learn essential cybersecurity concepts, tools, and practices to protect digital assets",
    duration: "27 hours",
    rating: 4.8,
    students: 6329,
    level: "Beginner" as const,
  },
];

const CoursePreview = () => {
  return (
    <section id="courses-section" className="section-padding">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold mb-4">Explore Our Top Courses</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover our most popular courses taught by industry experts and designed for real-world applications
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courseData.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <Button size="lg" variant="outline" className="px-8">
          View All Courses
        </Button>
      </div>
    </section>
  );
};

export default CoursePreview;
