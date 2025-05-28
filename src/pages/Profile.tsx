import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useEnrolledCourses } from "@/services/courseService";
import { useUserProfile } from '@/services/userService';
import { 
  BookOpen, Trophy, Star, Clock, GraduationCap, 
  Calendar, MessageSquare, Mail, MapPin, User, FileText
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    studentId: `TST${userProfile?.createdAt?.substring(0, 4) || '****'}`,
    joinDate: new Date(userProfile?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    stats: {
      coursesCompleted: completedCourses.length,
      coursesInProgress: coursesInProgress.length,
      assignmentsSubmitted: 0,
      averageGrade: 0
    },
    achievements: [
      { id: 1, title: "Course Explorer", description: "Complete your first course", progress: 0, icon: Trophy },
      { id: 2, title: "Quick Learner", description: "Maintain 90% average", progress: 0, icon: Star },
      { id: 3, title: "Active Learner", description: "Study consistently for 30 days", progress: 0, icon: Clock }
    ],
    recentActivity: enrolledCourses.slice(0, 3).map((course, index) => ({
      id: index + 1,
      type: course.status === 'completed' ? 'course' : 'progress',
      title: course.status === 'completed' 
        ? `Completed ${course.title}` 
        : `Progress in ${course.title}: ${course.progress}%`,
      date: "Recently",
      progress: course.progress,
      icon: course.status === 'completed' ? BookOpen : Clock
    }))
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Left Column - Avatar and Basic Info */}
              <div className="flex flex-col items-center sm:items-start space-y-4">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-2 ring-primary/10">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback>{userData.name[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold">{userData.name}</h1>
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <code className="px-2 py-0.5 rounded bg-primary/10 text-sm font-mono">
                      {userData.studentId}
                    </code>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{userData.email}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Additional Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-4 w-full">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">About Me</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{userData.bio}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {userData.role}
                      </Badge>
                      <Badge variant="outline" className="border-primary/20">
                        <Calendar className="h-3 w-3 mr-1" />
                        Member since {userData.joinDate}
                      </Badge>
                    </div>
                  </div>
                  <Link to="/settings">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(userData.stats).map(([key, value], index) => (
            <Card key={key} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-muted-foreground">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{value}</h3>
                </div>
                <div className="absolute right-2 top-2 text-muted-foreground/20">
                  {index === 0 && <BookOpen className="h-12 w-12" />}
                  {index === 1 && <Clock className="h-12 w-12" />}
                  {index === 2 && <FileText className="h-12 w-12" />}
                  {index === 3 && <Star className="h-12 w-12" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Achievements and Activity Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Achievements
              </CardTitle>
              <CardDescription>Track your learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.achievements.map((achievement) => (
                  <div key={achievement.id} className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <achievement.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                    <Progress value={achievement.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <activity.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                    {activity.type === 'progress' && (
                      <Progress value={activity.progress} className="h-1.5" />
                    )}
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