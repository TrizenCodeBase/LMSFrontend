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
  const { data, isLoading } = useQuery({
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
  const requests = data || [];

  // Update counts whenever requests or deleted requests data changes
  useEffect(() => {
    if (requests || deletedData) {
      const newCounts = {
        approved: 0,
        rejected: 0,
        pending: 0,
        deleted: deletedData?.length || 0
      };

      if (requests) {
        requests.forEach(request => {
          newCounts[request.status] = (newCounts[request.status] || 0) + 1;
        });
      }
      
      setCounts(newCounts);
    }
  }, [requests, deletedData]);

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
      <div className="h-[calc(100vh-4rem)] overflow-hidden bg-gray-50/50">
        {/* Add Undo Delete Alert - Only show when not in deleted tab */}
        {showUndoDelete && recentlyDeletedRequests.length > 0 && activeTab !== 'deleted' && (
          <div className="fixed bottom-4 right-4 z-50">
            <Alert className="bg-white shadow-lg border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center gap-4">
                <span>
                  Deleted {recentlyDeletedRequests.length} request(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restoreMutation.mutate(recentlyDeletedRequests.map(r => r._id))}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Undo Delete
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <div className="h-full max-w-[1200px] mx-auto flex flex-col overflow-hidden">
          {/* Header and Stats Section - Fixed Height */}
          <div className="p-4 lg:p-6 pb-2 lg:pb-4 space-y-4 flex-none">
            {/* Header Section */}
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Enrollment Requests
                </h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Manage and track course enrollment requests
                </p>
              </div>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] })}
                variant="outline"
                className="self-start hover:shadow-md transition-all duration-200"
                size="sm"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-xl border-l-4",
                  "transform hover:-translate-y-1 hover:bg-green-50/50",
                  "border-l-green-500"
                )}
                onClick={() => setActiveTab('approved')}
              >
                <CardHeader className="p-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl lg:text-2xl font-bold text-green-600">{counts.approved}</CardTitle>
                      <CardDescription className="text-sm font-medium">Approved</CardDescription>
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-xl border-l-4",
                  "transform hover:-translate-y-1 hover:bg-red-50/50",
                  "border-l-red-500"
                )}
                onClick={() => setActiveTab('rejected')}
              >
                <CardHeader className="p-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl lg:text-2xl font-bold text-red-600">{counts.rejected}</CardTitle>
                      <CardDescription className="text-sm font-medium">Rejected</CardDescription>
                    </div>
                    <div className="p-2 bg-red-100 rounded-full">
                      <XCircle className="h-4 w-4 lg:h-5 lg:w-5 text-red-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-xl border-l-4",
                  "transform hover:-translate-y-1 hover:bg-yellow-50/50",
                  "border-l-yellow-500"
                )}
                onClick={() => setActiveTab('pending')}
              >
                <CardHeader className="p-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl lg:text-2xl font-bold text-yellow-600">{counts.pending}</CardTitle>
                      <CardDescription className="text-sm font-medium">Pending</CardDescription>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-xl border-l-4",
                  "transform hover:-translate-y-1 hover:bg-slate-50/50",
                  "border-l-slate-500"
                )}
                onClick={() => setActiveTab('deleted')}
              >
                <CardHeader className="p-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl lg:text-2xl font-bold text-slate-600">{counts.deleted}</CardTitle>
                      <CardDescription className="text-sm font-medium">Deleted</CardDescription>
                    </div>
                    <div className="p-2 bg-slate-100 rounded-full">
                      <Trash2 className="h-4 w-4 lg:h-5 lg:w-5 text-slate-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
        </div>

          {/* Main Content - Scrollable */}
          <div className="flex-1 min-h-0 px-2 pb-2 lg:px-4 lg:pb-4">
            <Card className="h-full flex flex-col overflow-hidden shadow-lg border-t-4 border-t-primary">
              <CardHeader className="border-b bg-muted/40 p-2 lg:p-3 flex-none">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <Button
                      variant={isSelectionMode ? "secondary" : "ghost"}
                      size="sm"
                      onClick={toggleSelectionMode}
                      className="gap-2"
                    >
                      <CheckSquare className={cn(
                        "h-4 w-4",
                        isSelectionMode ? "text-primary" : "text-muted-foreground"
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
                  <div className="relative w-full md:w-72 group">
                    <div className="absolute inset-0 bg-primary/10 rounded-lg -m-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 h-4 w-4 text-muted-foreground/70 group-hover:text-primary group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="Search by email, course, or Transaction ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-12 h-10 bg-white/50 hover:bg-white focus:bg-white transition-colors border-muted-foreground/20 hover:border-primary/50 focus:border-primary"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 p-1 hover:bg-muted rounded-full text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {searchTerm && (
                      <div className="absolute right-3 -top-1 -translate-y-full">
                        <Badge variant="secondary" className="text-xs font-normal px-2 py-0">
                          {filteredRequests.length} results
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
          </CardHeader>

              <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                <div className="p-2 lg:p-3 border-b flex-none">
                  <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                    <TabsList className="grid w-full grid-cols-5 rounded-lg bg-muted p-1 h-8 lg:h-9">
                      <TabsTrigger value="all" className="text-xs lg:text-sm rounded-md">
                        All Requests
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="text-xs lg:text-sm text-yellow-600 rounded-md">
                        Pending ({counts.pending})
                      </TabsTrigger>
                      <TabsTrigger value="approved" className="text-xs lg:text-sm text-green-600 rounded-md">
                        Approved ({counts.approved})
                      </TabsTrigger>
                      <TabsTrigger value="rejected" className="text-xs lg:text-sm text-red-600 rounded-md">
                        Rejected ({counts.rejected})
                      </TabsTrigger>
                      <TabsTrigger value="deleted" className="text-xs lg:text-sm text-slate-600 rounded-md">
                        Deleted ({counts.deleted})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex-1 overflow-auto">
            {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent"></div>
                        <p className="text-sm text-muted-foreground animate-pulse">Loading requests...</p>
                      </div>
                    </div>
                  ) : filteredRequests.length > 0 ? (
                    <div className="h-full">
                      <div className="relative min-h-full overflow-auto">
              <Table>
                          <TableHeader className="sticky top-0 z-10 bg-white border-b">
                            <TableRow className="hover:bg-transparent">
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
                              <TableHead className="w-[60px] font-medium">
                                <div className="flex items-center gap-2">
                                  S.No
                                </div>
                              </TableHead>
                              <TableHead className="w-[180px] font-medium">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  Date
                                </div>
                              </TableHead>
                              <TableHead className="w-[300px]">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary" />
                                  Student Details
                                </div>
                              </TableHead>
                              <TableHead className="w-[150px]">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                  Course
                                </div>
                              </TableHead>
                              <TableHead className="w-[150px]">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-primary" />
                                  Transaction ID
                                </div>
                              </TableHead>
                              <TableHead className="w-[120px]">Status</TableHead>
                              <TableHead className="w-[120px]">Screenshot</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                            {filteredRequests.map((request, index) => (
                              <TableRow key={request._id} className={cn(
                                  "hover:bg-muted/50 transition-colors",
                                  selectedRequests.includes(request._id) && "bg-muted/30"
                              )}>
                                {isSelectionMode && (
                                  <TableCell className="py-3">
                                    <Checkbox 
                                      checked={selectedRequests.includes(request._id)}
                                      onCheckedChange={(checked: boolean) => handleSelectOne(checked, request._id)}
                                    />
                                  </TableCell>
                                )}
                                <TableCell className="py-3 text-center font-medium text-muted-foreground">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="py-3 align-top">
                        {formatDate(request.createdAt)}
                      </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex flex-col gap-0.5">
                                    <span className={cn(
                                      "font-medium text-sm",
                                      !request.userId?.name && "text-muted-foreground italic"
                                    )}>
                                      {request.userId?.name || 'User not found'}
                                    </span>
                                    <div className="flex flex-col text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1.5">
                                        <Hash className="h-3 w-3" />
                                        <Badge variant="outline" className="font-mono text-[10px] h-4">
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewScreenshot(request)}
                                    className="gap-2 hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
                        >
                                    <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                                <TableCell className="py-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleViewScreenshot(request)}
                                        className="gap-2"
                                      >
                                        <Eye className="h-4 w-4" />
                                        View Screenshot
                                      </DropdownMenuItem>
                                      {activeTab === 'deleted' ? (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => restoreMutation.mutate([request._id])}
                                            className="gap-2 text-green-600"
                                          >
                                            <RefreshCcw className="h-4 w-4" />
                                            Restore Request
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => handleDelete([request._id])}
                                            className="gap-2 text-red-600"
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
                                            className="gap-2"
                            >
                                            <CheckCircle className="h-4 w-4" />
                              Approve
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                              onClick={() => handleReject(request)}
                                            className="gap-2"
                            >
                                            <XCircle className="h-4 w-4" />
                              Reject
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                        </>
                        )}
                                      <DropdownMenuItem
                                        onClick={() => handleDelete([request._id])}
                                        className="gap-2 text-red-600"
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
                        <div className="sticky bottom-0 py-2 px-3 text-sm text-muted-foreground bg-white border-t">
                          {isSelectionMode ? (
                            <span>
                              {selectedRequests.length} of {filteredRequests.length} selected
                            </span>
                          ) : (
                            <span>
                              Showing {filteredRequests.length} requests
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-2 text-center p-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          {activeTab === 'all' 
                            ? 'No enrollment requests found'
                            : `No ${activeTab} enrollment requests found`}
                        </p>
                        {searchTerm && (
                          <p className="text-xs text-muted-foreground">
                            Try adjusting your search term
                          </p>
                        )}
                      </div>
                    </div>
            )}
                </div>
          </CardContent>
        </Card>
          </div>
        </div>
      
        {/* Image Dialog */}
        <Dialog open={viewImageOpen} onOpenChange={setViewImageOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Transaction Screenshot
              </DialogTitle>
              <DialogDescription>
                {selectedRequest?.email} - {selectedRequest?.courseName}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="mt-4 flex flex-col items-center space-y-4">
                <div className="relative w-full min-h-[300px] bg-slate-50 rounded-lg overflow-hidden">
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
                        className="mt-2 gap-2"
                      >
                        <RefreshCcw className="h-4 w-4" />
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
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Screenshot
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(imageUrl, '_blank')}
                    disabled={!imageUrl || imageError}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
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

