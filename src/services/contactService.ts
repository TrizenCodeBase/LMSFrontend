import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

export interface ContactRequest {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

// Admin: Get all contact requests
export const useContactRequests = () => {
  return useQuery<ContactRequest[], Error>({
    queryKey: ['contact-requests'],
    queryFn: async () => {
      const response = await axios.get<ContactRequest[]>('/api/admin/contact-requests');
      return response.data;
    },
  });
};

// Admin: Update contact request status
export const useUpdateContactRequestStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: ContactRequest['status'] }) => {
      const response = await axios.put(`/api/admin/contact-requests/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
    },
  });
};