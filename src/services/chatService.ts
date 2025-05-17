import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { isValidObjectId } from '@/utils/validation';

interface MessageUser {
  _id: string;
  name: string;
  role: 'instructor' | 'student';
}

interface MessageCourse {
  _id: string;
  title: string;
}

interface Message {
  _id: string;
  senderId: MessageUser;
  receiverId: MessageUser;
  courseId: MessageCourse;
  content: string;
  read: boolean;
  createdAt: string | Date;
}

// Fetch messages for a specific instructor
export const useInstructorMessages = (instructorId: string) => {
  return useQuery({
    queryKey: ['instructorMessages', instructorId],
    queryFn: async () => {
      const response = await axios.get(`/api/messages/instructor/${instructorId}`);
      return response.data as Message[];
    },
    enabled: !!instructorId,
  });
};

// Send a new message
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      receiverId, 
      courseId,
      content 
    }: { 
      receiverId: string;
      courseId: string;
      content: string; 
    }) => {
      // Validate required fields
      if (!receiverId || !courseId || !content) {
        throw new Error('Missing required fields: receiverId, courseId, and content are required');
      }

      // Validate ObjectIDs
      if (!isValidObjectId(receiverId)) {
        throw new Error('Invalid receiverId format');
      }
      if (!isValidObjectId(courseId)) {
        throw new Error('Invalid courseId format');
      }

      // Validate content length
      if (content.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }
      if (content.length > 5000) {
        throw new Error('Message content cannot exceed 5000 characters');
      }

      try {
        const response = await axios.post('/api/messages', {
          receiverId,
          courseId,
          content: content.trim()
        });
        return response.data;
      } catch (error: any) {
        // Handle specific backend validation errors
        if (error.response?.status === 400) {
          throw new Error(error.response.data.message || 'Invalid request data');
        }
        if (error.response?.status === 403) {
          throw new Error(error.response.data.message || 'Permission denied');
        }
        throw error;
      }
    },
    onSuccess: (_, { receiverId, courseId }) => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({
        queryKey: ['messages', receiverId, courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
  });
};

// Mark messages as read
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instructorId: string) => {
      const response = await axios.post(`/api/messages/instructor/${instructorId}/read`);
      return response.data;
    },
    onSuccess: (_, instructorId) => {
      queryClient.invalidateQueries({
        queryKey: ['instructorMessages', instructorId],
      });
    },
  });
}; 