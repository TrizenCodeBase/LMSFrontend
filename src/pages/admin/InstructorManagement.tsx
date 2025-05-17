import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  MessageCircle, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  MoreHorizontal,
  Star,
  Mail,
  Phone,
  MapPin,
  Link,
  Globe,
  Linkedin,
  Twitter,
  Users,
  Clock,
  Calendar,
  Award,
  DollarSign,
  Save,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import axios from '@/lib/axios';

// Types
interface Instructor {
  _id: string;
  name: string;
  email: string;
  instructorProfile: {
    specialty: string;
    experience: number;
    bio?: string;
    phone?: string;
    location?: string;
    avatar?: string;
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      website?: string;
    };
  };
  status: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
  createdAt: string;
  stats?: {
    totalStudents: number;
    totalCourses: number;
    averageRating: number;
    teachingHours: number;
  };
  recentReviews?: Array<{
    student: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price?: number;
  students: number;
  rating: number;
  createdAt: string;
}

// Mock stats and reviews for demonstration
const getMockInstructorStats = (instructorId: string) => {
  return {
    totalStudents: Math.floor(Math.random() * 500) + 100,
    totalCourses: Math.floor(Math.random() * 10) + 1,
    averageRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
    teachingHours: Math.floor(Math.random() * 300) + 50
  };
};

const getMockInstructorReviews = () => {
  return [
    { 
      student: 'Alex P.', 
      rating: 5, 
      comment: 'Excellent teaching style and very knowledgeable!', 
      date: '3 days ago' 
    },
    { 
      student: 'Morgan T.', 
      rating: 4, 
      comment: 'Very helpful and responsive to questions.', 
      date: '1 week ago' 
    }
  ];
};

const InstructorManagement = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCoursesDialogOpen, setIsCoursesDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const [instructorCourses, setInstructorCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [courseUpdates, setCourseUpdates] = useState<{[key: string]: number}>({});
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<Instructor[]>('/api/admin/instructors');
      setInstructors(response.data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch instructors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (instructorId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await axios.put(`/api/admin/instructors/${instructorId}/status`, {
        status: newStatus
      });
      
      toast({
        title: 'Success',
        description: `Instructor ${newStatus} successfully`,
        variant: 'default',
      });
      
      fetchInstructors(); // Refresh the list
    } catch (error) {
      console.error('Error updating instructor status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update instructor status',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (instructor: Instructor) => {
    // Enhance the instructor with mock data for demonstration
    const enhancedInstructor = {
      ...instructor,
      instructorProfile: {
        ...instructor.instructorProfile,
        bio: instructor.instructorProfile.bio || 'Passionate educator specialized in ' + instructor.instructorProfile.specialty,
        phone: instructor.instructorProfile.phone || '+1 (555) 123-4567',
        location: instructor.instructorProfile.location || 'San Francisco, CA',
        socialLinks: instructor.instructorProfile.socialLinks || {
          linkedin: 'https://linkedin.com/in/instructor',
          twitter: 'https://twitter.com/instructor',
          website: 'https://instructor-website.com'
        }
      },
      stats: getMockInstructorStats(instructor._id),
      recentReviews: getMockInstructorReviews()
    };
    
    setSelectedInstructor(enhancedInstructor);
    setIsDetailsDialogOpen(true);
  };

  const handleSendMessage = (instructor: Instructor) => {
    toast({
      title: 'Message Feature',
      description: `Sending message to ${instructor.name} is not implemented yet.`,
      variant: 'default',
    });
  };

  const handleViewCourses = async (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setIsCoursesDialogOpen(true);
    setIsLoadingCourses(true);
    
    try {
      // In a real implementation, fetch from an API endpoint
      // const response = await axios.get(`/api/admin/instructors/${instructor._id}/courses`);
      // setInstructorCourses(response.data);
      
      // Mock data for now
      const mockCourses: Course[] = Array.from({ length: 3 }, (_, i) => ({
        id: `course-${i + 1}-${instructor._id.substring(0, 5)}`,
        title: [`Web Development Masterclass`, `Data Science Fundamentals`, `Mobile App Development`][i % 3],
        description: `A comprehensive course on ${['web development', 'data science', 'mobile app development'][i % 3]}`,
        category: [`Web Development`, `Data Science`, `Mobile Development`][i % 3],
        level: [`Beginner`, `Intermediate`, `Advanced`][i % 3],
        price: [99.99, 149.99, 199.99][i % 3],
        students: Math.floor(Math.random() * 200) + 50,
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
      }));
      
      setInstructorCourses(mockCourses);
      
      // Initialize course updates object with current prices
      const initialUpdates = mockCourses.reduce((acc, course) => {
        acc[course.id] = course.price || 0;
        return acc;
      }, {} as {[key: string]: number});
      
      setCourseUpdates(initialUpdates);
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch instructor courses',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleCourseChange = (courseId: string, price: string) => {
    const numericPrice = parseFloat(price);
    if (!isNaN(numericPrice) && numericPrice >= 0) {
      setCourseUpdates(prev => ({ ...prev, [courseId]: numericPrice }));
    }
  };

  const handleUpdateCoursePrices = async () => {
    setIsUpdatingPrices(true);
    
    try {
      // In a real implementation, send to an API endpoint
      // await axios.post('/api/admin/update-course-prices', {
      //   courses: Object.entries(courseUpdates).map(([id, price]) => ({ id, price }))
      // });
      
      // Update local state to reflect the changes
      setInstructorCourses(prev => 
        prev.map(course => ({
          ...course,
          price: courseUpdates[course.id] || course.price
        }))
      );
      
      toast({
        title: 'Success',
        description: 'Course prices updated successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating course prices:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course prices',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handleToggleActive = (instructor: Instructor, action: 'suspend' | 'reactivate') => {
    setSelectedInstructor(instructor);
    setConfirmAction(action);
    setIsConfirmDialogOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!selectedInstructor) return;
    
    try {
      setInstructors(prev => 
        prev.map(i => 
          i._id === selectedInstructor._id 
            ? { ...i, isActive: confirmAction === 'reactivate' } 
            : i
        )
      );
      
      toast({
        title: 'Success',
        description: `Instructor ${confirmAction === 'suspend' ? 'suspended' : 'reactivated'} successfully`,
        variant: 'default',
      });
    } catch (error) {
      console.error(`Error ${confirmAction}ing instructor:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${confirmAction} instructor`,
        variant: 'destructive',
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setSelectedInstructor(null);
      setConfirmAction('');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>,
      approved: <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>,
      rejected: <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>,
    };
    return variants[status as keyof typeof variants] || status;
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get a profile completion percentage based on available fields
  const getProfileCompletion = (instructor: Instructor | null) => {
    if (!instructor) return 0;
    
    const fields = [
      instructor.name,
      instructor.email,
      instructor.instructorProfile.specialty,
      instructor.instructorProfile.experience,
      instructor.instructorProfile.bio,
      instructor.instructorProfile.phone,
      instructor.instructorProfile.location,
      instructor.instructorProfile.socialLinks?.linkedin,
      instructor.instructorProfile.socialLinks?.twitter,
      instructor.instructorProfile.socialLinks?.website,
    ];
    
    const filledFields = fields.filter(Boolean).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Instructor Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : instructors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No instructor applications found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    instructors.map((instructor) => (
                      <TableRow key={instructor._id}>
                        <TableCell className="font-medium">{instructor.name}</TableCell>
                        <TableCell>{instructor.email}</TableCell>
                        <TableCell>{instructor.instructorProfile.specialty}</TableCell>
                        <TableCell>{instructor.instructorProfile.experience} years</TableCell>
                        <TableCell>{getStatusBadge(instructor.status)}</TableCell>
                        <TableCell>
                          {new Date(instructor.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                          {instructor.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(instructor._id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStatusUpdate(instructor._id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                            
                            {instructor.status !== 'pending' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <MoreHorizontal className="h-4 w-4 mr-1" />
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDetails(instructor)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSendMessage(instructor)}>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Send Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleViewCourses(instructor)}>
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    View Courses
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {instructor.isActive !== false ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleToggleActive(instructor, 'suspend')}
                                      className="text-red-600"
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Suspend Instructor
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleToggleActive(instructor, 'reactivate')}
                                      className="text-green-600"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Reactivate Instructor
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Enhanced Instructor Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Instructor Profile</DialogTitle>
            <DialogDescription>
              Comprehensive instructor information and performance data
            </DialogDescription>
          </DialogHeader>
          
          {selectedInstructor && (
            <Tabs defaultValue="profile">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="stats">Performance</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left column - Basic info and avatar */}
                  <div className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-24 w-24">
                        {selectedInstructor.instructorProfile.avatar ? (
                          <AvatarImage src={selectedInstructor.instructorProfile.avatar} alt={selectedInstructor.name} />
                        ) : (
                          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                            {getInitials(selectedInstructor.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className="text-center">
                        <h3 className="font-semibold text-xl">{selectedInstructor.name}</h3>
                        <p className="text-muted-foreground">Instructor · {selectedInstructor.instructorProfile.specialty}</p>
                      </div>
                      
                      <div className="w-full">
                        <p className="text-sm text-muted-foreground mb-1 flex justify-between">
                          <span>Profile Completion</span>
                          <span>{getProfileCompletion(selectedInstructor)}%</span>
                        </p>
                        <Progress value={getProfileCompletion(selectedInstructor)} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{selectedInstructor.email}</span>
                      </div>
                      
                      {selectedInstructor.instructorProfile.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{selectedInstructor.instructorProfile.phone}</span>
                        </div>
                      )}
                      
                      {selectedInstructor.instructorProfile.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{selectedInstructor.instructorProfile.location}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Status</h4>
                      <div className="flex items-center">
                        {getStatusBadge(selectedInstructor.status)}
                        
                        {selectedInstructor.isActive === false && (
                          <Badge variant="destructive" className="ml-2">Account Suspended</Badge>
                        )}
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground">
                          Registered on {new Date(selectedInstructor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Social links */}
                    {selectedInstructor.instructorProfile.socialLinks && (
                      <div className="space-y-3 pt-2">
                        <h4 className="font-medium text-sm">Social Links</h4>
                        <div className="space-y-2">
                          {selectedInstructor.instructorProfile.socialLinks.linkedin && (
                            <div className="flex items-center">
                              <Linkedin className="h-4 w-4 mr-2 text-muted-foreground" />
                              <a 
                                href={selectedInstructor.instructorProfile.socialLinks.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline"
                              >
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                          
                          {selectedInstructor.instructorProfile.socialLinks.twitter && (
                            <div className="flex items-center">
                              <Twitter className="h-4 w-4 mr-2 text-muted-foreground" />
                              <a 
                                href={selectedInstructor.instructorProfile.socialLinks.twitter} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline"
                              >
                                Twitter Profile
                              </a>
                            </div>
                          )}
                          
                          {selectedInstructor.instructorProfile.socialLinks.website && (
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                              <a 
                                href={selectedInstructor.instructorProfile.socialLinks.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline"
                              >
                                Personal Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Right column - Bio and experience */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">About</h4>
                      <p className="text-sm text-muted-foreground">{selectedInstructor.instructorProfile.bio}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Teaching Experience</h4>
                      <div className="flex items-center space-x-2">
                        <Badge>{selectedInstructor.instructorProfile.experience} years</Badge>
                        <span className="text-sm text-muted-foreground">as {selectedInstructor.instructorProfile.specialty} instructor</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Quick Stats</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg flex flex-col items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary mb-2" />
                          <p className="text-xl font-semibold">{selectedInstructor.stats?.totalCourses || 0}</p>
                          <p className="text-xs text-muted-foreground">Courses</p>
                        </div>
                        <div className="p-4 border rounded-lg flex flex-col items-center justify-center">
                          <Users className="h-5 w-5 text-primary mb-2" />
                          <p className="text-xl font-semibold">{selectedInstructor.stats?.totalStudents || 0}</p>
                          <p className="text-xs text-muted-foreground">Students</p>
                        </div>
                        <div className="p-4 border rounded-lg flex flex-col items-center justify-center">
                          <Star className="h-5 w-5 text-primary mb-2" />
                          <p className="text-xl font-semibold">{selectedInstructor.stats?.averageRating || '0.0'}</p>
                          <p className="text-xs text-muted-foreground">Avg. Rating</p>
                        </div>
                        <div className="p-4 border rounded-lg flex flex-col items-center justify-center">
                          <Clock className="h-5 w-5 text-primary mb-2" />
                          <p className="text-xl font-semibold">{selectedInstructor.stats?.teachingHours || 0}</p>
                          <p className="text-xs text-muted-foreground">Teaching Hours</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Administrative Actions</h4>
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setIsDetailsDialogOpen(false);
                            handleSendMessage(selectedInstructor);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setIsDetailsDialogOpen(false);
                            handleViewCourses(selectedInstructor);
                          }}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Courses
                        </Button>
                        
                        {selectedInstructor.status === 'pending' && (
                          <>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setIsDetailsDialogOpen(false);
                                handleStatusUpdate(selectedInstructor._id, 'approved');
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve Instructor
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setIsDetailsDialogOpen(false);
                                handleStatusUpdate(selectedInstructor._id, 'rejected');
                              }}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Reject Instructor
                            </Button>
                          </>
                        )}
                        
                        {selectedInstructor.status !== 'pending' && (
                          selectedInstructor.isActive !== false ? (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setIsDetailsDialogOpen(false);
                                handleToggleActive(selectedInstructor, 'suspend');
                              }}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Suspend Instructor
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setIsDetailsDialogOpen(false);
                                handleToggleActive(selectedInstructor, 'reactivate');
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Reactivate Instructor
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="stats">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Course Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px] flex items-center justify-center border rounded-lg">
                          <p className="text-muted-foreground">Course statistics chart placeholder</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Student Enrollment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px] flex items-center justify-center border rounded-lg">
                          <p className="text-muted-foreground">Enrollment chart placeholder</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Teaching Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">Total Courses</p>
                            <p className="text-3xl font-bold">{selectedInstructor.stats?.totalCourses || 0}</p>
                          </div>
                          <div>
                            <p className="font-medium">Total Students</p>
                            <p className="text-3xl font-bold">{selectedInstructor.stats?.totalStudents || 0}</p>
                          </div>
                          <div>
                            <p className="font-medium">Teaching Hours</p>
                            <p className="text-3xl font-bold">{selectedInstructor.stats?.teachingHours || 0}</p>
                          </div>
                          <div>
                            <p className="font-medium">Average Rating</p>
                            <p className="text-3xl font-bold flex items-center">
                              {selectedInstructor.stats?.averageRating || '0.0'}
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 ml-1" />
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-lg">Student Reviews</h4>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="font-semibold">{selectedInstructor.stats?.averageRating || '0.0'}</span>
                      <span className="text-muted-foreground ml-1">average rating</span>
                    </div>
                  </div>
                  
                  {selectedInstructor.recentReviews && selectedInstructor.recentReviews.length > 0 ? (
                    <div className="space-y-4">
                      {selectedInstructor.recentReviews.map((review, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback>
                                    {getInitials(review.student)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{review.student}</p>
                                  <p className="text-xs text-muted-foreground">{review.date}</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                                <span>{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-sm">{review.comment}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 border rounded-lg">
                      <p className="text-muted-foreground">No reviews available for this instructor</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'suspend' ? 'Suspend Instructor' : 'Reactivate Instructor'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'suspend'
                ? 'Are you sure you want to suspend this instructor? They will no longer be able to access their account.'
                : 'Are you sure you want to reactivate this instructor? They will regain access to their account.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={confirmAction === 'suspend' ? 'destructive' : 'default'}
              onClick={confirmToggleActive}
            >
              {confirmAction === 'suspend' ? 'Yes, Suspend' : 'Yes, Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Instructor Courses Dialog with Price Management */}
      <Dialog open={isCoursesDialogOpen} onOpenChange={setIsCoursesDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Instructor Courses
              {selectedInstructor && ` - ${selectedInstructor.name}`}
            </DialogTitle>
            <DialogDescription>
              Manage courses and set pricing
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingCourses ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <p>Loading courses...</p>
            </div>
          ) : instructorCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Courses</h3>
              <p className="text-muted-foreground">This instructor hasn't created any courses yet.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Price (USD)
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructorCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{course.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(course.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{course.category}</TableCell>
                        <TableCell>{course.level}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                            {course.students}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-500" />
                            {course.rating}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={courseUpdates[course.id] || ''}
                              onChange={(e) => handleCourseChange(course.id, e.target.value)}
                              className="w-24"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleUpdateCoursePrices}
                  disabled={isUpdatingPrices}
                >
                  {isUpdatingPrices ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Price Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default InstructorManagement;