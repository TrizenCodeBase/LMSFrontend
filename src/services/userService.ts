import axios from '@/lib/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface UserSettings {
  createdAt: number;
  name: string;
  displayName: string;
  email: string;
  bio: string;
  timezone: string;
  notificationPreferences: {
    courseUpdates: boolean;
    assignmentReminders: boolean;
    discussionReplies: boolean;
  };
  twoFactorAuth: {
    enabled: boolean;
    method: 'app' | 'sms';
    phone?: string;
  };
  connectedDevices: Array<{
    id: string;
    name: string;
    type: string;
    browser: string;
    lastActive: Date;
  }>;
}

// Get user settings
export const useUserSettings = () => {
  return useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const response = await axios.get('/api/auth/me');
      return response.data;
    }
  });
};

// Update profile settings
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      displayName: string;
      bio: string;
      email: string;
      timezone: string;
    }) => {
      const response = await axios.put('/api/user/profile', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both user settings and user profile data
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    }
  });
};

// Update password
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      try {
        const response = await axios.put('/api/user/password', data);
        return response.data;
      } catch (error: any) {
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw new Error('Failed to update password');
      }
    }
  });
};

// Update notification preferences
export const useUpdateNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      courseUpdates: boolean;
      assignmentReminders: boolean;
      discussionReplies: boolean;
    }) => {
      const response = await axios.put('/api/user/notifications', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    }
  });
};

// Get connected devices
export const useConnectedDevices = () => {
  return useQuery({
    queryKey: ['connected-devices'],
    queryFn: async () => {
      const response = await axios.get('/api/user/devices');
      return response.data;
    }
  });
};

// Remove connected device
export const useRemoveDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await axios.delete(`/api/user/devices/${deviceId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-devices'] });
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    }
  });
};

// Get user profile data
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await axios.get('/api/auth/me');
      return response.data;
    }
  });
};