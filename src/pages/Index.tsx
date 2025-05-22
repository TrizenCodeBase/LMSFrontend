import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FilterableCoursesSection from "@/components/FilterableCoursesSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import CorporateTrainingSection from "@/components/CorporateTrainingSection";
import CertificationSection from "@/components/CertificationSection";
import EventsSection from "@/components/EventsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { useAllCourses } from "@/services/courseService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { data: courses } = useAllCourses();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}/details`);
  };
  
  const handleEnrollClick = (courseId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in courses.",
      });
      navigate('/login', { state: { from: `/course/${courseId}` } });
      return;
    }
    
    navigate(`/course/${courseId}/payment`);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <FilterableCoursesSection 
          courses={courses || []} 
          onCourseClick={handleCourseClick}
          onEnrollClick={handleEnrollClick}
          onStartClick={() => {}}
          onResumeClick={() => {}}
          hideEnrollButton={true}
        />
        <WhyChooseUsSection />
        <TestimonialsCarousel />
        <CorporateTrainingSection />
        <CertificationSection />
        <EventsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
