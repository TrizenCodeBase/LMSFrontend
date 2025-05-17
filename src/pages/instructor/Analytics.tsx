import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Star, 
  TrendingUp,
  Download,
  Calendar
} from 'lucide-react';

const Analytics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const course = {
    id: courseId,
    title: 'Web Development Bootcamp',
    stats: {
      totalStudents: 234,
      activeStudents: 180,
      completionRate: 65,
      averageRating: 4.8,
      totalRevenue: 23400,
      monthlyRevenue: 3200
    },
    recentActivity: [
      {
        date: '2024-03-10',
        newEnrollments: 12,
        completions: 5,
        revenue: 1200
      },
      {
        date: '2024-03-09',
        newEnrollments: 8,
        completions: 3,
        revenue: 800
      }
    ],
    topLessons: [
      {
        title: 'Introduction to HTML',
        views: 450,
        completionRate: 95
      },
      {
        title: 'CSS Fundamentals',
        views: 380,
        completionRate: 88
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/instructor/courses')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
          <h1 className="text-3xl font-bold">{course.title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Select defaultValue="30">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {course.stats.activeStudents} active students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              of students completed the course
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.stats.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              out of 5.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${course.stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${course.stats.monthlyRevenue.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {course.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{activity.date}</div>
                    <div className="text-sm text-muted-foreground">
                      {activity.newEnrollments} new enrollments
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${activity.revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.completions} completions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Lessons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {course.topLessons.map((lesson, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{lesson.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {lesson.views} views
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {lesson.completionRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    completion rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics; 