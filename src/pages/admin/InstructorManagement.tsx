import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Loader2,
  Search,
  X,
  Pencil,
  GraduationCap
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
import { useUpdateInstructorStatus } from '@/services/instructorService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Types
interface Instructor {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  userId?: string;
  bio?: string;
  phone?: string;
  location?: string;
  instructorId?: string;
  instructorProfile: {
    specialty: string;
    experience: number;
    courses: {
      _id: string;
      title: string;
      status: string;
    }[];
    rating: number;
    totalReviews: number;
    teachingHours: number;
    bio?: string;
    phone?: string;
    location?: string;
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      website?: string;
    };
  };
  status: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
  createdAt: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
  const updateInstructorStatus = useUpdateInstructorStatus();

  // Filter instructors based on search query and status
  const filteredInstructors = React.useMemo(() => {
    return instructors.filter(instructor => {
      const matchesSearch = 
        instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.instructorProfile.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || instructor.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [instructors, searchQuery, statusFilter]);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setIsLoading(true);
      // Fetch instructors with their complete profiles
      const response = await axios.get<Instructor[]>('/api/admin/instructors', {
        params: {
          include: 'profile,courses,stats'
        }
      });
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
      await updateInstructorStatus.mutateAsync({ 
        instructorId, 
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

  const handleViewDetails = async (instructor: Instructor) => {
    // Show dialog immediately with existing data
    setSelectedInstructor(instructor);
    setIsDetailsDialogOpen(true);

    try {
      // Fetch fresh instructor data using the list endpoint with a filter
      const response = await axios.get<Instructor[]>('/api/admin/instructors', {
        params: {
          instructorId: instructor._id,  // Changed from id to instructorId
          include: 'profile,courses,stats',
          single: true  // Add flag to get single instructor
        }
      });
      
      // Find the exact instructor we want by matching the ID
      const updatedInstructor = response.data.find(inst => inst._id === instructor._id);
      if (updatedInstructor) {
        setSelectedInstructor(updatedInstructor);
      }
    } catch (error) {
      console.error('Error fetching instructor details:', error);
      // Don't show error toast since we're showing existing data
    }
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
      instructor.profilePicture,
      instructor.bio,
      instructor.phone,
      instructor.location,
      instructor.instructorProfile?.specialty,
      instructor.instructorProfile?.experience,
      instructor.instructorProfile?.socialLinks?.linkedin,
    ];
    
    const filledFields = fields.filter(Boolean).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  // Add a function to get instructor ID in the correct format
  const getInstructorId = (instructor: Instructor) => {
    return instructor.instructorId || `TIN${instructor._id.substring(0, 4)}`;
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="p-3 space-y-3 flex-shrink-0 border-b bg-background">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold">Instructor Management</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and monitor all instructors in the platform
                </p>
              </div>
              <div className="flex flex-row gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search instructors..."
                    className="pl-8 h-9 w-full sm:w-[200px] text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[130px] text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <Card className="bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between py-2 px-3 space-y-0">
                  <CardTitle className="text-xs font-medium">Total Instructors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
                <CardContent className="py-2 px-3">
                  <div className="text-xl font-bold">{instructors.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {instructors.filter(i => i.status === 'approved').length} active
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500/5">
                <CardHeader className="flex flex-row items-center justify-between py-2 px-3 space-y-0">
                  <CardTitle className="text-xs font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <div className="text-xl font-bold">
                    {instructors.filter(i => i.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5">
                <CardHeader className="flex flex-row items-center justify-between py-2 px-3 space-y-0">
                  <CardTitle className="text-xs font-medium">Avg. Experience</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <div className="text-xl font-bold">
                    {Math.round(instructors.reduce((acc, curr) => acc + curr.instructorProfile.experience, 0) / instructors.length || 0)}y
                  </div>
                  <p className="text-xs text-muted-foreground">Years teaching</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/5">
                <CardHeader className="flex flex-row items-center justify-between py-2 px-3 space-y-0">
                  <CardTitle className="text-xs font-medium">Top Specialty</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <div className="text-xl font-bold truncate">
                    {(() => {
                      const specialties = instructors.map(i => i.instructorProfile.specialty);
                      const counts = specialties.reduce((acc, curr) => {
                        acc[curr] = (acc[curr] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const max = Math.max(...Object.values(counts));
                      return Object.keys(counts).find(key => counts[key] === max) || 'N/A';
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">Most common</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 p-3 bg-muted/5">
          <div className="h-full rounded-md border bg-background shadow-sm overflow-hidden">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px] py-2">S.No</TableHead>
                    <TableHead className="w-[100px] py-2">ID</TableHead>
                    <TableHead className="py-2">Name</TableHead>
                    <TableHead className="hidden md:table-cell py-2">Email</TableHead>
                    <TableHead className="hidden lg:table-cell py-2">Specialty</TableHead>
                    <TableHead className="hidden lg:table-cell w-[90px] py-2">Exp.</TableHead>
                    <TableHead className="w-[90px] py-2">Status</TableHead>
                    <TableHead className="hidden md:table-cell w-[100px] py-2">Registered</TableHead>
                    <TableHead className="w-[60px] text-right py-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-[200px]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Loading instructors...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredInstructors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-[200px]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No instructors found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInstructors.map((instructor, index) => (
                      <TableRow key={instructor._id} className="hover:bg-muted/50">
                        <TableCell className="py-2 font-medium">{index + 1}</TableCell>
                        <TableCell className="py-2">
                          <code className="px-1.5 py-0.5 rounded bg-muted/50 text-xs">
                            {getInstructorId(instructor)}
                          </code>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-muted">
                              {instructor.profilePicture ? (
                                <AvatarImage 
                                  src={instructor.profilePicture} 
                                  alt={instructor.name}
                                  className="object-cover"
                                />
                              ) : (
                                <AvatarFallback 
                                  className="bg-primary/10 text-primary text-xs"
                                  title={instructor.name}
                                >
                                  {getInitials(instructor.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex flex-col min-w-[140px]">
                              <p className="text-sm font-medium leading-none">
                                {instructor.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {instructor.instructorProfile.specialty}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                              {instructor.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal bg-muted/50">
                            {instructor.instructorProfile.specialty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="tabular-nums">
                              {instructor.instructorProfile.experience} years
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              instructor.status === 'approved' 
                                ? 'default' 
                                : instructor.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className={
                              instructor.status === 'approved'
                                ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                : instructor.status === 'pending'
                                ? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
                                : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                            }
                          >
                            {instructor.status.charAt(0).toUpperCase() + instructor.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm tabular-nums">
                          {new Date(instructor.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {instructor.status === 'pending' ? (
                              <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(instructor._id, 'approved')}
                                  className="bg-green-500 hover:bg-green-600 text-white transition-colors"
                              >
                                  <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStatusUpdate(instructor._id, 'rejected')}
                                  className="hover:bg-red-600/90 transition-colors"
                              >
                                  <X className="h-4 w-4" />
                              </Button>
                              </>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 hover:bg-muted transition-colors"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                  align="end" 
                                  className="w-[160px] animate-in fade-in-0 zoom-in-95"
                                >
                                  <DropdownMenuItem 
                                    onClick={() => handleViewDetails(instructor)}
                                    className="cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleSendMessage(instructor)}
                                    className="cursor-pointer"
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Send Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleViewCourses(instructor)}
                                    className="cursor-pointer"
                                  >
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    View Courses
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {instructor.isActive !== false ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleToggleActive(instructor, 'suspend')}
                                      className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Suspend
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleToggleActive(instructor, 'reactivate')}
                                      className="text-green-600 cursor-pointer focus:text-green-600 focus:bg-green-50"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Reactivate
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
          </div>
        </div>
      </div>
      
      {/* Instructor Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-[1000px] p-0 overflow-hidden bg-white rounded-lg">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">Instructor Profile</DialogTitle>
            <DialogDescription>
              Viewing detailed information for {selectedInstructor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-[300px_1fr]">
            {/* Left Column - Profile Info */}
            <div className="p-6 bg-card border-r">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-background">
                    {selectedInstructor?.profilePicture ? (
                      <AvatarImage 
                        src={selectedInstructor.profilePicture} 
                        alt={selectedInstructor?.name}
                        className="object-cover"
                      />
                        ) : (
                      <AvatarFallback className="text-2xl">
                        {selectedInstructor?.name ? getInitials(selectedInstructor.name) : 'IN'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      </div>
                      
                <div>
                  <h3 className="text-xl font-semibold">{selectedInstructor?.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedInstructor ? getInstructorId(selectedInstructor) : ''}
                        </p>
                  <Badge variant="secondary" className="mt-2">Instructor</Badge>
                      </div>
                    </div>
                    
              <div className="mt-8 space-y-6">
                    <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedInstructor?.email}</span>
                      </div>
                    {selectedInstructor?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedInstructor.phone}</span>
                        </div>
                      )}
                    {selectedInstructor?.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedInstructor.location}</span>
                        </div>
                      )}
                    </div>
                      </div>
                      
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Social Profiles</h4>
                  <div className="space-y-3">
                    {selectedInstructor?.instructorProfile?.socialLinks?.linkedin && (
                              <a 
                                href={selectedInstructor.instructorProfile.socialLinks.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                              >
                        <Linkedin className="h-4 w-4" />
                                LinkedIn Profile
                              </a>
                          )}
                            </div>
                            </div>
                        </div>
                  </div>
                  
            {/* Right Column - Details */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="bg-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      <BookOpen className="h-4 w-4 inline-block mr-2" />
                      Courses Created
                    </CardTitle>
                      </CardHeader>
                      <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedInstructor?.instructorProfile?.courses?.length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    
                <Card className="bg-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      <Star className="h-4 w-4 inline-block mr-2" />
                      Rating
                    </CardTitle>
                      </CardHeader>
                      <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedInstructor?.instructorProfile?.rating || 0}
                      <span className="text-sm text-muted-foreground">/5</span>
                        </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedInstructor?.instructorProfile?.totalReviews || 0} Reviews
                    </p>
                      </CardContent>
                    </Card>
                  
                <Card className="bg-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      <Clock className="h-4 w-4 inline-block mr-2" />
                      Teaching Hours
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedInstructor?.instructorProfile?.teachingHours || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    About Me
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedInstructor?.bio || selectedInstructor?.instructorProfile?.bio || 'No bio provided'}
                  </p>
                  </div>
                  
                    <div className="space-y-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Skills & Expertise
                  </h4>
                  <div className="space-y-6">
                                <div>
                      <h5 className="text-sm font-medium mb-2">Specialty</h5>
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {selectedInstructor?.instructorProfile?.specialty || 'Not specified'}
                      </Badge>
                                </div>
                    <div>
                      <h5 className="text-sm font-medium mb-2">Experience Level</h5>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {selectedInstructor?.instructorProfile?.experience || 0} Years
                        </span>
                              </div>
                              </div>
                            </div>
                    </div>
                    </div>
                </div>
          </div>
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
                ? `Are you sure you want to suspend ${selectedInstructor?.name}? They will no longer be able to access their account.`
                : `Are you sure you want to reactivate ${selectedInstructor?.name}? They will regain access to their account.`}
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
            <DialogTitle>
              Instructor Courses
            </DialogTitle>
            <DialogDescription>
              {selectedInstructor ? 
                `Manage courses and pricing for ${selectedInstructor.name}` : 
                'Manage instructor courses and pricing'}
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