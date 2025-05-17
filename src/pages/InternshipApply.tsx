
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload } from 'lucide-react';

const internshipPositions = {
  'ai-intern': {
    title: 'AI Research Intern',
    description: 'Join our AI research team to work on cutting-edge machine learning models and algorithms.'
  },
  'content-writer': {
    title: 'Content Writer Intern',
    description: 'Help create engaging, informative content for our educational platform.'
  },
  'design-intern': {
    title: 'UX/UI Design Intern',
    description: 'Work with our design team to create beautiful, intuitive user interfaces.'
  }
};

const InternshipApply = () => {
  const { position } = useParams<{ position: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    education: '',
    experience: '',
    coverLetter: '',
    resume: null as File | null,
    portfolio: null as File | null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const internshipInfo = position && position in internshipPositions 
    ? internshipPositions[position as keyof typeof internshipPositions] 
    : null;
  
  if (!internshipInfo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container max-w-3xl mx-auto px-4 py-16">
          <Card className="text-center p-8">
            <CardContent>
              <h1 className="text-2xl font-bold mb-4">Position Not Found</h1>
              <p className="mb-8">The internship position you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/careers')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Careers
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'resume' | 'portfolio') => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: e.target.files![0]
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real app, you would submit this data to your API
    // This is just a simulation
    setTimeout(() => {
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll review your application and be in touch soon.",
      });
      
      setIsSubmitting(false);
      navigate('/careers');
    }, 1500);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        <div className="container max-w-3xl mx-auto px-4 py-12">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/careers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Careers
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>{internshipInfo.title}</CardTitle>
              <CardDescription>{internshipInfo.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input 
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Education & Experience</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="education">Education *</Label>
                    <Textarea 
                      id="education"
                      name="education"
                      placeholder="University, Degree, Major, Graduation Year"
                      value={formData.education}
                      onChange={handleInputChange}
                      required
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Relevant Experience</Label>
                    <Textarea 
                      id="experience"
                      name="experience"
                      placeholder="Briefly describe any relevant work or project experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Application Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="coverLetter">Cover Letter *</Label>
                    <Textarea 
                      id="coverLetter"
                      name="coverLetter"
                      placeholder="Tell us why you're interested in this position and what you'd bring to our team"
                      value={formData.coverLetter}
                      onChange={handleInputChange}
                      required
                      rows={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume/CV *</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="resume"
                        type="file"
                        onChange={(e) => handleFileChange(e, 'resume')}
                        accept=".pdf,.doc,.docx"
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        required
                      />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepted formats: PDF, DOC, DOCX. Max size: 5MB
                    </p>
                  </div>
                  
                  {position === 'design-intern' && (
                    <div className="space-y-2">
                      <Label htmlFor="portfolio">Portfolio Link or File *</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="portfolio"
                          name="portfolio"
                          placeholder="https://your-portfolio-url.com or upload a file"
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default InternshipApply;
