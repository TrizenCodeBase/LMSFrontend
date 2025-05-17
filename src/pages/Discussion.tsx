import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, ThumbsUp, MessageSquare, Trash2, ChevronDown, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEnrolledCourses } from "@/services/courseService";
import { useCourseDiscussions, useCreateDiscussion, useAddReply, useToggleLike, useDeleteDiscussion, Discussion as DiscussionType } from "@/services/discussionService";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "@/hooks/use-toast";
import { useToast } from "@/components/ui/use-toast";

const DiscussionCard = ({ 
  discussion, 
  onReply,
  onDelete,
}: { 
  discussion: DiscussionType; 
  onReply: (discussionId: string) => void;
  onDelete: (discussionId: string) => void;
}) => {
  const { user } = useAuth();
  const toggleLikeMutation = useToggleLike();

  // Return null if discussion or its required properties are missing
  if (!discussion?._id || !discussion.userId) {
    return null;
  }

  const handleLike = () => {
    toggleLikeMutation.mutate(discussion._id);
  };

  const isLiked = discussion.likes?.includes(user?.id || '') || false;
  
  // Check if user is creator or instructor
  const isCreator = discussion.userId._id === user?._id;
  const isInstructor = user?.role === 'instructor';
  const canDelete = isCreator || isInstructor;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this discussion?')) {
      onDelete(discussion._id);
    }
  };

  return (
    <div className={`p-4 sm:p-6 border rounded-lg transition-colors mb-4 last:mb-0 ${
      discussion.isPinned 
        ? 'bg-primary/5 border-primary/20 shadow-sm' 
        : 'bg-card hover:bg-accent/5'
    }`}>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Avatar className={`h-10 w-10 sm:h-12 sm:w-12 ring-2 rounded-full ${
          discussion.isPinned 
            ? 'ring-primary/30' 
            : 'ring-primary/10'
        }`}>
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${discussion.userId.name}`} />
          <AvatarFallback className="bg-primary/5">{discussion.userId.name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">{discussion.title}</h3>
                {discussion.isPinned && (
                  <Badge variant="secondary" className="flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                    Instructor
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground/80 truncate mt-0.5">
                {discussion.userId.name} • {formatDistanceToNow(new Date(discussion.createdAt))} ago
              </p>
            </div>
            {canDelete && (
              <Button 
                variant="destructive"
                size="sm"
                className="px-3 py-2 h-auto hover:bg-destructive/90 transition-colors mt-2 sm:mt-0"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          
          <p className="text-sm sm:text-base mt-3 sm:mt-4 text-card-foreground leading-relaxed break-words">{discussion.content}</p>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-3 sm:mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={`w-full sm:w-auto flex justify-center hover:bg-primary/10 transition-colors ${isLiked ? 'text-primary bg-primary/5' : ''}`}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              {discussion.likes?.length || 0} {discussion.likes?.length === 1 ? 'Like' : 'Likes'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onReply(discussion._id)}
              className="w-full sm:w-auto flex justify-center hover:bg-primary/10 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {discussion.replies.length} {discussion.replies.length === 1 ? 'Reply' : 'Replies'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Discussion = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeCourses, setActiveCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionType | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { token } = useAuth();
  const { data: enrolledCourses = [] } = useEnrolledCourses(token);
  const { data: discussionsData = [], refetch: refetchDiscussions } = useCourseDiscussions(selectedCourse);
  const createDiscussionMutation = useCreateDiscussion();
  const addReplyMutation = useAddReply();
  const deleteDiscussionMutation = useDeleteDiscussion();

  // Use the enrolled courses data from the hook
  useEffect(() => {
    if (enrolledCourses.length > 0) {
      setActiveCourses(enrolledCourses);
      // Only set the selected course if it hasn't been set yet
      if (!selectedCourse) {
        setSelectedCourse(enrolledCourses[0]._id);
      }
    }
  }, [enrolledCourses, selectedCourse]);

  // Update loading state based on discussions data
  useEffect(() => {
    setLoading(!discussionsData);
  }, [discussionsData]);

  const activeCoursesFiltered = enrolledCourses.filter(course => 
    course.status !== 'pending' && course.enrollmentStatus !== 'pending'
  );

  const filteredDiscussions = discussionsData.filter(discussion => 
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newDiscussionTitle || !newDiscussionContent) return;

    createDiscussionMutation.mutate({
      courseId: selectedCourse,
      data: {
        title: newDiscussionTitle,
        content: newDiscussionContent,
      }
    }, {
      onSuccess: () => {
        toast({ title: 'Discussion created successfully!' });
        setNewDiscussionTitle('');
        setNewDiscussionContent('');
        refetchDiscussions(); // Refresh the discussions list
      },
      onError: () => {
        toast({ title: 'Failed to create discussion', variant: 'destructive' });
      },
    });
  };

  const openReplyDialog = (discussionId: string) => {
    const discussion = discussionsData.find(d => d._id === discussionId);
    if (discussion) {
      setSelectedDiscussion(discussion);
      setIsReplyDialogOpen(true);
    }
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscussion || !replyContent) return;

    addReplyMutation.mutate({
      discussionId: selectedDiscussion._id,
      content: replyContent,
    }, {
      onSuccess: () => {
        toast({ title: 'Reply added successfully!' });
        setReplyContent('');
        setIsReplyDialogOpen(false);
        refetchDiscussions(); // Refresh discussions to show the new reply
      },
      onError: () => {
        toast({ title: 'Failed to add reply', variant: 'destructive' });
      },
    });
  };

  const handleDeleteDiscussion = (discussionId: string) => {
    if (!selectedCourse) return;
    
    deleteDiscussionMutation.mutate({
      discussionId,
      courseId: selectedCourse,
    }, {
      onSuccess: () => {
        toast({ title: 'Discussion deleted successfully!' });
        refetchDiscussions(); // Refresh the discussions list after deletion
      },
      onError: (error) => {
        toast({ 
          title: 'Failed to delete discussion', 
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive' 
        });
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Course Discussions</h1>
            <div className="mt-4 max-w-xs">
              <Select 
                value={selectedCourse} 
                onValueChange={(value) => setSelectedCourse(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {activeCoursesFiltered.length === 0 ? (
                    <SelectItem value="no-courses" disabled>
                      No enrolled courses
                    </SelectItem>
                  ) : (
                    activeCoursesFiltered.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedCourse && (
              <p className="text-muted-foreground mt-2">
                Viewing discussions for: {activeCoursesFiltered.find(c => c._id === selectedCourse)?.title}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="w-full">
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Card className="shadow-md border-0">
              <CardContent className="p-6">
                {selectedCourse ? (
                  filteredDiscussions.filter(discussion => discussion?._id && discussion.userId).length > 0 ? (
                    filteredDiscussions
                      .filter(discussion => discussion?._id && discussion.userId)
                      .map(discussion => (
                        <DiscussionCard 
                          key={discussion._id} 
                          discussion={discussion}
                          onReply={openReplyDialog}
                          onDelete={handleDeleteDiscussion}
                        />
                      ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No discussions found. Be the first to start a discussion!
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a course to view discussions
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>Start a Discussion</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmitDiscussion}>
                <Select 
                  value={selectedCourse} 
                  onValueChange={(value) => {
                    setSelectedCourse(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a course to post in" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCoursesFiltered.length === 0 ? (
                      <SelectItem value="no-courses" disabled>
                        No enrolled courses
                      </SelectItem>
                    ) : (
                      activeCoursesFiltered.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Input 
                  placeholder="Discussion title" 
                  value={newDiscussionTitle}
                  onChange={(e) => setNewDiscussionTitle(e.target.value)}
                />
                <Textarea 
                  placeholder="What would you like to discuss?" 
                  value={newDiscussionContent}
                  onChange={(e) => setNewDiscussionContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!selectedCourse || !newDiscussionTitle || !newDiscussionContent}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Discussion
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Discussion</DialogTitle>
            {selectedDiscussion && (
              <DialogDescription>
                Replying to "{selectedDiscussion.title}"
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4">
            {selectedDiscussion && (
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-4">
                  {selectedDiscussion.replies.map((reply) => (
                    <div key={reply._id} className="flex gap-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userId.name}`} />
                        <AvatarFallback>{reply.userId.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {reply.userId.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reply.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.createdAt))} ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <form onSubmit={handleReply} className="space-y-4">
              <Textarea
                placeholder="Your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!replyContent}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reply
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Discussion;