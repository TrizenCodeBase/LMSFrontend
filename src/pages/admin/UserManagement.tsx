import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  Edit, 
  Ban, 
  Trash2, 
  UserCheck, 
  Eye,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableLoader } from '@/components/loaders';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface User {
  _id: string;
  id?: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastActive?: string;
  isActive?: boolean;
}

// Custom hook to get all users
const useAllUsers = () => {
  return useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await axios.get<User[]>('/api/admin/users');
      return response.data;
    }
  });
};

// Custom hook to update user status
const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string, status: string }) => {
      const response = await axios.put(`/api/admin/users/${userId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });
};

// Custom hook to delete a user
const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axios.delete(`/api/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });
};

const UserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'student' | 'instructor'>('student');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  
  // Fetch users data from API
  const { data, isLoading, error } = useAllUsers();
  const users = data || [];
  const updateUserStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  // Count users for each tab
  const studentCount = users.filter(u => u.role.toLowerCase() === 'student').length;
  const instructorCount = users.filter(u => u.role.toLowerCase() === 'instructor').length;

  const handleUserAction = (action: string, user: User) => {
    setSelectedUser(user);
    
    switch (action) {
      case 'View':
        // Navigate to user profile or show modal with details
        toast({
          title: "View user",
          description: `Viewing ${user.name}'s profile`,
          duration: 3000,
        });
        break;
      case 'Edit':
        // Navigate to edit user page or show edit modal
        toast({
          title: "Edit user",
          description: `Editing ${user.name}'s profile`,
          duration: 3000,
        });
        break;
      case 'Suspend':
        setConfirmAction('suspend');
        setIsConfirmDialogOpen(true);
        break;
      case 'Activate':
        setConfirmAction('activate');
        setIsConfirmDialogOpen(true);
        break;
      case 'Delete':
        setConfirmAction('delete');
        setIsConfirmDialogOpen(true);
        break;
      default:
    toast({
      title: `${action} user`,
      description: `${action} ${user.name} (${user.email})`,
      duration: 3000,
    });
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;
    
    try {
      switch (confirmAction) {
        case 'suspend':
          await updateUserStatusMutation.mutateAsync({ 
            userId: selectedUser._id || selectedUser.id || '', 
            status: 'suspended' 
          });
          toast({
            title: "User suspended",
            description: `${selectedUser.name} has been suspended successfully.`,
          });
          break;
        case 'activate':
          await updateUserStatusMutation.mutateAsync({ 
            userId: selectedUser._id || selectedUser.id || '', 
            status: 'active' 
          });
          toast({
            title: "User activated",
            description: `${selectedUser.name} has been activated successfully.`,
          });
          break;
        case 'delete':
          await deleteUserMutation.mutateAsync(selectedUser._id || selectedUser.id || '');
          toast({
            title: "User deleted",
            description: `${selectedUser.name} has been deleted successfully.`,
          });
          break;
      }
    } catch (error) {
      console.error(`Error performing action ${confirmAction}:`, error);
      toast({
        title: "Action failed",
        description: `Failed to ${confirmAction} user. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = user.role.toLowerCase() === selectedTab;
    const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary drop-shadow-sm">User Management</h2>
        </div>
        
        {/* Responsive Tabs */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <Tabs value={selectedTab} onValueChange={v => setSelectedTab(v as 'student' | 'instructor')} className="mb-4">
            <TabsList className="bg-white/90 rounded-xl shadow border flex gap-2 p-1 w-full sm:w-auto">
              <TabsTrigger value="student" className="flex-1 sm:flex-initial flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm sm:text-base data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Students
              <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">{studentCount}</span>
            </TabsTrigger>
              <TabsTrigger value="instructor" className="flex-1 sm:flex-initial flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm sm:text-base data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Instructors
              <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">{instructorCount}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        </div>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-semibold text-primary">{selectedTab === 'student' ? 'Students' : 'Instructors'}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Responsive Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8 rounded-lg border-primary focus:ring-2 focus:ring-primary/50 shadow-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-lg border-primary focus:ring-2 focus:ring-primary/50 shadow-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <hr className="my-2 border-blue-100" />
            
            {/* Responsive Table */}
            <div className="-mx-4 sm:mx-0 sm:rounded-xl border overflow-x-auto bg-white/90 shadow-lg">
              <Table className="min-w-[900px]">
                <TableHeader className="sticky top-0 z-10 bg-white/95 border-b shadow-sm">
                  <TableRow>
                    <TableHead className="py-2 text-sm sm:text-base font-semibold text-primary">S.No</TableHead>
                    <TableHead className="py-2 text-sm sm:text-base font-semibold text-primary">Name</TableHead>
                    <TableHead className="hidden sm:table-cell py-2 text-sm sm:text-base font-semibold text-primary">User ID</TableHead>
                    <TableHead className="hidden md:table-cell py-2 text-sm sm:text-base font-semibold text-primary">Email</TableHead>
                    <TableHead className="py-2 text-sm sm:text-base font-semibold text-primary">Role</TableHead>
                    <TableHead className="py-2 text-sm sm:text-base font-semibold text-primary">Status</TableHead>
                    <TableHead className="hidden lg:table-cell py-2 text-sm sm:text-base font-semibold text-primary">Joined</TableHead>
                    <TableHead className="hidden lg:table-cell py-2 text-sm sm:text-base font-semibold text-primary">Last Active</TableHead>
                    <TableHead className="py-2 text-sm sm:text-base font-semibold text-primary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableLoader colSpan={9} message="Loading users..." />
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-red-500">
                        <div className="flex justify-center items-center">
                          <AlertTriangle className="h-6 w-4 mr-2" />
                          <span>Failed to load users. Please try again.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                        No users found matching the current filters.
                      </TableCell>
                    </TableRow>
                  ) :
                    filteredUsers.map((user, index) => (
                      <TableRow key={user._id || user.id} className="hover:bg-blue-100/60 transition-colors group">
                        <TableCell className="font-medium text-center text-sm">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3 py-2">
                            <Avatar className="w-8 h-8 sm:w-9 sm:h-9 border shadow-sm bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-150">
                            <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
                          </Avatar>
                            <span className="truncate max-w-[100px] sm:max-w-[140px] text-sm group-hover:text-primary font-semibold transition-colors duration-150" title={user.name}>
                              {user.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="font-mono text-xs px-2 py-1 bg-muted/60 border-primary/20">
                            {user.userId || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell truncate max-w-[140px] text-sm" title={user.email}>
                          {user.email}
                        </TableCell>
                        <TableCell className="capitalize">
                          <Badge className={
                            user.role === 'instructor'
                              ? 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white transition-colors duration-150'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors duration-150'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{formatDate(user.lastActive)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem onClick={() => handleUserAction('View', user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction('Edit', user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status !== 'suspended' ? (
                                <DropdownMenuItem onClick={() => handleUserAction('Suspend', user)}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUserAction('Activate', user)}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleUserAction('Delete', user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'delete' ? 'Delete User' : 
               confirmAction === 'suspend' ? 'Suspend User' : 'Activate User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'delete' ? 
                `Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.` : 
               confirmAction === 'suspend' ? 
                `Are you sure you want to suspend ${selectedUser?.name}? They will no longer be able to access their account.` :
                `Are you sure you want to activate ${selectedUser?.name}? They will regain access to their account.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleConfirmAction();
              }}
              className={confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              disabled={updateUserStatusMutation.isPending || deleteUserMutation.isPending}
            >
              {(updateUserStatusMutation.isPending || deleteUserMutation.isPending) && 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction === 'delete' ? 'Delete' : 
               confirmAction === 'suspend' ? 'Suspend' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default UserManagement;
