import { Button } from "@/components/ui/button";
import { LayoutGrid, BarChart, Zap } from "lucide-react";

const CorporateTrainingSection = () => {
  const features = [
    {
      icon: LayoutGrid,
      title: "Customized Team Training",
      description: "Tailored programs designed specifically for your team's needs"
    },
    {
      icon: Zap,
      title: "LMS Integration",
      description: "Seamlessly integrate with your existing learning management system"
    },
    {
      icon: BarChart,
      title: "Progress Tracking",
      description: "Monitor team performance and learning outcomes"
    }
  ];

  return (
    <section className="py-20 bg-[#3B2D88]">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-white">
              Corporate & Institutional Training
            </h2>
            <p className="text-xl text-white/90 mb-12">
              Invest in your team's growth with customized training programs tailored to your organization's specific needs and goals.
            </p>
            
            <div className="space-y-8 mb-12">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="bg-[#4C3E9A]/20 p-3 rounded-xl">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-white/80">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              size="lg" 
              className="bg-white text-[#3B2D88] hover:bg-white/90 hover:text-[#2A1D77]"
            >
              Upskill Your Team →
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-2xl transition-all duration-300"></div>
            <img 
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
              alt="Corporate training session" 
              className="w-full aspect-[4/3] object-cover rounded-2xl shadow-xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CorporateTrainingSection;
