import React, { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Mail, MoreHorizontal, Trash2, Eye, MessageSquare } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { useContactRequests, useUpdateContactRequestStatus, ContactRequest } from '@/services/contactService';

const ContactRequests = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const { data = [] as ContactRequest[], isLoading } = useContactRequests();
  const updateStatusMutation = useUpdateContactRequestStatus();

  const getStatusBadge = (status: ContactRequest['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>;
      case 'read':
        return <Badge className="bg-gray-100 text-gray-800">Read</Badge>;
      case 'replied':
        return <Badge className="bg-green-100 text-green-800">Replied</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleViewDetails = (request: ContactRequest) => {
    // Mark as read when viewing
    if (request.status === 'new') {
      updateStatusMutation.mutate(
        { id: request._id, status: 'read' },
        {
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update status",
              variant: "destructive",
            });
          }
        }
      );
    }
    setSelectedRequest(request);
    setViewDetailsOpen(true);
  };

  const handleMarkAsReplied = (request: ContactRequest) => {
    updateStatusMutation.mutate(
      { id: request._id, status: 'replied' },
      {
        onSuccess: () => {
          toast({
            title: "Status updated",
            description: "Message marked as replied",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update status",
            variant: "destructive",
          });
        }
      }
    );
  };

  const filteredRequests = data.filter(request => {
    const matchesSearch = 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#f9f9fb] p-6 sm:p-8 space-y-6">
        {/* Header Section */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#34226C] to-[#5f3dc4] p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Contact Requests</h1>
              <p className="text-purple-100/80 text-sm mt-1">
                View and manage contact form submissions
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-[url('/infinity-pattern.svg')] opacity-10" />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-[#e6e0f7] shadow-md overflow-hidden">
          <div className="p-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f3dc4]" />
                <Input
                  placeholder="Search by name, email, or subject..."
                  className="pl-9 border-[#e6e0f7] focus:ring-2 focus:ring-[#e6e0f7] focus:border-[#5f3dc4]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full md:w-[180px] border-[#e6e0f7] focus:ring-2 focus:ring-[#e6e0f7] focus:border-[#5f3dc4]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-[#e6e0f7]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#e6e0f7]/10 hover:bg-[#e6e0f7]/10">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-[200px]">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] opacity-25"></div>
                            <div className="h-12 w-12 rounded-full border-4 border-[#e6e0f7] border-r-[#5f3dc4] animate-spin"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] border-l-[#5f3dc4] animate-spin-reverse [animation-delay:-0.2s]"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-[#e6e0f7] border-t-[#5f3dc4] animate-spin [animation-delay:-0.4s]"></div>
                          </div>
                          <p className="text-sm text-muted-foreground">Loading requests...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-[200px]">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-lg bg-[#e6e0f7] flex items-center justify-center">
                            <Mail className="h-8 w-8 text-[#5f3dc4]" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            No contact requests found matching the current filters.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => (
                      <TableRow key={request._id} className="hover:bg-[#e6e0f7]/10">
                        <TableCell className="font-medium">{request.name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.subject}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-[#e6e0f7]/50">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border border-[#e6e0f7] rounded-lg">
                              <DropdownMenuItem 
                                onClick={() => handleViewDetails(request)}
                                className="hover:bg-[#e6e0f7]/50 rounded-md"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {request.status !== 'replied' && (
                                <DropdownMenuItem 
                                  onClick={() => handleMarkAsReplied(request)}
                                  className="hover:bg-[#e6e0f7]/50 rounded-md"
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Mark as Replied
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-xl border border-[#e6e0f7]">
          <DialogHeader className="border-b border-[#e6e0f7] pb-4">
            <DialogTitle className="text-xl font-semibold text-[#34226C]">Contact Request Details</DialogTitle>
            <DialogDescription>
              Received on {selectedRequest && new Date(selectedRequest.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1 text-[#34226C]">Name</h4>
                  <p className="text-sm text-gray-600">{selectedRequest.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1 text-[#34226C]">Email</h4>
                  <p className="text-sm text-gray-600">{selectedRequest.email}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1 text-[#34226C]">Subject</h4>
                <p className="text-sm text-gray-600">{selectedRequest.subject}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1 text-[#34226C]">Message</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedRequest.message}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[#e6e0f7]">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                {selectedRequest.status !== 'replied' && (
                  <Button 
                    onClick={() => {
                      handleMarkAsReplied(selectedRequest);
                      setViewDetailsOpen(false);
                    }}
                    className="bg-[#5f3dc4] hover:bg-[#34226C] text-white"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Mark as Replied
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ContactRequests;