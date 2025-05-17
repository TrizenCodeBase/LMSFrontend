import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useState } from "react";
import axios from '@/lib/axios';
import { useToast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "How are Trizen Training courses delivered?",
    answer: "Our courses are delivered through a combination of on-demand video content, interactive exercises, live sessions with instructors, and hands-on projects. You can access all materials through our learning platform at your own pace."
  },
  {
    question: "Are the certifications industry-recognized?",
    answer: "Yes, our certifications are recognized by leading companies in the tech industry. We work closely with industry partners to ensure our curriculum meets current market demands and standards."
  },
  {
    question: "Do you offer corporate training packages?",
    answer: "Absolutely! We provide customized corporate training solutions tailored to your organization's specific needs. Our enterprise packages include custom learning paths, dedicated support, and detailed progress tracking."
  },
  {
    question: "Is there job placement assistance?",
    answer: "We offer career support services including resume reviews, interview preparation, and access to our employer network. While we don't guarantee placement, many of our graduates have successfully transitioned to new roles in their desired fields."
  }
];

const FAQSection = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/contact-requests', formData);
      
      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible.",
      });
      
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setShowForm(false);
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our training programs and certifications. 
            If you can't find what you're looking for, feel free to reach out to our support team.
          </p>
        </div>

        <div className="grid gap-6 max-w-3xl mx-auto">
          {/* FAQ Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-medium py-4 text-gray-800">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="text-center mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium mb-2">Still have questions?</h3>
              <p className="text-gray-600 mb-4">Our support team is here to help you</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6 text-sm">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a 
                  href="tel:+918639648822" 
                  className="text-primary hover:underline font-medium"
                >
                  +91 863 964 8822
                </a>
              </div>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a 
                  href="mailto:contact@trizenventures.com" 
                  className="text-primary hover:underline font-medium"
                >
                  contact@trizenventures.com
                </a>
              </div>
            </div>

              {!showForm && (
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Contact Support
                </Button>
              )}
            </div>
          </div>

          {/* Contact Form Card */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-sm p-6 relative">
              <button 
                onClick={() => setShowForm(false)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-6 text-center">Contact Support</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-left block">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-left block">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-left block">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      placeholder="What is your question about?"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-left block">
                      How can we help?
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your question or issue..."
                      className="h-32 resize-none"
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
