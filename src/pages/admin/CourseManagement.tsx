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
  CheckCircle
} from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAllCourses, Course as CourseType } from '@/services/courseService';
import { format } from 'date-fns';
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

// Extended course status type to include admin statuses
type CourseStatus = 'enrolled' | 'started' | 'completed' | 'pending' | 'active' | 'draft' | 'archived';

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Course Management</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[180px]">
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                    filteredCourses.map((course) => (
                      <TableRow key={course._id || course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{course.category}</TableCell>
                        <TableCell>{course.instructor || 'Unknown'}</TableCell>
                        <TableCell>{getStatusBadge(course.status as string)}</TableCell>
                        <TableCell>{course.students || 0}</TableCell>
                        <TableCell>{formatDate(course.createdAt)}</TableCell>
                        <TableCell>{getLastUpdated(course)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                    ))
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
