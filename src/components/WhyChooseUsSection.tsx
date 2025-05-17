import { Users, Code, BookOpen } from "lucide-react";

const WhyChooseUsSection = () => {
  const features = [
    {
      icon: Users,
      title: "Industry-certified instructors",
      description: "Learn from experts with real-world experience in their fields."
    },
    {
      icon: Code,
      title: "Hands-on projects",
      description: "Apply your knowledge with real-world projects to build your portfolio."
    },
    {
      icon: BookOpen,
      title: "Job-oriented curriculum",
      description: "Courses designed with input from hiring managers and industry leaders."
    }
  ];

  return (
    <section className="bg-gray-50 min-h-screen flex items-center justify-center py-16">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Trizen Training</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're committed to your success with a learning experience designed to help you achieve your goals.
          </p>
        </div>

        <div className="flex flex-col space-y-10 md:space-y-14">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col md:flex-row md:items-center items-center text-center md:text-left">
              <div className="bg-purple-50 p-4 rounded-lg mb-4 md:mb-0 md:mr-8 flex items-center justify-center" style={{ width: '72px', height: '72px' }}>
                <feature.icon className="h-8 w-8 text-lms-purple" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
