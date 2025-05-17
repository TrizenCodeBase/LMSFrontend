import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  Users, 
  BookOpen, 
  Activity, 
  Clock, 
  RefreshCw, 
  TrendingUp 
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

const Analytics = () => {
  // State for real-time data management
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeUsers, setActiveUsers] = useState(218);
  const [todayEnrollments, setTodayEnrollments] = useState(24);
  const [enrollmentTrend, setEnrollmentTrend] = useState(12);

  // Simulated real-time data refresh
  const refreshData = () => {
    setIsRefreshing(true);
    
    // Simulate API fetch delay
    setTimeout(() => {
      // Update random data points to simulate real-time changes
      setActiveUsers(Math.floor(200 + Math.random() * 50));
      setTodayEnrollments(Math.floor(20 + Math.random() * 10));
      setEnrollmentTrend(Math.floor(8 + Math.random() * 8));
      
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Real-time data for charts
  const realtimeEnrollmentData = [
    { name: 'Jan', value: 400, trend: 5 },
    { name: 'Feb', value: 300, trend: -8 },
    { name: 'Mar', value: 600, trend: 20 },
    { name: 'Apr', value: 800, trend: 12 },
    { name: 'May', value: 700, trend: -3 },
    { name: 'Jun', value: 900, trend: 15 },
    { name: 'Jul', value: 1000, trend: 8 },
  ];

  const realtimeCourseCompletionData = [
    { name: 'React Basics', completed: 75, inProgress: 20, notStarted: 5 },
    { name: 'Advanced JS', completed: 60, inProgress: 30, notStarted: 10 },
    { name: 'UX Design', completed: 40, inProgress: 45, notStarted: 15 },
    { name: 'Data Science', completed: 30, inProgress: 50, notStarted: 20 },
    { name: 'Mobile Dev', completed: 50, inProgress: 35, notStarted: 15 },
  ];

  const realtimeUserActivityData = [
    { time: '09:00', users: 120 },
    { time: '10:00', users: 152 },
    { time: '11:00', users: 189 },
    { time: '12:00', users: 204 },
    { time: '13:00', users: 198 },
    { time: '14:00', users: 207 },
    { time: '15:00', users: activeUsers },
  ];

  const realtimePlatformUsageData = [
    { name: 'Desktop', value: 45 },
    { name: 'Mobile', value: 35 },
    { name: 'Tablet', value: 20 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatPercentage = (value) => `${value}%`;
  
  // KPI data for summary cards
  const kpiData = [
    {
      title: "Active Users",
      value: activeUsers,
      trend: 7.2,
      icon: Users,
      description: "Currently online"
    },
    {
      title: "Course Enrollments",
      value: todayEnrollments,
      trend: enrollmentTrend,
      icon: BookOpen,
      description: "Today"
    },
    {
      title: "Avg. Completion Rate",
      value: "68%",
      trend: 4.5,
      icon: Activity,
      description: "Last 30 days"
    },
    {
      title: "Avg. Session Duration",
      value: "24m",
      trend: -2.3,
      icon: Clock,
      description: "Per user"
    }
  ];

  // Mock data for charts
  const enrollmentData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 700 },
    { name: 'Jun', value: 900 },
    { name: 'Jul', value: 1000 },
  ];

  const courseCompletionData = [
    { name: 'React Basics', completed: 75, inProgress: 20, notStarted: 5 },
    { name: 'Advanced JS', completed: 60, inProgress: 30, notStarted: 10 },
    { name: 'UX Design', completed: 40, inProgress: 45, notStarted: 15 },
    { name: 'Data Science', completed: 30, inProgress: 50, notStarted: 20 },
    { name: 'Mobile Dev', completed: 50, inProgress: 35, notStarted: 15 },
  ];

  const engagementData = [
    { name: 'Week 1', hours: 12 },
    { name: 'Week 2', hours: 19 },
    { name: 'Week 3', hours: 15 },
    { name: 'Week 4', hours: 22 },
    { name: 'Week 5', hours: 18 },
    { name: 'Week 6', hours: 24 },
    { name: 'Week 7', hours: 21 },
    { name: 'Week 8', hours: 28 },
  ];

  const quizPerformanceData = [
    { name: 'Quiz 1', avgScore: 78 },
    { name: 'Quiz 2', avgScore: 82 },
    { name: 'Quiz 3', avgScore: 75 },
    { name: 'Quiz 4', avgScore: 89 },
    { name: 'Quiz 5', avgScore: 84 },
  ];

  const categoryDistributionData = [
    { name: 'Web Development', value: 35 },
    { name: 'Programming', value: 25 },
    { name: 'Design', value: 15 },
    { name: 'Data Science', value: 20 },
    { name: 'Mobile', value: 5 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Real-time Analytics</h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`p-2 rounded-full ${kpi.trend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <kpi.icon className={`h-5 w-5 ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <span className={`text-sm flex items-center mt-2 ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.trend >= 0 ? 
                        <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      }
                      {Math.abs(kpi.trend)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-4 h-auto gap-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollments</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
            <TabsTrigger value="usage" className="relative">
              User Activity
              <span className="absolute top-0 right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real-time Users Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Real-time User Activity</CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ChartContainer config={{
                      users: { theme: { light: "#0ea5e9", dark: "#38bdf8" } }
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={realtimeUserActivityData}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="users" 
                            stroke="#0ea5e9" 
                            fillOpacity={1} 
                            fill="url(#colorUsers)" 
                            name="Active Users"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Enrollment Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Monthly Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ChartContainer config={{
                      value: { theme: { light: "#8b5cf6", dark: "#a78bfa" } }
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={realtimeEnrollmentData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar 
                            dataKey="value" 
                            fill="var(--color-value)" 
                            name="Enrollments"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Course Completion Card */}
              <Card className="col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Top Courses by Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {realtimeCourseCompletionData.map((course, index) => {
                      const completionRate = (course.completed / (course.completed + course.inProgress + course.notStarted)) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{course.name}</span>
                            <span>{completionRate.toFixed(0)}%</span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Platform Usage Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Platform Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={realtimePlatformUsageData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {realtimePlatformUsageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip formatter={formatPercentage} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Enrollment Analytics Tab */}
          <TabsContent value="enrollment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Enrollment Analysis</CardTitle>
                <CardDescription>Monthly enrollment trends with growth indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ChartContainer config={{
                    value: { theme: { light: "#8b5cf6", dark: "#a78bfa" } },
                    trend: { theme: { light: "#10b981", dark: "#34d399" } }
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={realtimeEnrollmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[-20, 20]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="value" 
                          stroke="var(--color-value)" 
                          strokeWidth={2}
                          name="Enrollments"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="trend" 
                          stroke="var(--color-trend)"
                          strokeWidth={2}
                          name="Growth Rate (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Total Enrollments</h4>
                    <p className="text-2xl font-bold mt-1">4,700</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      8.2% increase
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Avg. Daily Enrollments</h4>
                    <p className="text-2xl font-bold mt-1">22</p>
                    <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Most Popular Course</h4>
                    <p className="text-lg font-bold mt-1">React Basics</p>
                    <p className="text-xs text-muted-foreground mt-1">186 new enrollments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Completion Analytics Tab */}
          <TabsContent value="completion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Completion Analysis</CardTitle>
                <CardDescription>Student progress across all courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ChartContainer config={{
                    completed: { theme: { light: "#10b981", dark: "#34d399" } },
                    inProgress: { theme: { light: "#f59e0b", dark: "#fbbf24" } },
                    notStarted: { theme: { light: "#ef4444", dark: "#f87171" } }
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={realtimeCourseCompletionData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" name="Completed" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="inProgress" stackId="a" fill="var(--color-inProgress)" name="In Progress" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="notStarted" stackId="a" fill="var(--color-notStarted)" name="Not Started" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-2 border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Overall Completion Rate</h4>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold">68%</p>
                      <p className="text-sm text-green-600 mb-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        4.5%
                      </p>
                    </div>
                    <Progress value={68} className="h-2 mt-2" />
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Avg. Completion Time</h4>
                    <p className="text-2xl font-bold mt-1">14 days</p>
                    <p className="text-xs text-muted-foreground mt-1">Per course</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Completion Certificates</h4>
                    <p className="text-2xl font-bold mt-1">342</p>
                    <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User Activity Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Real-time User Activity</CardTitle>
                  <CardDescription>Live monitoring of platform usage</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  Live Data
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] relative">
                  <div className="absolute top-0 right-0 bg-black/5 p-2 rounded-md z-10">
                    <div className="text-sm font-medium">Current Active Users: {activeUsers}</div>
                    <div className="text-xs text-muted-foreground">Refreshes automatically</div>
                  </div>
                  <ChartContainer config={{
                    users: { theme: { light: "#0ea5e9", dark: "#38bdf8" } }
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={realtimeUserActivityData}>
                        <defs>
                          <linearGradient id="colorUsers2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#0ea5e9" 
                          fillOpacity={1} 
                          fill="url(#colorUsers2)" 
                          name="Active Users"
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Most Active Course</div>
                    <div className="font-medium">Advanced React Development</div>
                    <div className="text-xs text-green-600">78 active users</div>
                  </div>
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Peak Usage Today</div>
                    <div className="font-medium">11:45 AM</div>
                    <div className="text-xs text-blue-600">204 concurrent users</div>
                  </div>
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">User Actions</div>
                    <div className="font-medium">1,246 actions in last hour</div>
                    <div className="text-xs text-orange-600">+18% from previous hour</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex justify-between">
                <span>Data refreshed at {lastUpdated.toLocaleTimeString()}</span>
                <span className="flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  User activity trend: Increasing
                </span>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
