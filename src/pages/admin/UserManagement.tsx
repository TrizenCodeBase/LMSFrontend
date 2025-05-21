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

interface User {
  _id: string;
  id?: string;
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
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  
  // Fetch users data from API
  const { data, isLoading, error } = useAllUsers();
  const users = data || [];
  const updateUserStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableLoader colSpan={7} message="Loading users..." />
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-red-500">
                        <div className="flex justify-center items-center">
                          <AlertTriangle className="h-6 w-6 mr-2" />
                          <span>Failed to load users. Please try again.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No users found matching the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id || user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.lastActive)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                  )}
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
