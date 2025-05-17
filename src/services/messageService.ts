import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MessageUser {
  _id: string;
  name: string;
  role: string;
}

export interface MessageCourse {
  _id: string;
  title: string;
}

export interface Message {
  _id: string;
  senderId: MessageUser;
  receiverId: MessageUser;
  courseId: MessageCourse;
  content: string;
  read: boolean;
  createdAt: string | Date;
}

interface Conversation {
  partner: MessageUser;
  course: MessageCourse;
  lastMessage: Message;
  unreadCount: number;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  courseName: string;
  lastMessage?: Message;
}

interface CourseStudents {
  courseId: string;
  courseTitle: string;
  students: Student[];
}

interface CourseInstructor {
  courseId: string;
  courseTitle: string;
  instructor: {
    id: string;
    name: string;
    email: string;
  };
}

interface MessageSettings {
  notifications: boolean;
  sound: boolean;
  desktop: boolean;
  preview: boolean;
}

interface MessageStore {
  messages: Message[];
  students: Student[];
  unreadCount: number;
  settings: MessageSettings;
  addMessage: (message: Message) => void;
  markMessageAsRead: (messageId: string) => void;
  markAllMessagesAsRead: () => void;
  updateSettings: (settings: Partial<MessageSettings>) => void;
}

// Get all conversations for the current user
export const useConversations = () => {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      const response = await axios.get<Conversation[]>('/api/messages/conversations');
      return response.data;
    }
  });
};

// Get messages between current user and a specific partner in a course
export const useMessages = (partnerId: string, courseId: string) => {
  return useQuery<Message[]>({
    queryKey: ['messages', partnerId, courseId],
    queryFn: async (): Promise<Message[]> => {
      const response = await axios.get<Message[]>(`/api/messages/${partnerId}/${courseId}`);
      return response.data;
    },
    enabled: !!partnerId && !!courseId
  });
};

// Send a new message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ receiverId, courseId, content }: { 
      receiverId: string;
      courseId: string;
      content: string;
    }) => {
      const response = await axios.post<Message>('/api/messages', {
        receiverId,
        courseId,
        content: content.trim()
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.receiverId, variables.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
  });
};

// Get enrolled students for instructor
export const useEnrolledStudents = () => {
  return useQuery<CourseStudents[]>({
    queryKey: ['enrolled-students'],
    queryFn: async (): Promise<CourseStudents[]> => {
      const response = await axios.get<CourseStudents[]>('/api/instructor/students');
      return response.data;
    }
  });
};

// Get course instructors for student
export const useCourseInstructors = () => {
  return useQuery<CourseInstructor[]>({
    queryKey: ['course-instructors'],
    queryFn: async (): Promise<CourseInstructor[]> => {
      try {
        const response = await axios.get<CourseInstructor[]>('/api/student/instructors');
        
        // Check if response exists and has data
        if (!response || !response.data) {
          console.warn('No data received from instructors endpoint');
          return [];
        }

        // Validate and sanitize the response data
        const validInstructors = response.data
          .filter(item => (
            item && 
            item.courseId && 
            item.courseTitle && 
            item.instructor && 
            item.instructor.id && 
            item.instructor.name
          ))
          .map(item => ({
            courseId: item.courseId,
            courseTitle: item.courseTitle,
            instructor: {
              id: item.instructor.id,
              name: item.instructor.name,
              email: item.instructor.email || 'No email provided'
            }
          }));

        return validInstructors;
      } catch (error) {
        console.error('Error fetching course instructors:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error && typeof error === 'object' && 'response' in error ? {
            status: (error.response as any)?.status,
            data: (error.response as any)?.data
          } : undefined
        });
        
        throw error;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useMessageStore = create<MessageStore>()(
  persist(
    (set) => ({
      messages: [
        {
          _id: 'm1',
          senderId: {
            _id: 'student1',
            name: 'John Smith',
            role: 'student'
          },
          receiverId: {
            _id: 'instructor1',
            name: 'Professor Smith',
            role: 'instructor'
          },
          courseId: {
            _id: 'course1',
            title: 'Advanced Mathematics'
          },
          content: 'Hello professor, I have a question about the upcoming exam.',
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          read: false,
        },
        {
          _id: 'm2',
          senderId: {
            _id: 'student2',
            name: 'Sarah Johnson',
            role: 'student'
          },
          receiverId: {
            _id: 'instructor1',
            name: 'Professor Smith',
            role: 'instructor'
          },
          courseId: {
            _id: 'course2',
            title: 'Introduction to Physics'
          },
          content: 'Could you review my latest assignment submission?',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          read: false,
        },
        {
          _id: 'm3',
          senderId: {
            _id: 'student3',
            name: 'Michael Brown',
            role: 'student'
          },
          receiverId: {
            _id: 'instructor1',
            name: 'Professor Smith',
            role: 'instructor'
          },
          courseId: {
            _id: 'course3',
            title: 'Data Structures'
          },
          content: 'Thank you for the feedback on my project!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          read: true,
        },
      ],
      students: [
        {
          _id: 'student1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          role: 'student',
          courseName: 'Advanced Mathematics',
        },
        {
          _id: 'student2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          role: 'student',
          courseName: 'Introduction to Physics',
        },
        {
          _id: 'student3',
          name: 'Michael Brown',
          email: 'michael.brown@example.com',
          role: 'student',
          courseName: 'Data Structures',
        },
      ],
      unreadCount: 2,
      settings: {
        notifications: true,
        sound: true,
        desktop: true,
        preview: true,
      },
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
          unreadCount: state.unreadCount + 1,
        })),
      markMessageAsRead: (messageId) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === messageId ? { ...msg, read: true } : msg
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      markAllMessagesAsRead: () =>
        set((state) => ({
          messages: state.messages.map((msg) => ({ ...msg, read: true })),
          unreadCount: 0,
        })),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'message-store',
    }
  )
); 