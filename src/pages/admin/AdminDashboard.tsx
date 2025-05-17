import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  Bell,
  AlertTriangle,
  UserCog,
  GraduationCap
} from "lucide-react";
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { PageLoader } from '@/components/loaders';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // Use real-time data
  const { data, isLoading, error, refetch } = useAdminDashboard();
  
  if (isLoading) {
    return (
      <AdminLayout>
        <PageLoader message="Loading dashboard data..." />
      </AdminLayout>
    );
  }
  
  if (error || !data) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[600px]">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium text-red-500">Failed to load dashboard data</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { title: "Total Students", value: data.userStats.totalStudents, icon: Users, color: "bg-blue-100 text-blue-600" },
    { title: "Total Courses", value: data.courseStats.totalCourses, icon: BookOpen, color: "bg-green-100 text-green-600" },
    { title: "Total Instructors", value: data.userStats.totalInstructors, icon: GraduationCap, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
          >
            Refresh Data
          </Button>
        </div>
        
        {/* Alerts Section */}
        <div className="space-y-4">
        {/* Pending Enrollments Alert */}
          {data.enrollmentStats.pendingEnrollments > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                  <Bell className="h-5 w-5" />
                </div>
                <span className="font-medium">
                    {data.enrollmentStats.pendingEnrollments} pending enrollment 
                    {data.enrollmentStats.pendingEnrollments === 1 ? ' request' : ' requests'} to review
                </span>
              </div>
              <Button 
                onClick={() => navigate('/admin/enrollment-requests')}
                variant="outline" 
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Review Requests
              </Button>
            </CardContent>
          </Card>
        )}
          
          {/* Pending Instructor Applications Alert */}
          {data.instructorStats.pendingApplications > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <span className="font-medium">
                    {data.instructorStats.pendingApplications} pending instructor 
                    {data.instructorStats.pendingApplications === 1 ? ' application' : ' applications'} to review
                  </span>
                </div>
                <Button 
                  onClick={() => navigate('/admin/instructor-approvals')}
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Review Applications
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card, index) => (
            <Card key={index}>
              <CardContent className="p-6 flex items-center space-x-4">
                <div className={`p-2.5 rounded-full ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <h3 className="text-2xl font-bold">{card.value.toLocaleString()}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and events on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentActivities.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity.action}</TableCell>
                    <TableCell>{activity.user}</TableCell>
                    <TableCell>{activity.time}</TableCell>
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

export default AdminDashboard;
