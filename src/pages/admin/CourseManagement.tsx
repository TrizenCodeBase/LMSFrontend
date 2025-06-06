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
  Image as ImageIcon,
  LayoutGrid,
  LayoutList,
  SortAsc,
  BookOpen,
  Trophy,
  Activity,
  Folders
} from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAllCourses, Course } from '@/services/courseService';
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
import { CalendarDays } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

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
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [viewCourseId, setViewCourseId] = useState<string | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'rating' | 'enrollments' | 'created'>('created');
  
  const { data: coursesData, isLoading, error, refetch } = useAllCourses();
  
  const handleCourseAction = async (action: string, course: Course) => {
    setSelectedCourse(course);
    
    switch (action) {
      case 'View':
        setViewCourseId(course._id);
        setViewDetailsOpen(true);
        break;
      case 'Edit':
        navigate(`/admin/courses/${course._id}/edit`);
        break;
      case 'Manage Enrollments':
        navigate(`/admin/courses/${course._id}/enrollments`);
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
          await axios.put(`/api/admin/courses/${selectedCourse._id}/status`, { status: 'archived' });
          toast({
            title: "Course archived",
            description: `${selectedCourse.title} has been archived successfully.`,
          });
          break;
        case 'activate':
          await axios.put(`/api/admin/courses/${selectedCourse._id}/status`, { status: 'active' });
          toast({
            title: "Course activated",
            description: `${selectedCourse.title} has been activated successfully.`,
          });
          break;
        case 'delete':
          await axios.delete(`/api/admin/courses/${selectedCourse._id}`);
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
  const getLastUpdated = (course: Course) => {
    // Return lastUpdated as primary, fall back to lastAccessedAt if not available
    return formatDate(course.lastUpdated || course.lastAccessedAt);
  };

  // Extract unique categories from real course data
  const categories = coursesData 
    ? [...new Set(coursesData.map(course => course.category).filter(Boolean))]
    : [];

  const handleCloseCourseView = () => {
    setViewDetailsOpen(false);
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
      <div className="min-h-screen bg-[#f9f9fb] p-6 sm:p-8">
        {/* Header Section with Purple Theme */}
        <div className="mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#34226C] to-[#5f3dc4] p-6 shadow-lg">
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Course Management</h1>
                <p className="text-purple-100/80 text-sm mt-0.5">Manage and organize your educational content</p>
              </div>
              
            </div>
            <div className="absolute inset-0 bg-[url('/infinity-pattern.svg')] opacity-10" />
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100/50 overflow-hidden">
          {/* Enhanced Filters Section */}
          <div className="p-6 border-b border-purple-100/50">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#5f3dc4] transition-colors" />
                <Input
                    placeholder="Search courses by title, instructor, or category..."
                    className="pl-9 h-10 w-full rounded-xl border-gray-200 bg-white focus:border-[#5f3dc4] focus:ring focus:ring-[#5f3dc4]/20 group-hover:border-[#5f3dc4]/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-gray-200 bg-white focus:border-[#5f3dc4] focus:ring focus:ring-[#5f3dc4]/20 hover:border-[#5f3dc4]/50 transition-all">
                    <div className="flex items-center gap-2">
                      <Folders className="h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="All Categories" />
                    </div>
                </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          <span>{categoryIcons[category] || '📚'}</span>
                          <span>{category}</span>
                        </div>
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-gray-200 bg-white focus:border-[#5f3dc4] focus:ring focus:ring-[#5f3dc4]/20 hover:border-[#5f3dc4]/50 transition-all">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="All Statuses" />
                    </div>
                </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Draft
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                        Archived
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-gray-200 bg-white focus:border-[#5f3dc4] focus:ring focus:ring-[#5f3dc4]/20 hover:border-[#5f3dc4]/50 transition-all">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="rating">Rating (High to Low)</SelectItem>
                    <SelectItem value="enrollments">Most Enrolled</SelectItem>
                    <SelectItem value="created">Recently Created</SelectItem>
                </SelectContent>
              </Select>
                <div className="flex items-center gap-1 ml-auto lg:ml-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewMode('grid')}
                          className={`h-10 w-10 rounded-xl hover:bg-[#e6e0f7] transition-colors ${
                            viewMode === 'grid' 
                              ? 'bg-[#e6e0f7] text-[#5f3dc4]' 
                              : 'text-gray-400 hover:text-[#5f3dc4]'
                          }`}
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Grid View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewMode('list')}
                          className={`h-10 w-10 rounded-xl hover:bg-[#e6e0f7] transition-colors ${
                            viewMode === 'list' 
                              ? 'bg-[#e6e0f7] text-[#5f3dc4]' 
                              : 'text-gray-400 hover:text-[#5f3dc4]'
                          }`}
                        >
                          <LayoutList className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>List View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            </div>

          {/* Enhanced Grid View */}
          <div className="p-6">
                  {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] opacity-25"></div>
                    <div className="h-12 w-12 rounded-full border-4 border-[#e6e0f7] border-r-[#5f3dc4] animate-spin"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] border-l-[#5f3dc4] animate-spin-reverse [animation-delay:-0.2s]"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] border-t-[#5f3dc4] animate-spin [animation-delay:-0.4s]"></div>
                  </div>
                  <p className="text-sm text-gray-500 animate-pulse">Loading courses...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center gap-4 text-red-500">
                  <div className="p-4 rounded-full bg-red-50">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium">Failed to load courses</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="mt-2 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center gap-4 text-[#5f3dc4]">
                  <div className="p-4 rounded-full bg-[#e6e0f7]">
                    <Search className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium">No courses found</p>
                  <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div 
                    key={course._id}
                    className="group relative bg-white rounded-xl border border-purple-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Course Header with Thumbnail */}
                    <div className="relative h-40 rounded-t-xl overflow-hidden">
                      {course.image ? (
                        <img 
                          src={course.image} 
                          alt={course.title}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#e6e0f7] to-[#f3f1f9] flex items-center justify-center">
                          <span className="text-4xl">{categoryIcons[course.category] || '📚'}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#34226C]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-sm font-medium truncate">{course.courseUrl}</p>
                      </div>
                    </div>
                    
                    {/* Course Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-[#5f3dc4] transition-colors line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            by {course.instructor || 'Unknown'}
                          </p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#e6e0f7]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] rounded-xl">
                            <DropdownMenuItem 
                              onClick={() => handleCourseAction('View', course)}
                              className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-[#e6e0f7]"
                            >
                              <Eye className="h-4 w-4 text-[#5f3dc4]" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCourseAction('Edit', course)}
                              className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-[#e6e0f7]"
                            >
                              <Edit className="h-4 w-4 text-[#5f3dc4]" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCourseAction('Manage Enrollments', course)}
                              className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-[#e6e0f7]"
                            >
                              <Users className="h-4 w-4 text-[#5f3dc4]" />
                              <span>Manage Enrollments</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(course.status as string) === 'archived' ? (
                              <DropdownMenuItem 
                                onClick={() => handleCourseAction('Activate', course)}
                                className="flex items-center gap-2 rounded-lg cursor-pointer text-emerald-600 hover:bg-emerald-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Activate</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleCourseAction('Archive', course)}
                                className="flex items-center gap-2 rounded-lg cursor-pointer text-amber-600 hover:bg-amber-50"
                              >
                                <Archive className="h-4 w-4" />
                                <span>Archive</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleCourseAction('Delete', course)}
                              className="flex items-center gap-2 rounded-lg cursor-pointer text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Course Stats */}
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#e6e0f7]/30">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium">{course.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#e6e0f7]/30">
                          <Users className="h-4 w-4 text-[#5f3dc4]" />
                          <span className="text-sm font-medium">{course.students || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#e6e0f7]/30">
                          <Clock className="h-4 w-4 text-[#5f3dc4]" />
                          <span className="text-sm font-medium">{course.duration || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#e6e0f7]/30">
                          <CalendarDays className="h-4 w-4 text-[#5f3dc4]" />
                          <span className="text-sm font-medium">{formatDate(course.lastAccessedAt)}</span>
                        </div>
                      </div>
                      
                      {/* Category & Status */}
                      <div className="mt-4 flex items-center gap-2">
                        <Badge className="bg-[#e6e0f7] text-[#5f3dc4] hover:bg-[#e6e0f7]/80">
                          {course.category}
                        </Badge>
                        {getStatusBadge(course.status as string)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[300px]">Course</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">Enrollments</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course._id} className="group hover:bg-[#e6e0f7]/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                              {course.image ? (
                              <div className="relative h-12 w-12 rounded-lg overflow-hidden border shadow-sm">
                                <img 
                                  src={course.image} 
                                  alt={course.title}
                                  className="object-cover h-full w-full transform group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            ) : (
                              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#e6e0f7] to-[#f3f1f9] border shadow-sm">
                                <span className="text-2xl">{categoryIcons[course.category] || '📚'}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 group-hover:text-[#5f3dc4] transition-colors">
                                {course.title}
                              </div>
                              {course.courseUrl && (
                                <div className="text-xs text-gray-500 truncate">
                                  {course.courseUrl}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-[#e6e0f7] text-[#5f3dc4] hover:bg-[#e6e0f7]/80">
                            {course.category}
                          </Badge>
                          </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{course.instructor || 'Unknown'}</span>
                          </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span>{course.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </TableCell>
                        <TableCell className="text-center">
                          <span>{course.students || 0}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-[#5f3dc4]" />
                            <span className="text-sm">{formatDate(course.lastAccessedAt)}</span>
                            </div>
                          </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#e6e0f7]"
                              >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] rounded-xl">
                              <DropdownMenuItem 
                                onClick={() => handleCourseAction('View', course)}
                                className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-[#e6e0f7]"
                              >
                                <Eye className="h-4 w-4 text-[#5f3dc4]" />
                                <span>View Details</span>
                                </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleCourseAction('Edit', course)}
                                className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-[#e6e0f7]"
                              >
                                <Edit className="h-4 w-4 text-[#5f3dc4]" />
                                <span>Edit</span>
                                </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleCourseAction('Manage Enrollments', course)}
                                className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-[#e6e0f7]"
                              >
                                <Users className="h-4 w-4 text-[#5f3dc4]" />
                                <span>Manage Enrollments</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(course.status as string) === 'archived' ? (
                                <DropdownMenuItem 
                                  onClick={() => handleCourseAction('Activate', course)}
                                  className="flex items-center gap-2 rounded-lg cursor-pointer text-emerald-600 hover:bg-emerald-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Activate</span>
                                  </DropdownMenuItem>
                                ) : (
                                <DropdownMenuItem 
                                  onClick={() => handleCourseAction('Archive', course)}
                                  className="flex items-center gap-2 rounded-lg cursor-pointer text-amber-600 hover:bg-amber-50"
                                >
                                  <Archive className="h-4 w-4" />
                                  <span>Archive</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleCourseAction('Delete', course)}
                                className="flex items-center gap-2 rounded-lg cursor-pointer text-red-600 hover:bg-red-50"
                                >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className={
                confirmAction === 'delete'
                  ? 'p-2 rounded-lg bg-red-100 text-red-600'
                  : confirmAction === 'archive'
                  ? 'p-2 rounded-lg bg-amber-100 text-amber-600'
                  : 'p-2 rounded-lg bg-emerald-100 text-emerald-600'
              }>
                {confirmAction === 'delete' ? <Trash2 className="h-5 w-5" /> :
                 confirmAction === 'archive' ? <Archive className="h-5 w-5" /> :
                 <CheckCircle className="h-5 w-5" />}
              </div>
              <span className={
                confirmAction === 'delete'
                  ? 'text-red-600'
                  : confirmAction === 'archive'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }>
              {confirmAction === 'delete' ? 'Delete Course' : 
               confirmAction === 'archive' ? 'Archive Course' : 'Activate Course'}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 mt-4">
              {confirmAction === 'delete' ? 
                <div className="space-y-2">
                  <p>Are you sure you want to delete <span className="font-medium text-gray-900">{selectedCourse?.title}</span>?</p>
                  <p className="text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
                    This action cannot be undone. All course data will be permanently removed.
                  </p>
                </div> : 
               confirmAction === 'archive' ? 
                <div className="space-y-2">
                  <p>Are you sure you want to archive <span className="font-medium text-gray-900">{selectedCourse?.title}</span>?</p>
                  <p className="text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm">
                    The course will be hidden from students but can be reactivated later.
                  </p>
                </div> :
                <div className="space-y-2">
                  <p>Are you sure you want to activate <span className="font-medium text-gray-900">{selectedCourse?.title}</span>?</p>
                  <p className="text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg text-sm">
                    The course will be visible to students.
                  </p>
                </div>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-lg border-gray-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleConfirmAction();
              }}
              className={`rounded-lg transition-all duration-200 ${
                confirmAction === 'delete'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/40'
                  : confirmAction === 'archive'
                  ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/40'
              }`}
              disabled={isActionLoading}
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
          isOpen={viewDetailsOpen}
          onClose={handleCloseCourseView}
        />
      )}
    </AdminLayout>
  );
};

export default CourseManagement;
