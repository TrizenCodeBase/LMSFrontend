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
import { useCourseDiscussions, useCreateDiscussion, useAddReply, useToggleLike, useDeleteDiscussion, useDeleteReply, Discussion as DiscussionType } from "@/services/discussionService";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "@/hooks/use-toast";
import { useToast } from "@/components/ui/use-toast";
import { User } from '@/types/discussion';
import { motion, AnimatePresence } from 'framer-motion';

const DiscussionCard = ({ 
  discussion, 
  onReply,
  onDelete,
  onLikeSuccess,
}: { 
  discussion: DiscussionType; 
  onReply: (discussionId: string) => void;
  onDelete: (discussionId: string) => void;
  onLikeSuccess: () => void;
}) => {
  const { user } = useAuth();
  const toggleLikeMutation = useToggleLike();
  const { toast } = useToast();

  if (!discussion?._id || !discussion.userId) {
    return null;
  }

  const handleLike = async () => {
    try {
      await toggleLikeMutation.mutateAsync(discussion._id);
      onLikeSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isLiked = discussion.likes?.includes(user?.id || '') || false;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="group relative bg-white rounded-xl shadow-md p-6 transition-all duration-200 hover:shadow-lg border border-[#6366F1]/10 hover:border-[#6366F1]/30"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/5 via-transparent to-[#6366F1]/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-200" />
      <div className="relative flex items-start gap-4">
        <Avatar className="h-12 w-12 shrink-0 rounded-full border-2 border-[#6366F1]/20 ring-2 ring-[#6366F1]/10 ring-offset-2">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${discussion.userId.name}`} />
          <AvatarFallback>{discussion.userId.name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-[#6366F1] transition-colors">
                {discussion.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <span className="font-medium text-[#6366F1]">{discussion.userId.name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(discussion.createdAt))} ago</span>
              </div>
            </div>
            {canDelete && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 my-3">
            {discussion.isPinned && (
              <Badge variant="secondary" className="bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20 border-0">
                <Star className="h-3 w-3 mr-1 fill-[#6366F1]" />
                Instructor
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
            {discussion.content}
          </p>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isLiked 
                  ? 'text-[#6366F1] bg-[#6366F1]/10 hover:bg-[#6366F1]/20 border border-[#6366F1]/20' 
                  : 'text-gray-600 hover:text-[#6366F1] hover:bg-[#6366F1]/10 border border-transparent'
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-[#6366F1]' : ''}`} />
              <span className="font-medium">{discussion.likes?.length || 0}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onReply(discussion._id)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#6366F1] hover:bg-[#6366F1]/10 rounded-lg transition-all border border-transparent hover:border-[#6366F1]/20"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">{discussion.replies.length}</span>
            </motion.button>
          </div>

          {discussion.replies.length > 0 && (
            <div className="mt-6 space-y-4 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-900">Replies</h4>
              {discussion.replies.slice(0, 2).map((reply) => (
                <motion.div
                  key={reply._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 bg-gray-50/80 p-4 rounded-lg border border-gray-100"
                >
                  <Avatar className="h-8 w-8 shrink-0 border border-[#6366F1]/20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userId.name}`} />
                    <AvatarFallback>{reply.userId.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#6366F1]">{reply.userId.name}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(reply.createdAt))} ago
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{reply.content}</p>
                  </div>
                </motion.div>
              ))}
              {discussion.replies.length > 2 && (
                <button
                  onClick={() => onReply(discussion._id)}
                  className="text-sm text-[#6366F1] hover:text-[#6366F1]/80 font-medium"
                >
                  View all {discussion.replies.length} replies...
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
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
  const deleteReplyMutation = useDeleteReply();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleDeleteReply = async (discussionId: string, replyId: string) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        await deleteReplyMutation.mutateAsync({ discussionId, replyId });
        toast({ title: 'Reply deleted successfully!' });
        refetchDiscussions();
      } catch (error) {
        toast({ 
          title: 'Failed to delete reply', 
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive' 
        });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-screen bg-gradient-to-br from-[#6366F1]/5 via-white to-[#6366F1]/5">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#6366F1]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#6366F1]/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto p-6 lg:p-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#6366F1] to-[#818CF8] p-8 rounded-xl text-white shadow-lg border border-white/20"
              >
                <h1 className="text-3xl font-bold mb-2">Course Discussions</h1>
                <p className="text-white/90 text-lg">Share your thoughts and connect with peers</p>
                <div className="mt-6">
                  <Select 
                    value={selectedCourse} 
                    onValueChange={(value) => setSelectedCourse(value)}
                  >
                    <SelectTrigger className="w-full max-w-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCoursesFiltered.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <div className="relative">
                  <Input
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border-[#6366F1]/20 rounded-xl focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all duration-200 shadow-sm"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6366F1]/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </motion.div>

              {/* Discussions List */}
              <AnimatePresence mode="wait">
                {selectedCourse ? (
                  filteredDiscussions.filter(discussion => discussion?._id && discussion.userId).length > 0 ? (
                    <motion.div 
                      className="space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {filteredDiscussions
                        .filter(discussion => discussion?._id && discussion.userId)
                        .map((discussion, index) => (
                          <motion.div
                            key={discussion._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <DiscussionCard 
                              discussion={discussion}
                              onReply={openReplyDialog}
                              onDelete={handleDeleteDiscussion}
                              onLikeSuccess={refetchDiscussions}
                            />
                          </motion.div>
                        ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-xl shadow-md p-8 text-center border border-[#6366F1]/10"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        <MessageCircle className="h-12 w-12 text-[#6366F1]/30 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-lg font-medium text-gray-900 mb-1">No discussions yet</p>
                      <p className="text-sm text-gray-500">Be the first to start a discussion!</p>
                    </motion.div>
                  )
                ) : null}
              </AnimatePresence>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Start Discussion Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative bg-white rounded-xl shadow-md p-6 border border-[#6366F1]/10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/5 via-transparent to-[#6366F1]/5 opacity-50" />
                <div className="relative">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Start a Discussion</h2>
                  <form className="space-y-4" onSubmit={handleSubmitDiscussion}>
                    <Select 
                      value={selectedCourse} 
                      onValueChange={(value) => setSelectedCourse(value)}
                    >
                      <SelectTrigger className="w-full bg-white border-[#6366F1]/20 hover:border-[#6366F1]/40 transition-colors">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeCoursesFiltered.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="space-y-4">
                      <Input 
                        placeholder="Discussion title" 
                        value={newDiscussionTitle}
                        onChange={(e) => setNewDiscussionTitle(e.target.value)}
                        className="w-full bg-white border-[#6366F1]/20 rounded-lg focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all duration-200"
                        onFocus={() => setIsExpanded(true)}
                      />

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-4"
                          >
                            <Textarea 
                              placeholder="What would you like to discuss?" 
                              value={newDiscussionContent}
                              onChange={(e) => setNewDiscussionContent(e.target.value)}
                              className="w-full min-h-[200px] bg-white border-[#6366F1]/20 rounded-lg resize-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all duration-200"
                            />

                            <Button 
                              type="submit"
                              className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90 text-white transition-colors"
                              disabled={!selectedCourse || !newDiscussionTitle || !newDiscussionContent}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Post Discussion
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </form>
                </div>
              </motion.div>

              {/* Course Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-md p-6 border border-[#6366F1]/10"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Course Stats</h2>
                <div className="space-y-4">
                  <motion.div 
                    className="flex justify-between items-center p-4 rounded-lg hover:bg-green-50 transition-colors border border-green-100"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-600">Active Today</span>
                    </div>
                    <span className="text-lg font-semibold text-green-600">
                      {discussionsData.filter(d => 
                        new Date(d.createdAt).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </motion.div>
                  <motion.div 
                    className="flex justify-between items-center p-4 rounded-lg hover:bg-purple-50 transition-colors border border-purple-100"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-gray-600">Your Posts</span>
                    </div>
                    <span className="text-lg font-semibold text-purple-600">
                      {discussionsData.filter(d => d.userId._id === user?._id).length}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-bold text-gray-900">Reply to Discussion</DialogTitle>
            {selectedDiscussion && (
              <DialogDescription className="text-base text-gray-600 mt-1">
                {selectedDiscussion.title}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="p-6 space-y-6">
            {selectedDiscussion && (
              <ScrollArea className="h-[300px] rounded-lg border border-[#6366F1]/10">
                <div className="p-4 space-y-4">
                  {selectedDiscussion.replies.map((reply) => (
                    <div key={reply._id} className="flex gap-4 bg-[#6366F1]/5 p-4 rounded-lg border border-[#6366F1]/10">
                      <Avatar className="h-9 w-9 shrink-0 border-2 border-[#6366F1]/20">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userId.name}`} />
                        <AvatarFallback>{reply.userId.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#6366F1]">{reply.userId.name}</span>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(reply.createdAt))} ago
                          </span>
                        </div>
                        <p className="text-gray-600">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <form onSubmit={handleReply} className="space-y-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="min-h-[100px] bg-white border-[#6366F1]/20 rounded-lg resize-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all duration-200"
              />
              <Button 
                type="submit"
                className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90 text-white transition-colors"
                disabled={!replyContent.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Post Reply
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Discussion;