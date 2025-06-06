import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { CheckCircle, XCircle, Search, Users, Clock, Award, BookOpen } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useUpdateInstructorStatus } from '@/services/instructorService';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
  profilePicture?: string;
}

const InstructorApprovals = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const updateInstructorStatus = useUpdateInstructorStatus();

  const { data: applications = [], isLoading } = useQuery<InstructorApplication[]>({
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

  const filteredApplications = applications.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.instructorProfile.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="p-6 space-y-6 flex-shrink-0">
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#34226C] to-[#5f3dc4] p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white">Instructor Applications</h1>
                  <p className="text-purple-100/80 text-sm mt-1">
                    Review and manage instructor applications
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f3dc4]" />
                    <Input
                      placeholder="Search applications..."
                      className="pl-9 w-full sm:w-[260px] bg-white/90 backdrop-blur-sm border-0 focus-visible:ring-2 focus-visible:ring-white/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-[#e6e0f7] to-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <Users className="h-4 w-4 text-[#5f3dc4]" />
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="text-2xl font-bold text-[#5f3dc4]">{applications.length}</div>
                  <p className="text-sm text-[#5f3dc4]/80">
                    {applications.filter(a => a.status === 'approved').length} approved
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#e6e0f7] to-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <Clock className="h-4 w-4 text-[#5f3dc4]" />
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="text-2xl font-bold text-[#5f3dc4]">
                    {applications.filter(a => a.status === 'pending').length}
                  </div>
                  <p className="text-sm text-[#5f3dc4]/80">Awaiting decision</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#e6e0f7] to-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
                  <CardTitle className="text-sm font-medium">Avg. Experience</CardTitle>
                  <Award className="h-4 w-4 text-[#5f3dc4]" />
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="text-2xl font-bold text-[#5f3dc4]">
                    {Math.round(applications.reduce((acc, curr) => acc + (curr.instructorProfile?.experience || 0), 0) / applications.length || 0)}y
                  </div>
                  <p className="text-sm text-[#5f3dc4]/80">Years teaching</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#e6e0f7] to-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
                  <CardTitle className="text-sm font-medium">Top Specialty</CardTitle>
                  <BookOpen className="h-4 w-4 text-[#5f3dc4]" />
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="text-2xl font-bold text-[#5f3dc4] truncate">
                    {(() => {
                      const specialties = applications.map(a => a.instructorProfile?.specialty || 'Unknown');
                      const counts = specialties.reduce((acc, curr) => {
                        acc[curr] = (acc[curr] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const max = Math.max(...Object.values(counts));
                      return Object.keys(counts).find(key => counts[key] === max) || 'N/A';
                    })()}
                  </div>
                  <p className="text-sm text-[#5f3dc4]/80">Most common</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Applications Table */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="py-4 px-6">
              <CardTitle>Applications</CardTitle>
              <CardDescription>Review and manage instructor applications</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">S.No.</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application, index) => (
                    <TableRow key={application._id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {application.profilePicture ? (
                              <AvatarImage src={application.profilePicture} alt={application.name} />
                            ) : (
                              <AvatarFallback className="bg-[#5f3dc4] text-white">
                                {getInitials(application.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="font-medium">{application.name}</span>
                        </div>
                      </TableCell>
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
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(application._id, 'approved')}
                              className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white transition-all"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(application._id, 'rejected')}
                              className="h-8 hover:bg-red-600/90 transition-all"
                            >
                              <XCircle className="h-4 w-4" />
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
      </div>
    </AdminLayout>
  );
};

export default InstructorApprovals;
