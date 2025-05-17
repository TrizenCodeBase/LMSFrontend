import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Star,
  MoreVertical,
  Search,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { useInstructorCourses, useDeleteCourse } from '@/services/courseService';
import { formatDistanceToNow } from 'date-fns';
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
import { useToast } from '@/components/ui/use-toast';
import CoursePreviewDialog from '@/components/CoursePreviewDialog';

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [previewCourseId, setPreviewCourseId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { 
    data: courses, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useInstructorCourses();

  const deleteMutation = useDeleteCourse();
  
  const handleDelete = async () => {
    if (!courseToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(courseToDelete);
      toast({
        title: "Course deleted",
        description: "Your course has been successfully deleted.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCourseToDelete(null);
    }
  };

  const handlePreview = (courseId: string) => {
    setPreviewCourseId(courseId);
  };

  const handleClosePreview = () => {
    setPreviewCourseId(null);
  };

  // Filter courses based on search query
  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p>Loading courses...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertCircle className="w-12 h-12 mb-2" />
        <h2 className="text-xl font-semibold">Error Loading Courses</h2>
        <p className="text-center mb-4">Unable to load your courses. Please try again.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold">My Courses</h1>
        <Button onClick={() => navigate('/instructor/courses/new')}>
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Create New</span>
          <span className="sm:hidden">New</span>
          Course
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:space-x-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses && filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCourses.map((course) => (
            <Card key={course._id || course.id} className="flex flex-col overflow-hidden">
              <div className="relative">
                <img
                  src={course.image || 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" preserveAspectRatio="none"%3E%3Crect width="300" height="200" fill="%23CCCCCC"%3E%3C/rect%3E%3Ctext x="150" y="100" fill="%23333333" font-size="14" font-family="Arial" text-anchor="middle"%3E' + course.title + '%3C/text%3E%3C/svg%3E'}
                  alt={course.title}
                  className="w-full h-36 sm:h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white/75">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/instructor/courses/${course._id || course.id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Course
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePreview(course._id || course.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setCourseToDelete(course._id || course.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                        <span>{course.students || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        <span>{course.rating || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/instructor/courses/${course._id || course.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                      <span className="sm:hidden">Edit</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                      onClick={() => handlePreview(course._id || course.id)}
                  >
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Preview</span>
                      <span className="sm:hidden">View</span>
                  </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-medium mb-2">No Courses Found</h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? 'No courses match your search query.' : 'You haven\'t created any courses yet.'}
          </p>
          <Button onClick={() => navigate('/instructor/courses/new')}>Create Your First Course</Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this course and remove
              all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Course"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Course Preview Dialog */}
      {previewCourseId && (
        <CoursePreviewDialog
          courseId={previewCourseId}
          isOpen={!!previewCourseId}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
};

export default Courses; 