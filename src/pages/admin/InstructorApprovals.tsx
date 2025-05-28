import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useUpdateInstructorStatus } from '@/services/instructorService';

interface InstructorApplication {
  _id: string;
  name: string;
  email: string;
  instructorProfile: {
    specialty: string;
    experience: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const InstructorApprovals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateInstructorStatus = useUpdateInstructorStatus();

  const { data: applications, isLoading } = useQuery<InstructorApplication[]>({
    queryKey: ['instructorApplications'],
    queryFn: async (): Promise<InstructorApplication[]> => {
      const { data } = await axios.get<InstructorApplication[]>('/api/admin/instructor-applications');
      return data;
    },
  });

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateInstructorStatus.mutateAsync({ 
        instructorId: id, 
        status 
      });
      
      toast({
        title: 'Success',
        description: 'Application status updated successfully',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-10">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Instructor Applications</CardTitle>
            <CardDescription>
              Review and manage instructor applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications?.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell className="font-medium">{application.name}</TableCell>
                    <TableCell>{application.email}</TableCell>
                    <TableCell>{application.instructorProfile?.specialty || 'Not specified'}</TableCell>
                    <TableCell>{application.instructorProfile?.experience || 0} years</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          application.status === 'approved'
                            ? 'secondary'
                            : application.status === 'rejected'
                            ? 'destructive'
                            : 'default'
                        }
                        className={
                          application.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : application.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(application.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {application.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              handleStatusUpdate(application._id, 'approved')
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleStatusUpdate(application._id, 'rejected')
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default InstructorApprovals;
