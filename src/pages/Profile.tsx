import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useEnrolledCourses } from "@/services/courseService";
import { useUserProfile } from '@/services/userService';
import { 
  BookOpen, Trophy, Star, Clock, GraduationCap, 
  Calendar, MessageSquare 
} from "lucide-react";

export type LocalUserSettings = {
  name?: string;
  email?: string;
  bio?: string;
  displayName?: string;
  createdAt?: string; // Added createdAt property
};

const Profile = () => {
  // Get user data from auth context and profile data
  const { token, isAuthenticated } = useAuth();
  const { data: userProfile } = useUserProfile() as { data: LocalUserSettings | undefined };
  const { data: enrolledCourses = [] } = useEnrolledCourses(token);

  // Use profile data or fallback
  const displayName = userProfile?.name || userProfile?.email?.split('@')[0] || "Anonymous User";

  // Calculate actual stats from enrolled courses
  const completedCourses = enrolledCourses.filter(course => course.status === 'completed' && course.progress === 100);
  const coursesInProgress = enrolledCourses.filter(course => course.status === 'started' || (course.status === 'enrolled' && course.progress > 0));
  
  const userData = {
    name: userProfile?.displayName || displayName,
    email: userProfile?.email || "No email provided",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`,
    bio: userProfile?.bio || "Learning and growing with every course",
    role: "Student",
    joinDate: new Date(userProfile?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    stats: {
      coursesCompleted: completedCourses.length,
      coursesInProgress: coursesInProgress.length,
      assignmentsSubmitted: 0,
      averageGrade: 0
    },
    achievements: [
      { id: 1, title: "Achievements", description: "Not Available", icon: Trophy },
      { id: 2, title: "Performance", description: "Not Available", icon: Star },
      { id: 3, title: "Activity", description: "Not Available", icon: Clock }
    ],
    recentActivity: enrolledCourses.slice(0, 3).map((course, index) => ({
      id: index + 1,
      type: course.status === 'completed' ? 'course' : 'progress',
      title: course.status === 'completed' 
        ? `Completed ${course.title}` 
        : `Progress in ${course.title}: ${course.progress}%`,
      date: "Recently",
      icon: course.status === 'completed' ? BookOpen : Clock
    }))
  };

  return (
    <DashboardLayout>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback>{userData.name[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{userData.name}</h1>
                    <p className="text-muted-foreground">{userData.email}</p>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md">{userData.bio}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge>{userData.role}</Badge>
                      <Badge variant="outline">Member since {userData.joinDate}</Badge>
                    </div>
                  </div>
                  <Link to="/settings" className="mt-4 sm:mt-0">
                    <Button variant="outline" className="w-full sm:w-auto">Edit Profile</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(userData.stats).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{value}</div>
                  <p className="text-sm text-muted-foreground">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Achievements and Activity Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <achievement.icon className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <activity.icon className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;