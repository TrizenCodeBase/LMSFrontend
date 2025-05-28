import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

export interface Instructor {
  _id: string;
  name: string;
  email: string;
  role: 'instructor';
  status: 'pending' | 'approved' | 'rejected';
  instructorProfile: {
    specialty: string;
    experience: number;
    courses: string[];
    rating: number;
    totalReviews: number;
  };
  bio: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardOverview {
  activeCourses: number;
  totalStudents: number;
  averageRating: number;
  teachingHours: number;
  newStudents: number;
  ratingChange: number;
  teachingHoursChange: number;
  courseStatus: Array<{
    title: string;
    enrolledStudents: number;
    completionRate: number;
  }>;
  recentActivity: Array<{
    type: 'enrollment' | 'review' | 'completion';
    studentName: string;
    courseTitle: string;
    rating?: number;
    date: string;
  }>;
}

// Get instructor dashboard overview with real-time data
export const useDashboardOverview = () => {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview'],
    queryFn: async (): Promise<DashboardOverview> => {
      const { data } = await axios.get<DashboardOverview>('/api/instructor/dashboard/overview');
      return data;
    }
  });
};

// Get all instructors
export const useInstructors = () => {
  return useQuery<Instructor[]>({
    queryKey: ['instructors'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get<Instructor[]>('/api/admin/instructors', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    // Only fetch if user is admin
    enabled: localStorage.getItem('userRole') === 'admin'
  });
};

// Update instructor status
export const useUpdateInstructorStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      instructorId, 
      status 
    }: { 
      instructorId: string;
      status: 'approved' | 'rejected';
    }) => {
      const response = await axios.put(
        `/api/admin/instructor-applications/${instructorId}`,
        { status }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      queryClient.invalidateQueries({ queryKey: ['instructorApplications'] });
    },
  });
};

// Support ticket interface
export interface SupportTicket {
  id?: string;
  instructorName: string;
  instructorEmail: string;
  category: string;
  subject: string;
  description: string;
  status?: 'open' | 'in-progress' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: string | null;
  replies?: SupportTicketReply[];
}

// Support ticket reply interface
export interface SupportTicketReply {
  id?: string;
  ticketId: string;
  respondentName: string;
  respondentRole: 'admin' | 'support';
  message: string;
  createdAt?: string;
}

// Submit a support ticket
export const useSubmitSupportTicket = () => {
  return useMutation({
    mutationFn: async (ticketData: Omit<SupportTicket, 'id' | 'status' | 'priority' | 'createdAt' | 'updatedAt' | 'assignedTo'>) => {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/instructor/support/tickets', ticketData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    }
  });
};

// Get all support tickets (admin only)
export const useSupportTickets = () => {
  return useQuery<SupportTicket[]>({
    queryKey: ['supportTickets'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get<SupportTicket[]>('/api/admin/support/tickets', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    },
    // Only fetch if user is admin
    enabled: localStorage.getItem('userRole') === 'admin'
  });
};

// Update ticket status (admin only)
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      status,
      assignedTo
    }: { 
      ticketId: string;
      status: 'open' | 'in-progress' | 'closed';
      assignedTo?: string | null;
    }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/api/admin/support/tickets/${ticketId}`,
        { status, assignedTo },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
  });
};

// Get instructor's support tickets with replies
export const useInstructorSupportTickets = () => {
  return useQuery<SupportTicket[]>({
    queryKey: ['instructorSupportTickets'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const userEmail = localStorage.getItem('userEmail'); // Get the logged-in user's email
      
      // Fetch all tickets for the logged-in instructor
      const response = await axios.get<SupportTicket[]>('/api/instructor/support/tickets', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          instructorEmail: userEmail // Filter tickets by instructor email
        }
      });
      
      return response.data;
    }
  });
};

// Submit a reply to a support ticket (admin only)
export const useSubmitTicketReply = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      ticketId,
      message,
      respondentName,
      respondentRole = 'admin'
    }: { 
      ticketId: string;
      message: string;
      respondentName: string;
      respondentRole?: 'admin' | 'support';
    }) => {
      const token = localStorage.getItem('token');
      
      // Ensure ticketId is defined and not empty
      if (!ticketId) {
        throw new Error("Ticket ID is required for submitting a reply");
      }
      
      // Include timestamp and ID for the reply
      const replyData = {
        message,
        respondentName,
        respondentRole,
        createdAt: new Date().toISOString(),
        id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      console.log('Submitting reply to ticket:', ticketId, 'with data:', replyData);
      
      const response = await axios.post(
        `/api/admin/support/tickets/${ticketId}/replies`,
        replyData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // For development purposes - manually update the tickets directly
      // This helps when the backend isn't fully implemented yet
      try {
        // Get current tickets
        const currentTickets = queryClient.getQueryData<SupportTicket[]>(['supportTickets']) || [];
        
        // Find and update the target ticket
        const updatedTickets = currentTickets.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              replies: [...(ticket.replies || []), replyData]
            };
          }
          return ticket;
        });
        
        // Update the cache directly
        queryClient.setQueryData(['supportTickets'], updatedTickets);
        
        // Also update instructor tickets if available
        const instructorTickets = queryClient.getQueryData<SupportTicket[]>(['instructorSupportTickets']) || [];
        const updatedInstructorTickets = instructorTickets.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              replies: [...(ticket.replies || []), replyData]
            };
          }
          return ticket;
        });
        
        queryClient.setQueryData(['instructorSupportTickets'], updatedInstructorTickets);
        
        console.log('Successfully updated ticket cache with new reply');
      } catch (err) {
        console.error('Error updating ticket cache:', err);
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate both admin and instructor ticket queries to refresh data
      console.log('Reply submitted successfully, refreshing ticket data');
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      queryClient.invalidateQueries({ queryKey: ['instructorSupportTickets'] });
    },
    onError: (error) => {
      console.error('Error submitting reply:', error);
    }
  });
};
