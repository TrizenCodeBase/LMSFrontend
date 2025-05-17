import axios from '@/lib/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Notification {
  _id: string;
  type: 'course_update' | 'assignment' | 'discussion' | 'new_day' | 'message';
  title: string;
  message: string;
  courseId?: string;
  assignmentId?: string;
  discussionId?: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Helper function to get the route based on notification type
export const getNotificationRoute = (notification: Notification): string => {
  switch (notification.type) {
    case 'course_update':
      return `/course/${notification.courseId}/weeks`;
    case 'assignment':
      return notification.assignmentId 
        ? `/course/${notification.courseId}/assignments/${notification.assignmentId}`
        : `/assignments`;
    case 'discussion':
      return notification.discussionId 
        ? `/course/${notification.courseId}/discussions/${notification.discussionId}`
        : `/discussions`;
    case 'new_day':
      return `/course/${notification.courseId}`;
    case 'message':
      return notification.link || '/messages';
    default:
      return notification.link || '/dashboard';
  }
};

// Get notifications
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await axios.get<NotificationResponse>('/api/notifications');
      return data;
    },
  });
};

// Mark single notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await axios.put(`/api/notifications/${notificationId}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Mark all notifications as read
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await axios.put('/api/notifications/mark-all-read');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}; 