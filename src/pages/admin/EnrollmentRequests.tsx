import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AlertCircle, RefreshCcw, Download, ExternalLink, CheckCircle, XCircle, Eye, Calendar, Mail, Phone, BookOpen, CreditCard, Image, Search, X, User, Hash } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, CheckSquare } from 'lucide-react';

interface EnrollmentRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    userId: string;
  };
  courseId: {
    _id: string;
    title: string;
    courseUrl: string;
  };
  email: string;
  mobile: string;
  courseName: string;
  transactionId: string;
  transactionScreenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  deletedAt?: string;
  courseUrl?: string;
  referredBy?: string;
}

const EnrollmentRequests = () => {
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'deleted'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [recentlyDeletedRequests, setRecentlyDeletedRequests] = useState<EnrollmentRequest[]>([]);
  const [showUndoDelete, setShowUndoDelete] = useState(false);

  // Add state for tracking counts
  const [counts, setCounts] = useState({
    approved: 0,
    rejected: 0,
    pending: 0,
    deleted: 0
  });

  // Fetch enrollment requests
  const { data: enrollmentData, isLoading } = useQuery({
    queryKey: ['enrollment-requests'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/enrollment-requests');
      return response.data as EnrollmentRequest[];
    },
  });
  
  // Fetch deleted enrollment requests
  const { data: deletedData } = useQuery({
    queryKey: ['deleted-enrollment-requests'],
    queryFn: async () => {
      const response = await axios.get<EnrollmentRequest[]>('/api/admin/enrollment-requests/deleted');
      return response.data;
    },
  });
  
  // Ensure requests is always an array
  const requests = enrollmentData || [];

  // Update counts whenever requests or deleted requests data changes
  useEffect(() => {
    if (!enrollmentData && !deletedData) return;

      const newCounts = {
        approved: 0,
        rejected: 0,
        pending: 0,
        deleted: deletedData?.length || 0
      };

    if (enrollmentData) {
      enrollmentData.forEach(request => {
        if (request.status in newCounts) {
          newCounts[request.status as keyof typeof newCounts] += 1;
        }
        });
      }
      
      setCounts(newCounts);
  }, [enrollmentData, deletedData]);

  // Approve enrollment request
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      try {
        // Approve the enrollment request (referral count will be updated in the backend)
        const response = await axios.put(`/api/admin/enrollment-requests/${requestId}/approve`);
        return response;
      } catch (error) {
        console.error('Error in enrollment approval:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Enrollment approved and referral updated successfully.',
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      console.error('Error in approval process:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to approve enrollment. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
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

  // Update the formatDate function to separate date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      <div className="flex flex-col">
        <span className="font-medium">{date.toLocaleDateString()}</span>
        <span className="text-muted-foreground text-xs">{date.toLocaleTimeString()}</span>
      </div>
    );
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
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

  // Filter requests based on search and active tab
  const filteredRequests = useMemo(() => {
    const requestsToFilter = activeTab === 'deleted' ? (deletedData || []) : (requests || []);
    
    return requestsToFilter.filter(request => {
      const matchesTab = activeTab === 'all' || 
                        (activeTab === 'deleted' && deletedData?.includes(request)) ||
                        (activeTab !== 'deleted' && request.status === activeTab);
      
      const matchesSearch = searchTerm === '' || 
        Object.values(request).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesTab && matchesSearch;
    });
  }, [requests, deletedData, activeTab, searchTerm]);

  // Add delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (requestIds: string[]) => {
      const params = new URLSearchParams();
      params.append('requestIds', JSON.stringify(requestIds));
      return await axios.delete<{ deletedRequests: EnrollmentRequest[] }>(`/api/admin/enrollment-requests?${params.toString()}`);
    },
    onSuccess: (response, requestIds) => {
      // Store the deleted requests for potential restoration
      const deletedRequests = response.data.deletedRequests;
      setRecentlyDeletedRequests(deletedRequests);
      setShowUndoDelete(true);

      toast({
        title: 'Successfully deleted',
        description: (
          <div className="flex flex-col gap-2">
            <p>{requestIds.length} request(s) have been deleted.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => restoreMutation.mutate(requestIds)}
              className="w-fit"
            >
              Undo Delete
            </Button>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      });
      
      setSelectedRequests([]);
      setIsSelectionMode(false);

      // Update both queries to reflect the changes
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-enrollment-requests'] });

      // Optionally switch to deleted tab to show the moved items
      if (requestIds.length === 1) {
        setActiveTab('deleted');
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete the requests.',
        variant: 'destructive',
      });
    },
  });

  // Update restore mutation to update both queries
  const restoreMutation = useMutation({
    mutationFn: async (requestIds: string[]) => {
      return await axios.post('/api/admin/enrollment-requests/restore', { requestIds });
    },
    onSuccess: () => {
      toast({
        title: 'Successfully restored',
        description: 'The selected requests have been restored.',
      });
      setRecentlyDeletedRequests([]);
      setShowUndoDelete(false);
      // Update both queries to reflect the changes
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-enrollment-requests'] });
      // Switch back to all tab
      setActiveTab('all');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to restore the requests.',
        variant: 'destructive',
      });
    },
  });

  // Update permanent delete mutation to update both queries
  const permanentDeleteMutation = useMutation({
    mutationFn: async (requestIds: string[]) => {
      const params = new URLSearchParams();
      params.append('requestIds', JSON.stringify(requestIds));
      return await axios.delete<{ deletedCount: number }>(`/api/admin/enrollment-requests/permanent?${params.toString()}`);
    },
    onSuccess: (response, requestIds) => {
      toast({
        title: 'Permanently deleted',
        description: `${requestIds.length} request(s) have been permanently deleted.`,
      });
      setSelectedRequests([]);
      setIsSelectionMode(false);
      // Update both queries to reflect the changes
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-enrollment-requests'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to permanently delete the requests.',
        variant: 'destructive',
      });
    },
  });

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(filteredRequests.map(r => r._id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectOne = (checked: boolean, requestId: string) => {
    if (checked) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  // Add useEffect to hide undo option after timeout
  useEffect(() => {
    if (showUndoDelete) {
      const timer = setTimeout(() => {
        setShowUndoDelete(false);
        setRecentlyDeletedRequests([]);
      }, 10000); // Hide after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [showUndoDelete]);

  const handleDelete = (requestIds: string[]) => {
    if (activeTab === 'deleted') {
      // Show permanent delete confirmation
      if (window.confirm(`Are you sure you want to PERMANENTLY delete ${requestIds.length} request(s)? This action CANNOT be undone and the data will be permanently lost.`)) {
        permanentDeleteMutation.mutate(requestIds);
      }
    } else {
      // Show normal delete confirmation
      if (window.confirm(`Are you sure you want to delete ${requestIds.length} request(s)? You can restore them later from the Deleted tab.`)) {
        deleteMutation.mutate(requestIds);
      }
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedRequests([]); // Clear selections when disabling selection mode
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#f9f9fb] p-6 sm:p-8">
        {/* Add Undo Delete Alert */}
        {showUndoDelete && recentlyDeletedRequests.length > 0 && activeTab !== 'deleted' && (
          <div className="fixed bottom-4 right-4 z-50">
            <Alert className="bg-white shadow-lg border border-[#e6e0f7] rounded-xl">
              <AlertCircle className="h-4 w-4 text-[#5f3dc4]" />
              <AlertDescription className="flex items-center gap-4">
                <span className="text-gray-600">
                  Deleted {recentlyDeletedRequests.length} request(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restoreMutation.mutate(recentlyDeletedRequests.map(r => r._id))}
                  className="gap-2 hover:bg-[#e6e0f7] border-[#5f3dc4] text-[#5f3dc4]"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Undo Delete
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <div className="space-y-8">
            {/* Header Section */}
          <div className="mb-8">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#34226C] to-[#5f3dc4] p-6 shadow-lg">
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              <div>
                  <h1 className="text-2xl font-semibold text-white">Enrollment Requests</h1>
                  <p className="text-purple-100/80 text-sm mt-0.5">Manage and track course enrollment requests</p>
              </div>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] })}
                  className="ml-auto bg-white/10 hover:bg-white/20 text-white rounded-xl border-0 backdrop-blur-sm transition-all duration-200 shadow-lg shadow-black/5"
              >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Refresh
              </Button>
              </div>
              <div className="absolute inset-0 bg-[url('/infinity-pattern.svg')] opacity-10" />
            </div>
            </div>

            {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Approved Stats */}
            <div className="group bg-white rounded-xl px-6 py-4 flex items-center justify-between shadow-md hover:shadow-lg transition-all duration-200 border border-[#e6e0f7]">
                    <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="font-bold text-2xl text-[#5f3dc4] mt-1 group-hover:scale-105 transition-transform">{counts.approved}</p>
                    </div>
              <div className="p-3 rounded-xl bg-[#e6e0f7] text-[#5f3dc4]">
                <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>

            {/* Rejected Stats */}
            <div className="group bg-white rounded-xl px-6 py-4 flex items-center justify-between shadow-md hover:shadow-lg transition-all duration-200 border border-[#e6e0f7]">
                    <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="font-bold text-2xl text-red-600 mt-1 group-hover:scale-105 transition-transform">{counts.rejected}</p>
                    </div>
              <div className="p-3 rounded-xl bg-red-50 text-red-600">
                <XCircle className="h-6 w-6" />
                    </div>
                  </div>

            {/* Pending Stats */}
            <div className="group bg-white rounded-xl px-6 py-4 flex items-center justify-between shadow-md hover:shadow-lg transition-all duration-200 border border-[#e6e0f7]">
                    <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="font-bold text-2xl text-yellow-600 mt-1 group-hover:scale-105 transition-transform">{counts.pending}</p>
                    </div>
              <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
                <AlertCircle className="h-6 w-6" />
                    </div>
                  </div>

            {/* Deleted Stats */}
            <div className="group bg-white rounded-xl px-6 py-4 flex items-center justify-between shadow-md hover:shadow-lg transition-all duration-200 border border-[#e6e0f7]">
                    <div>
                <p className="text-sm text-gray-600">Deleted</p>
                <p className="font-bold text-2xl text-gray-600 mt-1 group-hover:scale-105 transition-transform">{counts.deleted}</p>
                    </div>
              <div className="p-3 rounded-xl bg-gray-50 text-gray-600">
                <Trash2 className="h-6 w-6" />
                    </div>
            </div>
        </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-md border border-[#e6e0f7]">
            {/* Filters Section */}
            <div className="p-6 border-b border-[#e6e0f7] bg-[#e6e0f7]/10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                      variant={isSelectionMode ? "secondary" : "ghost"}
                      size="sm"
                      onClick={toggleSelectionMode}
                    className="gap-2 hover:bg-[#e6e0f7]"
                    >
                      <CheckSquare className={cn(
                        "h-4 w-4",
                      isSelectionMode ? "text-[#5f3dc4]" : "text-gray-500"
                      )} />
                      {isSelectionMode ? "Cancel Selection" : "Select"}
                    </Button>
                    {isSelectionMode && selectedRequests.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(selectedRequests)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {activeTab === 'deleted' ? 'Permanently Delete' : 'Delete'} Selected ({selectedRequests.length})
                      </Button>
                    )}
                  </div>
                <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                      <Input 
                        placeholder="Search by email, course, or Transaction ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 h-9 bg-white border-[#e6e0f7] focus:ring-2 focus:ring-[#e6e0f7] focus:border-[#5f3dc4] rounded-lg"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                      </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
                <TabsList className="w-full flex bg-white p-1 gap-1 h-10 rounded-lg border border-[#e6e0f7] shadow-sm">
                  <TabsTrigger 
                    value="all" 
                    className="flex-1 data-[state=active]:bg-[#e6e0f7] data-[state=active]:text-[#5f3dc4] data-[state=active]:shadow-sm rounded-md text-sm font-medium"
                  >
                        All Requests
                      </TabsTrigger>
                  <TabsTrigger 
                    value="pending" 
                    className="flex-1 data-[state=active]:bg-[#e6e0f7] data-[state=active]:text-[#5f3dc4] data-[state=active]:shadow-sm rounded-md text-sm font-medium text-yellow-600"
                  >
                        Pending ({counts.pending})
                      </TabsTrigger>
                  <TabsTrigger 
                    value="approved" 
                    className="flex-1 data-[state=active]:bg-[#e6e0f7] data-[state=active]:text-[#5f3dc4] data-[state=active]:shadow-sm rounded-md text-sm font-medium text-[#5f3dc4]"
                  >
                        Approved ({counts.approved})
                      </TabsTrigger>
                  <TabsTrigger 
                    value="rejected" 
                    className="flex-1 data-[state=active]:bg-[#e6e0f7] data-[state=active]:text-[#5f3dc4] data-[state=active]:shadow-sm rounded-md text-sm font-medium text-red-600"
                  >
                        Rejected ({counts.rejected})
                      </TabsTrigger>
                  <TabsTrigger 
                    value="deleted" 
                    className="flex-1 data-[state=active]:bg-[#e6e0f7] data-[state=active]:text-[#5f3dc4] data-[state=active]:shadow-sm rounded-md text-sm font-medium text-gray-600"
                  >
                        Deleted ({counts.deleted})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

            {/* Table Section */}
            <div className="p-6">
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] opacity-25"></div>
                      <div className="h-12 w-12 rounded-full border-4 border-[#e6e0f7] border-r-[#5f3dc4] animate-spin"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] border-l-[#5f3dc4] animate-spin-reverse [animation-delay:-0.2s]"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] border-t-[#5f3dc4] animate-spin [animation-delay:-0.4s]"></div>
                    </div>
                    <p className="text-sm text-gray-500 animate-pulse">Loading requests...</p>
                      </div>
                    </div>
                  ) : filteredRequests.length > 0 ? (
                <div className="rounded-xl border border-[#e6e0f7] overflow-hidden shadow-sm">
              <Table>
                    <TableHeader className="bg-[#e6e0f7]/10">
                      <TableRow className="hover:bg-transparent border-none">
                              {isSelectionMode && (
                                <TableHead className="w-[50px]">
                                  <Checkbox 
                                    checked={
                                      filteredRequests.length > 0 &&
                                      selectedRequests.length === filteredRequests.length
                                    }
                                    onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                                  />
                                </TableHead>
                              )}
                        <TableHead className="w-[60px] font-medium text-gray-600">
                                <div className="flex items-center gap-2">
                                  S.No
                                </div>
                              </TableHead>
                        <TableHead className="w-[180px] font-medium text-gray-600">
                                <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#5f3dc4]" />
                                  Date
                                </div>
                              </TableHead>
                        <TableHead className="w-[300px] font-medium text-gray-600">
                                <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[#5f3dc4]" />
                                  Student Details
                                </div>
                              </TableHead>
                        <TableHead className="w-[150px] font-medium text-gray-600">
                                <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-[#5f3dc4]" />
                                  Course
                                </div>
                              </TableHead>
                        <TableHead className="font-medium text-gray-600">Transaction ID</TableHead>
                        <TableHead className="font-medium text-gray-600">Status</TableHead>
                        <TableHead className="font-medium text-gray-600">Referred By</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                            {filteredRequests.map((request, index) => (
                        <TableRow 
                          key={request._id} 
                          className={cn(
                            "hover:bg-[#e6e0f7]/20 transition-colors border-[#e6e0f7]",
                            selectedRequests.includes(request._id) && "bg-[#e6e0f7]/30"
                          )}
                        >
                                {isSelectionMode && (
                                  <TableCell className="py-3">
                                    <Checkbox 
                                      checked={selectedRequests.includes(request._id)}
                                      onCheckedChange={(checked: boolean) => handleSelectOne(checked, request._id)}
                                    />
                                  </TableCell>
                                )}
                          <TableCell className="py-3 text-center font-medium text-gray-600">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="py-3 align-top">
                        {formatDate(request.createdAt)}
                      </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex flex-col gap-0.5">
                                    <span className={cn(
                                      "font-medium text-sm",
                                !request.userId?.name && "text-gray-500 italic"
                                    )}>
                                      {request.userId?.name || 'User not found'}
                                    </span>
                              <div className="flex flex-col text-xs text-gray-500">
                                      <span className="flex items-center gap-1.5">
                                        <Hash className="h-3 w-3" />
                                  <Badge variant="outline" className="font-mono text-[10px] h-4 border-[#e6e0f7] bg-[#e6e0f7]/10">
                                          {request.userId?.userId || 'N/A'}
                                        </Badge>
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate">{request.userId?.email || request.email}</span>
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <Phone className="h-3 w-3" />
                                        <span>{request.mobile}</span>
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  {request.courseId?.title || request.courseName || 'Unknown Course'}
                                </TableCell>
                                <TableCell className="py-3">{request.transactionId}</TableCell>
                                <TableCell className="py-3">{getStatusBadge(request.status)}</TableCell>
                                <TableCell className="py-3">
                            <Badge 
                          variant="outline" 
                              className={cn(
                                "font-medium bg-[#e6e0f7]/10 border-[#e6e0f7]",
                                !request.referredBy && "text-gray-400 italic"
                              )}
                            >
                                    {request.referredBy || 'No Referral'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 hover:bg-[#e6e0f7]"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                      </Button>
                                    </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end"
                                className="w-48 bg-white border border-[#e6e0f7] shadow-lg rounded-xl"
                              >
                                      <DropdownMenuItem
                                        onClick={() => handleViewScreenshot(request)}
                                  className="gap-2 text-gray-600 hover:text-[#5f3dc4] hover:bg-[#e6e0f7]/50 rounded-lg"
                                      >
                                  <Image className="h-4 w-4" />
                                        View Screenshot
                                      </DropdownMenuItem>
                                      {activeTab === 'deleted' ? (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => restoreMutation.mutate([request._id])}
                                      className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                                          >
                                            <RefreshCcw className="h-4 w-4" />
                                            Restore Request
                                          </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#e6e0f7]" />
                                          <DropdownMenuItem
                                            onClick={() => handleDelete([request._id])}
                                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            Permanently Delete
                                          </DropdownMenuItem>
                                        </>
                                      ) : (
                                        <>
                        {request.status === 'pending' && (
                                        <>
                                          <DropdownMenuItem
                              onClick={() => handleApprove(request)}
                                          className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                            >
                                            <CheckCircle className="h-4 w-4" />
                              Approve
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                              onClick={() => handleReject(request)}
                                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                                            <XCircle className="h-4 w-4" />
                              Reject
                                          </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-[#e6e0f7]" />
                                        </>
                        )}
                                      <DropdownMenuItem
                                        onClick={() => handleDelete([request._id])}
                                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                            Delete
                                      </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                    </div>
                  ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
                    <div className="w-16 h-16 rounded-lg bg-[#e6e0f7] flex items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-[#5f3dc4]" />
                    </div>
                    <p className="text-base font-medium text-gray-900">
                          {activeTab === 'all' 
                            ? 'No enrollment requests found'
                            : `No ${activeTab} enrollment requests found`}
                        </p>
                        {searchTerm && (
                      <p className="text-sm text-gray-500">
                        Try adjusting your search term or clearing filters
                          </p>
                        )}
                      </div>
                    </div>
            )}
                </div>
          </div>
        </div>
      
        {/* Image Dialog */}
        <Dialog open={viewImageOpen} onOpenChange={setViewImageOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 rounded-xl bg-white shadow-xl border border-[#e6e0f7]">
            <DialogHeader className="p-6 border-b border-[#e6e0f7] bg-[#e6e0f7]/10">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Image className="h-5 w-5 text-[#5f3dc4]" />
                Transaction Screenshot
              </DialogTitle>
              <DialogDescription className="text-gray-500 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#5f3dc4]" />
                  {selectedRequest?.email}
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#5f3dc4]" />
                  {selectedRequest?.courseName}
                </div>
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="flex-1 overflow-auto p-6 bg-[#e6e0f7]/10">
                <div className="relative w-full min-h-[400px] bg-white rounded-xl overflow-hidden shadow-md border border-[#e6e0f7]">
                  {(!imageUrl || isRetrying) && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] opacity-25"></div>
                          <div className="h-12 w-12 rounded-full border-4 border-[#e6e0f7] border-r-[#5f3dc4] animate-spin"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] border-l-[#5f3dc4] animate-spin-reverse [animation-delay:-0.2s]"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] border-t-[#5f3dc4] animate-spin [animation-delay:-0.4s]"></div>
                        </div>
                        <p className="text-sm text-gray-500">Loading image...</p>
                      </div>
                    </div>
                  )}
                  {imageError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <div className="flex flex-col items-center gap-4 p-6 text-center max-w-sm">
                        <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center">
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900">Failed to load image</p>
                          <p className="text-sm text-gray-500 mt-1">The image might be unavailable or there was an error loading it.</p>
                        </div>
                      <Button
                        onClick={handleRetryImage}
                          disabled={isRetrying}
                          variant="outline"
                          className="mt-2 border-[#e6e0f7] hover:bg-[#e6e0f7]/50 text-[#5f3dc4]"
                        >
                          {isRetrying ? (
                            <>
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-[#5f3dc4] border-t-transparent mr-2" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <RefreshCcw className="w-4 h-4 mr-2" />
                        Retry
                            </>
                          )}
                      </Button>
                      </div>
                    </div>
                  ) : (
                    imageUrl && (
                      <img 
                        src={imageUrl}
                        alt="Transaction Screenshot" 
                        className="w-full h-auto object-contain"
                        onError={() => setImageError(true)}
                      />
                    )
                  )}
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