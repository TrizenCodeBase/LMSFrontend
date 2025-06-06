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
  AlertTriangle,
  GraduationCap,
  CalendarDays,
  Clock,
  Users
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
      <div className="min-h-screen bg-[#f9f9fb] p-6 sm:p-8">
        {/* Header Section with Purple Theme */}
        <div className="mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#34226C] to-[#5f3dc4] p-6 shadow-lg">
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">User Management</h1>
                <p className="text-purple-100/80 text-sm mt-0.5">Manage and monitor user accounts</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-[url('/infinity-pattern.svg')] opacity-10" />
          </div>
        </div>

        {/* Tabs & Filters Section */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-purple-100/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex-1">
              <Tabs value={selectedTab} onValueChange={v => setSelectedTab(v as 'student' | 'instructor')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-[#e6e0f7] p-1 rounded-lg">
                  <TabsTrigger 
                    value="student"
                    className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5f3dc4] data-[state=active]:to-[#34226C] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      <span>Students</span>
                      <span className="ml-1.5 bg-white/20 text-inherit text-xs px-2 py-0.5 rounded-full">
                        {studentCount}
                      </span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="instructor"
                    className="rounded-lg px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5f3dc4] data-[state=active]:to-[#34226C] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      <span>Instructors</span>
                      <span className="ml-1.5 bg-white/20 text-inherit text-xs px-2 py-0.5 rounded-full">
                        {instructorCount}
                      </span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#5f3dc4] transition-colors" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  className="pl-10 pr-4 h-10 w-full sm:w-[300px] rounded-xl border-gray-200 focus:border-[#5f3dc4] focus:ring focus:ring-[#5f3dc4]/20 group-hover:border-[#5f3dc4]/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-gray-200 focus:border-[#5f3dc4] focus:ring focus:ring-[#5f3dc4]/20 hover:border-[#5f3dc4]/50 transition-all">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-purple-100/50">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#e6e0f7]/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] font-medium text-[#34226C]">No.</TableHead>
                  <TableHead className="font-medium text-[#34226C] w-[140px]">User ID</TableHead>
                  <TableHead className="font-medium text-[#34226C]">User Details</TableHead>
                  <TableHead className="font-medium text-[#34226C] hidden md:table-cell">Email</TableHead>
                  <TableHead className="font-medium text-[#34226C]">Role</TableHead>
                  <TableHead className="font-medium text-[#34226C]">Status</TableHead>
                  <TableHead className="font-medium text-[#34226C] hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full border-4 border-purple-100 opacity-25"></div>
                          <div className="h-12 w-12 rounded-full border-4 border-purple-100 border-r-[#5f3dc4] animate-spin"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-purple-100 border-l-[#5f3dc4] animate-spin-reverse [animation-delay:-0.2s]"></div>
                        </div>
                        <p className="text-sm text-gray-500 animate-pulse">Loading users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32">
                      <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                        <div className="p-3 rounded-full bg-red-50">
                          <AlertTriangle className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium">Failed to load users</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.location.reload()}
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32">
                      <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                        <div className="p-3 rounded-full bg-gray-50">
                          <Search className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium">No users found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow 
                      key={user._id || user.id} 
                      className="group hover:bg-[#e6e0f7]/20 transition-colors duration-200"
                    >
                      <TableCell className="font-medium text-gray-500 text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-xs font-medium text-[#34226C] bg-[#e6e0f7] px-2.5 py-1 rounded-lg border border-purple-200">
                            {user.userId || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm bg-gradient-to-br from-[#5f3dc4]/10 to-[#34226C]/10 group-hover:from-[#5f3dc4]/20 group-hover:to-[#34226C]/20 transition-all duration-300">
                            <AvatarFallback className="font-medium text-[#5f3dc4] group-hover:text-[#34226C] transition-colors">
                              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#5f3dc4] transition-colors">{user.name}</p>
                            <p className="text-xs text-gray-500 hidden sm:block md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          user.role === 'instructor'
                            ? 'bg-[#e6e0f7] text-[#34226C] hover:bg-[#e6e0f7]/80'
                            : 'bg-purple-100 text-[#5f3dc4] hover:bg-purple-200'
                        }>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CalendarDays className="h-4 w-4 text-[#5f3dc4]" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#e6e0f7]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] rounded-xl p-2">
                            <DropdownMenuItem 
                              onClick={() => handleUserAction('View', user)}
                              className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-[#e6e0f7]/50"
                            >
                              <Eye className="h-4 w-4 text-[#5f3dc4]" />
                              <span>View Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUserAction('Edit', user)}
                              className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-[#e6e0f7]/50"
                            >
                              <Edit className="h-4 w-4 text-[#5f3dc4]" />
                              <span>Edit Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status !== 'suspended' ? (
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('Suspend', user)}
                                className="flex items-center gap-2 rounded-lg cursor-pointer text-amber-600 hover:bg-amber-50"
                              >
                                <Ban className="h-4 w-4" />
                                <span>Suspend User</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('Activate', user)}
                                className="flex items-center gap-2 rounded-lg cursor-pointer text-emerald-600 hover:bg-emerald-50"
                              >
                                <UserCheck className="h-4 w-4" />
                                <span>Activate User</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleUserAction('Delete', user)}
                              className="flex items-center gap-2 rounded-lg cursor-pointer text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete User</span>
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
        </div>
      </div>

      {/* Confirmation Dialog with Updated Theme */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className={
                confirmAction === 'delete'
                  ? 'p-2 rounded-lg bg-red-100 text-red-600'
                  : confirmAction === 'suspend'
                  ? 'p-2 rounded-lg bg-amber-100 text-amber-600'
                  : 'p-2 rounded-lg bg-[#e6e0f7] text-[#5f3dc4]'
              }>
                {confirmAction === 'delete' ? <Trash2 className="h-5 w-5" /> :
                 confirmAction === 'suspend' ? <Ban className="h-5 w-5" /> :
                 <UserCheck className="h-5 w-5" />}
              </div>
              <span className={
                confirmAction === 'delete'
                  ? 'text-red-600'
                  : confirmAction === 'suspend'
                  ? 'text-amber-600'
                  : 'text-[#5f3dc4]'
              }>
                {confirmAction === 'delete' ? 'Delete User' : 
                 confirmAction === 'suspend' ? 'Suspend User' : 'Activate User'}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 mt-4">
              {confirmAction === 'delete' ? 
                <div className="space-y-2">
                  <p>Are you sure you want to delete <span className="font-medium text-gray-900">{selectedUser?.name}</span>?</p>
                  <p className="text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
                    This action cannot be undone. All user data will be permanently removed.
                  </p>
                </div> : 
               confirmAction === 'suspend' ? 
                <div className="space-y-2">
                  <p>Are you sure you want to suspend <span className="font-medium text-gray-900">{selectedUser?.name}</span>?</p>
                  <p className="text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm">
                    They will no longer be able to access their account until reactivated.
                  </p>
                </div> :
                <div className="space-y-2">
                  <p>Are you sure you want to activate <span className="font-medium text-gray-900">{selectedUser?.name}</span>?</p>
                  <p className="text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg text-sm">
                    They will regain full access to their account.
                  </p>
                </div>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-lg border-gray-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleConfirmAction();
              }}
              className={`rounded-lg transition-all duration-200 ${
                confirmAction === 'delete'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/40'
                  : confirmAction === 'suspend'
                  ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/40'
              }`}
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
