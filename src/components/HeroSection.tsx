
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToCourses = () => {
    const coursesSection = document.getElementById('courses-section');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 to-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80" 
          alt="Online learning background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-black/70"></div>
      </div>
      
      {/* Content */}
      <div className="section-padding relative z-10 text-center max-w-4xl mx-auto py-20">
        <div className="space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
            Learn. Upgrade. <span className="gradient-text animate-pulse">Succeed.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
            Access high-quality training videos & live classes anytime. Designed for beginners and professionals alike.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-md px-8 py-6 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
              onClick={scrollToCourses}
            >
              Browse Courses
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-md px-8 py-6 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
              onClick={scrollToCourses}
            >
              Get Certified
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-md px-8 py-6 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
              onClick={() => navigate('/not-found-page')}
            >
              Partner with Us
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10"></div>
      
      {/* Subtle Animated Gradient */}
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-2/3 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
    </section>
  );
};

export default HeroSection;
