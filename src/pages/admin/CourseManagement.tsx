import React, { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Users,
  Loader2,
  Archive,
  CheckCircle,
  Star,
  Clock,
  TrendingUp,
  Image as ImageIcon
} from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAllCourses, Course as CourseType } from '@/services/courseService';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axios from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import AdminCourseView from './AdminCourseView';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Extended course status type to include admin statuses
type CourseStatus = 'enrolled' | 'started' | 'completed' | 'pending' | 'active' | 'draft' | 'archived';

// Helper: Category emoji/icon map
const categoryIcons: Record<string, string> = {
  'Web Development': '🖥️',
  'Data Science': '📊',
  'UI/UX': '🎨',
  'Cloud': '☁️',
  'Mobile': '📱',
  'Cybersecurity': '🔒',
  'AI': '🤖',
  'Business': '💼',
  'Marketing': '📈',
  'Other': '📚',
};

const CourseManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // New state for course view dialog
  const [isCourseViewOpen, setIsCourseViewOpen] = useState(false);
  const [viewCourseId, setViewCourseId] = useState<string | null>(null);
  
  // Fetch courses from the API
  const { data: coursesData, isLoading, error, refetch } = useAllCourses();
  
  // Extract unique categories from real course data
  const categories = coursesData 
    ? [...new Set(coursesData.map(course => course.category))]
    : [];

  const handleCourseAction = async (action: string, course: CourseType) => {
    setSelectedCourse(course);
    
    switch (action) {
      case 'View':
        // Open the course view dialog instead of navigating
        setViewCourseId(course._id || course.id);
        setIsCourseViewOpen(true);
        break;
      case 'Edit':
        navigate(`/admin/courses/${course._id || course.id}/edit`);
        break;
      case 'Manage Enrollments':
        navigate(`/admin/courses/${course._id || course.id}/enrollments`);
        break;
      case 'Archive':
        setConfirmAction('archive');
        setIsConfirmDialogOpen(true);
        break;
      case 'Activate':
        setConfirmAction('activate');
        setIsConfirmDialogOpen(true);
        break;
      case 'Delete':
        setConfirmAction('delete');
        setIsConfirmDialogOpen(true);
        break;
      default:
    toast({
      title: `${action} course`,
          description: `Action: ${action} on ${course.title}`,
      duration: 3000,
    });
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedCourse) return;
    
    setIsActionLoading(true);
    try {
      switch (confirmAction) {
        case 'archive':
          await axios.put(`/api/admin/courses/${selectedCourse._id || selectedCourse.id}/status`, { status: 'archived' });
          toast({
            title: "Course archived",
            description: `${selectedCourse.title} has been archived successfully.`,
          });
          break;
        case 'activate':
          await axios.put(`/api/admin/courses/${selectedCourse._id || selectedCourse.id}/status`, { status: 'active' });
          toast({
            title: "Course activated",
            description: `${selectedCourse.title} has been activated successfully.`,
          });
          break;
        case 'delete':
          await axios.delete(`/api/admin/courses/${selectedCourse._id || selectedCourse.id}`);
          toast({
            title: "Course deleted",
            description: `${selectedCourse.title} has been deleted successfully.`,
          });
          break;
      }
      
      // Refresh course data after action
      refetch();
    } catch (error) {
      console.error(`Error performing action ${confirmAction}:`, error);
      toast({
        title: "Action failed",
        description: `Failed to ${confirmAction} course. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setIsConfirmDialogOpen(false);
    }
  };

  const filteredCourses = coursesData?.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || (course.status || 'active') === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Archived</Badge>;
      default:
        return <Badge>{status || 'Active'}</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper to get the lastUpdated date (could be createdAt if no lastModified)
  const getLastUpdated = (course: CourseType) => {
    // Return createdAt as fallback if no lastModified date available
    return formatDate(course.createdAt);
  };

  const handleCloseCourseView = () => {
    setIsCourseViewOpen(false);
    setViewCourseId(null);
  };

  // Mocked instructor stats for popover (replace with real API if available)
  const getInstructorStats = (instructor: string) => ({
    email: `${instructor.replace(/ /g, '.').toLowerCase()}@example.com`,
    courses: Math.floor(Math.random() * 8) + 1,
    students: Math.floor(Math.random() * 500) + 50,
  });

  // Mocked enrollments trend (replace with real API if available)
  const getEnrollmentsTrend = (courseId: string) => ({
    trend: Math.floor(Math.random() * 20) - 5, // -5 to +15
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary drop-shadow-sm">Course Management</h2>
        </div>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white via-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  className="pl-8 rounded-lg border-primary focus:ring-2 focus:ring-primary/50 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] border-primary focus:ring-2 focus:ring-primary/50 rounded-lg shadow-sm">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] border-primary focus:ring-2 focus:ring-primary/50 rounded-lg shadow-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Courses Table */}
            <div className="rounded-xl border overflow-x-auto bg-white/80 shadow-md">
              <Table className="min-w-[900px]">
                <TableHeader className="sticky top-0 z-10 bg-white/90 border-b shadow-sm">
                  <TableRow>
                    <TableHead className="py-2 text-base font-semibold text-primary">Title</TableHead>
                    <TableHead className="py-2 text-base font-semibold text-primary">Category</TableHead>
                    <TableHead className="py-2 text-base font-semibold text-primary">Instructor</TableHead>
                    <TableHead className="py-2 text-base font-semibold text-primary">Rating</TableHead>
                    <TableHead className="py-2 text-base font-semibold text-primary">Duration</TableHead>
                    <TableHead className="py-2 text-base font-semibold text-primary">Enrollments</TableHead>
                    <TableHead className="py-2 text-base font-semibold text-primary">Created</TableHead>
                    <TableHead className="py-2 text-base font-semibold text-primary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading courses...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-red-500">
                        Failed to load courses. Please try again.
                      </TableCell>
                    </TableRow>
                  ) : filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No courses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map((course) => {
                      const instructorStats = getInstructorStats(course.instructor || 'Unknown');
                      return (
                        <TableRow key={course._id || course.id} className="hover:bg-blue-100/70 transition-colors group rounded-xl text-sm">
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2 max-w-[220px]">
                              {/* Thumbnail or category icon */}
                              {course.image ? (
                                <Avatar className="h-8 w-8 border shadow-sm">
                                  <AvatarImage src={course.image} alt={course.title} />
                                  <AvatarFallback>{course.title[0]}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted border">
                                  <span className="text-lg">{categoryIcons[course.category] || '📚'}</span>
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate group-hover:text-primary font-semibold transition-colors duration-150 text-sm">{course.title}</span>
                                {course.courseUrl && (
                                  <span className="text-xs text-muted-foreground mt-0.5 truncate block" style={{ wordBreak: 'break-all' }}>
                                    {course.courseUrl}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">{course.category}</TableCell>
                          <TableCell className="py-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <span className="underline cursor-pointer hover:text-primary transition-colors text-sm">{course.instructor || 'Unknown'}</span>
                              </PopoverTrigger>
                              <PopoverContent className="w-56">
                                <div className="font-semibold mb-1">{course.instructor || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground mb-2">Instructor</div>
                                <div className="text-xs mb-1"><b>Email:</b> {instructorStats.email}</div>
                                <div className="text-xs mb-1"><b>Courses:</b> {instructorStats.courses}</div>
                                <div className="text-xs"><b>Total Students:</b> {instructorStats.students}</div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">{course.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{course.duration || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">{course.students || 0}</TableCell>
                          <TableCell className="py-2">{formatDate(course.createdAt)}</TableCell>
                          <TableCell className="py-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleCourseAction('View', course)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCourseAction('Edit', course)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCourseAction('Manage Enrollments', course)}>
                                  <Users className="mr-2 h-4 w-4" />
                                  Manage Enrollments
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(course.status as string) === 'archived' ? (
                                  <DropdownMenuItem onClick={() => handleCourseAction('Activate', course)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleCourseAction('Archive', course)}>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleCourseAction('Delete', course)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'delete' ? 'Delete Course' : 
               confirmAction === 'archive' ? 'Archive Course' : 'Activate Course'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'delete' ? 
                `Are you sure you want to delete "${selectedCourse?.title}"? This action cannot be undone.` : 
               confirmAction === 'archive' ? 
                `Are you sure you want to archive "${selectedCourse?.title}"? It will no longer be visible to students.` :
                `Are you sure you want to activate "${selectedCourse?.title}"? It will be visible to students.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleConfirmAction();
              }}
              disabled={isActionLoading}
              className={confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction === 'delete' ? 'Delete' : 
               confirmAction === 'archive' ? 'Archive' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Course View Dialog */}
      {viewCourseId && (
        <AdminCourseView
          courseId={viewCourseId}
          isOpen={isCourseViewOpen}
          onClose={handleCloseCourseView}
        />
      )}
    </AdminLayout>
  );
};

export default CourseManagement;
