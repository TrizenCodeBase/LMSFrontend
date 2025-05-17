
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CertificationSection = () => {
  // Function to scroll to a specific section by its ID
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 bg-blue-50">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Get Certified with Trizen</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Boost your career with our industry-recognized certifications. Our programs are designed to help you stand out in the job market and demonstrate your expertise.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
          <Button 
            size="lg" 
            className="px-8"
            onClick={() => scrollToSection("courses-section")}
          >
            Start Learning
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8"
            onClick={() => scrollToSection("events-section")}
          >
            Join Webinar
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CertificationSection;
