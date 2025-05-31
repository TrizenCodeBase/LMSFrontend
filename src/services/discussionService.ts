import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Discussion } from '@/types/discussion';

interface CreateDiscussionData {
  title: string;
  content: string;
  isPinned?: boolean;
}

// Get discussions for a course
export const useCourseDiscussions = (courseId: string) => {
  return useQuery({
    queryKey: ['discussions', courseId],
    queryFn: async () => {
      const response = await axios.get<Discussion[]>(`/api/courses/${courseId}/discussions`);
      return response.data;
    },
    enabled: !!courseId,
  });
};

// Get all discussions for instructor (across all their courses)
export const useInstructorDiscussions = () => {
  return useQuery<Discussion[]>({
    queryKey: ['instructor-discussions'],
    queryFn: async () => {
      const response = await axios.get<Discussion[]>('/api/instructor/discussions');
      return response.data;
    },
  });
};

// Add reply to discussion
export const useAddReply = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ discussionId, content }: { discussionId: string; content: string }) => {
      const response = await axios.post(`/api/discussions/${discussionId}/replies`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-discussions'] });
    },
  });
};

// Create new discussion
export const useCreateDiscussion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, data }: { courseId: string; data: CreateDiscussionData }) => {
      const response = await axios.post(`/api/courses/${courseId}/discussions`, data);
      return response.data;
    },
    onSuccess: (_, { courseId }) => {
      // Invalidate both instructor and course-specific discussion queries
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussions', courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-discussions'] });
    },
  });
};

// Toggle like on discussion
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (discussionId: string) => {
      const response = await axios.post(`/api/discussions/${discussionId}/like`);
      return response.data;
    },
    onSuccess: (_, discussionId) => {
      // Get courseId from cache to invalidate discussions query
      const discussion = queryClient.getQueryData<Discussion>(['discussion', discussionId]);
      if (discussion) {
        queryClient.invalidateQueries({ queryKey: ['discussions', discussion.courseId] });
      }
    },
  });
};

// Delete discussion
export const useDeleteDiscussion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ discussionId, courseId }: { discussionId: string; courseId: string }) => {
      const response = await axios.delete(`/api/discussions/${discussionId}`);
      return response.data;
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['discussions', courseId] });
    },
  });
};

// Delete reply from discussion
export const useDeleteReply = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ discussionId, replyId }: { discussionId: string; replyId: string }) => {
      const response = await axios.delete(`/api/discussions/${discussionId}/replies/${replyId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-discussions'] });
    },
  });
};

export type { Discussion };