import { BookOpen, Users, Award, Rocket } from "lucide-react";

const AboutSection = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Self-paced Courses",
      description: "Learn at your own pace with on-demand content",
    },
    {
      icon: Users,
      title: "Live Training",
      description: "Interactive sessions with industry experts",
    },
    {
      icon: Award,
      title: "Certifications",
      description: "Industry-recognized credentials",
    },
    {
      icon: Rocket,
      title: "Workshops",
      description: "Hands-on learning experiences",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-[#352A86] mb-6">
            About Trizen Training
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            At Trizen Training, we're committed to empowering individuals and
            organizations with in-demand skills that drive innovation and
            professional growth. Our cutting-edge curriculum is designed in
            collaboration with industry experts to ensure you're learning what
            matters most in today's job market.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 px-2">
        {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 mb-4 flex items-center justify-center bg-[#ede9fe] rounded-2xl">
                <feature.icon className="w-7 h-7 text-[#352A86]" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-[#1f1f1f]">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-[#352A86] mb-4">
            Courses and Certifications
          </h3>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Explore our comprehensive range of courses designed to help you
            master in-demand skills and advance your career.
          </p>
        </div> */}
      </div>
    </section>
  );
};

export default AboutSection;
