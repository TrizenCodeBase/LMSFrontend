import { useState } from "react";
import { ChevronLeft, ChevronRight, Linkedin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    id: 1,
    name: "Spoorthi Sameera Varada",
    education: "B.Tech Final Year",
    role: "AI Intern at Cognitbotz Solutions",
    content:
      "The ML course from Trizen Learning provides a strong foundation in machine learning with clear and practical explanations. The hands-on projects helped me overcome my fear of ML and boosted my confidence. The instructors were knowledgeable and supportive throughout the course. I highly recommend it to anyone starting their ML journey.",
    image: "/spoorthi.jpeg", // Replace with actual image path
    linkedin: "https://www.linkedin.com/in/spoorthi-sameera-209721257/", // Replace with actual URL
  },
  {
    id: 2,
    name: "Vishakha Deshmukh",
    education: "MBA",
    role: "Software Engineer at Kognito AI",
    content:
      "Working with the Trizen team and mentors was an enriching and rewarding experience. The hands-on projects, along with continuous support and insightful guidance, helped me strengthen my skills in machine learning and deep learning. The supportive environment played a key role in boosting my confidence and preparing me to take on real-world AI challenges with clarity and conviction.",
    image: "/vishaka.jpeg", // Replace with actual image path
    linkedin: "https://www.linkedin.com/in/vishakha-deshmukh-a97261264/", // Replace with actual URL
  },
];

const TestimonialsCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section className="py-12">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-3">What Our Students Say</h2>
        </div>

        <div className="relative max-w-4xl mx-auto px-4">
          <button
            onClick={goToPrev}
            className="absolute top-1/2 -left-4 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute top-1/2 -right-4 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Image */}
                <img
                  src={activeTestimonial.image}
                  alt={activeTestimonial.name}
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />

                {/* Content */}
                <blockquote className="text-base italic text-gray-700 mb-4">
                  "{activeTestimonial.content}"
                </blockquote>

                {/* Name and Role */}
                <div className="mt-3">
                  <p className="font-semibold text-sm">{activeTestimonial.name}</p>
                  <p className="text-xs text-gray-500">{activeTestimonial.education}</p>
                  <p className="text-xs text-gray-500">{activeTestimonial.role}</p>

                  {/* LinkedIn Icon */}
                  <a
                    href={activeTestimonial.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center mt-2 text-blue-600 hover:text-blue-800"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 w-3 rounded-full ${
                  activeIndex === index ? "bg-primary" : "bg-gray-300"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <h3 className="text-lg font-semibold mb-3">Join Our Success Stories</h3>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
