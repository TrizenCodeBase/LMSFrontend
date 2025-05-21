import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { getImageUrl } from '@/lib/axios';
import { AlertCircle, RefreshCcw, Download, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EnrollmentRequest {
  _id: string;
  userId: string;
  courseId: string;
  email: string;
  mobile: string;
  courseName: string;
  utrNumber: string;
  transactionScreenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const EnrollmentRequests = () => {
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch enrollment requests
  const { data, isLoading } = useQuery({
    queryKey: ['enrollment-requests'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/enrollment-requests');
      return response.data as EnrollmentRequest[];
    },
  });
  
  // Ensure requests is always an array
  const requests = data || [];

  // Approve enrollment request
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await axios.put(`/api/admin/enrollment-requests/${requestId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: 'Enrollment approved',
        description: 'The user now has access to the course.',
      });
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve enrollment.',
        variant: 'destructive',
      });
    },
  });

  // Reject enrollment request
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await axios.put(`/api/admin/enrollment-requests/${requestId}/reject`);
    },
    onSuccess: () => {
      toast({
        title: 'Enrollment rejected',
        description: 'The enrollment request has been rejected.',
      });
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject enrollment.',
        variant: 'destructive',
      });
    },
  });

  // Load image URL when a request is selected
  useEffect(() => {
    const loadImageUrl = async () => {
      if (selectedRequest) {
        try {
          const url = await getImageUrl(selectedRequest.transactionScreenshot);
          setImageUrl(url);
          setImageError(false);
        } catch (error) {
          console.error('Error loading image URL:', error);
          setImageError(true);
        }
      }
    };
    loadImageUrl();
  }, [selectedRequest]);

  // Handle approve click
  const handleApprove = (request: EnrollmentRequest) => {
    approveMutation.mutate(request._id);
  };

  // Handle reject click
  const handleReject = (request: EnrollmentRequest) => {
    rejectMutation.mutate(request._id);
  };

  // View transaction screenshot
  const handleViewScreenshot = (request: EnrollmentRequest) => {
    setSelectedRequest(request);
    setViewImageOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
    }
  };

  // Handle image retry
  const handleRetryImage = async () => {
    setIsRetrying(true);
    setImageError(false);
    try {
      const url = await getImageUrl(selectedRequest!.transactionScreenshot);
      setImageUrl(url + '?t=' + new Date().getTime());
    } catch (error) {
      setImageError(true);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Enrollment Requests</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Enrollment Requests</CardTitle>
            <CardDescription>
              Review and approve student payment details for course enrollments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading enrollment requests...</div>
            ) : requests && requests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>UTR Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Screenshot</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">
                        {formatDate(request.createdAt)}
                      </TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.mobile}</TableCell>
                      <TableCell>{request.courseName}</TableCell>
                      <TableCell>{request.utrNumber}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewScreenshot(request)}
                        >
                          View
                        </Button>
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(request)}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(request)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4">No enrollment requests found</div>
            )}
          </CardContent>
        </Card>
      
        {/* Image Dialog */}
        <Dialog open={viewImageOpen} onOpenChange={setViewImageOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Transaction Screenshot</DialogTitle>
              <DialogDescription>
                {selectedRequest?.email} - {selectedRequest?.courseName}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="mt-4 flex flex-col items-center space-y-4">
                <div className="relative w-full min-h-[300px] bg-slate-50 rounded-lg">
                  {(!imageUrl || isRetrying) && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  )}
                  
                  {imageError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p className="text-sm">Failed to load image</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetryImage}
                        className="mt-2"
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : (
                    imageUrl && (
                      <img 
                        src={imageUrl}
                        alt="Transaction Screenshot" 
                        className="max-h-[80vh] w-full object-contain rounded shadow-lg" 
                        onError={() => setImageError(true)}
                      />
                    )
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (imageUrl) {
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `payment-${selectedRequest.email}-${new Date().toISOString()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                    disabled={!imageUrl || imageError}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Screenshot
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(imageUrl, '_blank')}
                    disabled={!imageUrl || imageError}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default EnrollmentRequests;
