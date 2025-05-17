
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InternshipCard from '@/components/InternshipCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Briefcase, Users, MapPin } from 'lucide-react';

const internships = [
  {
    id: '1',
    title: 'AI Research Intern',
    department: 'Research & Development',
    location: 'Worldwide',
    type: 'remote' as const,
    description: 'Join our AI research team to work on cutting-edge machine learning models and algorithms. You\'ll collaborate with experienced researchers to develop innovative solutions for our educational platform.',
    requirements: [
      'Currently pursuing a degree in Computer Science, AI, or a related field',
      'Strong understanding of machine learning algorithms and frameworks',
      'Experience with Python and common ML libraries (TensorFlow, PyTorch)',
      'Excellent analytical and problem-solving skills',
      'Ability to work independently and as part of a team'
    ],
    applyLink: '/careers/apply/ai-intern'
  },
  {
    id: '2',
    title: 'Content Writer Intern',
    department: 'Content & Marketing',
    location: 'Worldwide',
    type: 'remote' as const,
    description: 'Help create engaging, informative content for our educational platform. You\'ll work with subject matter experts to develop course materials, blog posts, and other educational content.',
    requirements: [
      'Currently pursuing a degree in English, Communications, Journalism, or a related field',
      'Excellent writing and editing skills',
      'Ability to distill complex topics into clear, accessible content',
      'Detail-oriented with strong research abilities',
      'Interest in education and technology'
    ],
    applyLink: '/careers/apply/content-writer'
  },
  {
    id: '3',
    title: 'UX/UI Design Intern',
    department: 'Product & Design',
    location: 'San Francisco, CA',
    type: 'hybrid' as const,
    description: 'Work with our design team to create beautiful, intuitive user interfaces for our educational platform. You\'ll participate in user research, wireframing, and prototyping.',
    requirements: [
      'Currently pursuing a degree in Design, HCI, or a related field',
      'Portfolio demonstrating UX/UI design projects',
      'Proficiency with design tools like Figma or Adobe XD',
      'Understanding of user-centered design principles',
      'Strong visual design skills'
    ],
    applyLink: '/careers/apply/design-intern'
  }
];

const Careers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all-locations');
  const [typeFilter, setTypeFilter] = useState('all-types');

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          internship.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          internship.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'all-locations' || internship.location.includes(locationFilter);
    const matchesType = typeFilter === 'all-types' || internship.type === typeFilter;
    
    return matchesSearch && matchesLocation && matchesType;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">Join Our Team</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Help us transform education through technology and make a positive impact on learners worldwide.
              </p>
            </div>
          </div>
        </section>
        
        {/* Values Section */}
        <section className="py-16 bg-white">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                At Trizen, we're guided by these core principles that shape our culture and work environment.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg text-center">
                <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Collaborative Innovation</h3>
                <p className="text-muted-foreground">We believe the best ideas come from diverse perspectives working together.</p>
              </div>
              
              <div className="bg-background p-6 rounded-lg text-center">
                <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Growth Mindset</h3>
                <p className="text-muted-foreground">We're committed to continuous learning, both for our users and our team.</p>
              </div>
              
              <div className="bg-background p-6 rounded-lg text-center">
                <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Global Impact</h3>
                <p className="text-muted-foreground">We're building solutions that make quality education accessible worldwide.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Internships Section */}
        <section className="py-16 bg-gray-50" id="internships">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Available Internships</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Launch your career with an internship at Trizen. Gain valuable experience and make a real impact.
              </p>
            </div>
            
            {/* Filters */}
            <div className="max-w-4xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search positions..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="md:col-span-3">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-locations">All Locations</SelectItem>
                    <SelectItem value="Worldwide">Worldwide</SelectItem>
                    <SelectItem value="San Francisco">San Francisco, CA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-types">All Types</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="on-site">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Internship Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {filteredInternships.length > 0 ? (
                filteredInternships.map((internship) => (
                  <InternshipCard 
                    key={internship.id}
                    title={internship.title}
                    department={internship.department}
                    location={internship.location}
                    type={internship.type}
                    description={internship.description}
                    requirements={internship.requirements}
                    applyLink={internship.applyLink}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No internships match your filters. Please try different criteria.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm('');
                      setLocationFilter('all-locations');
                      setTypeFilter('all-types');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Application Process Section */}
        <section className="py-16">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Application Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Here's what you can expect when applying for a position at Trizen.
              </p>
            </div>
            
            <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-4 md:gap-8">
              <div className="text-center">
                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="font-semibold mt-4 mb-2">Application</h3>
                <p className="text-sm text-muted-foreground">Submit your resume and cover letter through our online portal.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="font-semibold mt-4 mb-2">Initial Review</h3>
                <p className="text-sm text-muted-foreground">Our team reviews your application and evaluates your qualifications.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="font-semibold mt-4 mb-2">Interviews</h3>
                <p className="text-sm text-muted-foreground">Selected candidates participate in multiple rounds of interviews.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold text-xl">4</span>
                </div>
                <h3 className="font-semibold mt-4 mb-2">Offer</h3>
                <p className="text-sm text-muted-foreground">Successful candidates receive an offer to join our team.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Shape the Future?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Explore open roles and take the first step in your journey with Trizen.
            </p>
            <Button asChild>
              <a href="#internships">Explore Internships</a>
            </Button>
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
};

export default Careers;
