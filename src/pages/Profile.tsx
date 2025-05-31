import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useAllCourses, useEnrolledCourses } from "@/services/courseService";
import { useUserProfile } from '@/services/userService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { 
  BookOpen, Trophy, Star, Clock, GraduationCap, 
  Calendar, MessageSquare, Mail, MapPin, User, FileText,
  Link as LinkIcon, Copy, Check, Share2, Gift, Users2, Info, Camera
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Course } from '@/services/courseService';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type LocalUserSettings = {
  name?: string;
  email?: string;
  bio?: string;
  displayName?: string;
  createdAt?: string;
  referralCount: number;
  userId?: string;
  avatar?: string;
};

// Update Course interface to match courseService
interface CoursesResponse {
  data: Course[];
}

type AvatarStyle = {
  id: string;
  name: string;
  apiPath: string;
};

const AvatarSelector = ({
  username,
  currentAvatar,
  onSelect
}: {
  username: string;
  currentAvatar: string;
  onSelect: (url: string) => void;
}) => {
  const [selectedStyle, setSelectedStyle] = useState<string>("avataaars");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);

  const avatarStyles: AvatarStyle[] = [
    { id: "avataaars", name: "Default", apiPath: "avataaars" },
    { id: "pixel-art", name: "Pixel Art", apiPath: "pixel-art" },
    { id: "bottts", name: "Robots", apiPath: "bottts" },
    { id: "lorelei", name: "Lorelei", apiPath: "lorelei" },
    { id: "initials", name: "Initials", apiPath: "initials" },
    { id: "micah", name: "Micah", apiPath: "micah" },
  ];

  const generateAvatars = (style: string) => {
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      url: `https://api.dicebear.com/7.x/${style}/svg?seed=${username}-${i}`
    }));
  };

  return (
    <div className="w-full">
      <Tabs defaultValue={selectedStyle} onValueChange={setSelectedStyle}>
        <TabsList className="w-full grid grid-cols-3 md:grid-cols-6">
          {avatarStyles.map((style) => (
            <TabsTrigger 
              key={style.id} 
              value={style.id}
              className="text-xs"
            >
              {style.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {avatarStyles.map((style) => (
          <TabsContent key={style.id} value={style.id} className="mt-4">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="grid grid-cols-4 gap-4">
                {generateAvatars(style.apiPath).map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      setSelectedAvatar(avatar.url);
                      onSelect(avatar.url);
                    }}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-105",
                      selectedAvatar === avatar.url 
                        ? "border-primary ring-2 ring-primary ring-offset-2" 
                        : "border-muted-foreground/20 hover:border-primary/50"
                    )}
                  >
                    <img
                      src={avatar.url}
                      alt={`Avatar option ${avatar.id + 1}`}
                      className="w-full h-full p-2"
                    />
                    {selectedAvatar === avatar.url && (
                      <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const ReferralLinkSection = ({ 
  username,
  userId
}: { 
  username: string,
  userId: string 
}) => {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Fetch all available courses
  const { data: courses = [], isLoading: isLoadingCourses } = useAllCourses();

  const getReferralLink = () => {
    if (!selectedCourse || !userId) return "";
    return `https://lms.trizenventures.com/enroll?ref=${userId}&course=${selectedCourse}`;
  };

  const copyToClipboard = async () => {
    const link = getReferralLink();
    if (!link) {
      toast({
        title: "Select a Course",
        description: "Please select a course to generate a referral link.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Success",
        description: "Referral link copied to clipboard!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy referral link",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-[#F8F9FC] p-6 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#4338CA]">
            <Share2 className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Course Referral Program</h2>
          </div>
          <p className="text-muted-foreground">
            Share your favorite courses with friends and earn rewards
          </p>
        </div>

        {/* Course Selection */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Step 1: Select Course to Share
            </label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="bg-white border-[#E5E7EB] focus:ring-[#4338CA] focus:ring-offset-0">
                <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Choose a course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem 
                    key={course._id} 
                    value={course.courseUrl || course._id}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#4338CA]" />
                      {course.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Step 2: Copy Your Unique Referral Link
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={getReferralLink()}
                  readOnly
                  placeholder="Select a course to generate link"
                  className="bg-white border-[#E5E7EB] font-mono text-sm pr-20"
                />
                {selectedCourse && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Badge variant="secondary" className="bg-[#EEF2FF] text-[#4338CA]">
                      Your Link
                    </Badge>
                  </div>
                )}
              </div>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className={`flex-shrink-0 min-w-[100px] ${
                  copied ? 'bg-green-500 text-white hover:bg-green-600 border-green-500' : ''
                }`}
                disabled={!selectedCourse}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-[#F8F9FC] rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-[#4338CA] flex items-center gap-2">
              <Info className="h-4 w-4" />
              How the Referral Program Works
            </h3>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: "Select & Share",
                  description: "Choose a course and share your unique referral link with friends"
                },
                {
                  step: 2,
                  title: "Friend Enrolls",
                  description: "When your friend uses your link to enroll in the course"
                },
                {
                  step: 3,
                  title: "Earn Rewards",
                  description: "Get exclusive rewards for successful referrals"
                }
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                    <span className="text-xs font-semibold text-[#4338CA]">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const Profile = () => {
  // Get user data from auth context and profile data
  const { token, isAuthenticated, user } = useAuth();
  const { data: userProfile } = useUserProfile() as { data: LocalUserSettings | undefined };
  const { data: enrolledCourses = [] } = useEnrolledCourses(token);
  const queryClient = useQueryClient();

  // Use profile data or fallback
  const displayName = userProfile?.name || userProfile?.email?.split('@')[0] || "Anonymous User";

  // Add state for avatar URL
  const [avatarUrl, setAvatarUrl] = useState(
    userProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`
  );

  // Update useEffect to handle avatar URL updates when userProfile changes
  useEffect(() => {
    if (userProfile?.avatar) {
      setAvatarUrl(userProfile.avatar);
    }
  }, [userProfile]);

  // Add function to update avatar
  const handleAvatarChange = async (newAvatarUrl: string) => {
    try {
      // Update avatar in the backend using the configured axios instance
      const response = await axios.put('/api/users/profile', {
        avatar: newAvatarUrl
      });
      
      // Update local state
      setAvatarUrl(newAvatarUrl);
      
      // Invalidate the user profile query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate actual stats from enrolled courses and include referral count
  const completedCourses = enrolledCourses.filter(course => course.status === 'completed' && course.progress === 100);
  const coursesInProgress = enrolledCourses.filter(course => 
    course.status === 'started' && course.progress > 0 && course.progress < 100
  );

  // Filter only actually enrolled courses
  const actualEnrolledCourses = enrolledCourses.filter(course => 
    course.status && 
    ['enrolled', 'started', 'completed'].includes(course.status) &&
    course.title &&
    course.title.length > 0
  );
  
  const userData = {
    name: userProfile?.displayName || displayName,
    email: userProfile?.email || "No email provided",
    avatar: avatarUrl,
    bio: userProfile?.bio || "Learning and growing with every course",
    role: "Student",
    joinDate: new Date(userProfile?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    stats: {
      coursesCompleted: completedCourses.length,
      coursesInProgress: coursesInProgress.length,
      referralCount: userProfile?.referralCount || 0,
      averageGrade: 0
    },
    achievements: [
      { id: 1, title: "Course Explorer", description: "Complete your first course", progress: 0, icon: Trophy },
      { id: 2, title: "Quick Learner", description: "Maintain 90% average", progress: 0, icon: Star },
      { id: 3, title: "Active Learner", description: "Study consistently for 30 days", progress: 0, icon: Clock }
    ],
    recentActivity: actualEnrolledCourses
      .slice(0, 3)
      .map((course, index) => {
        const progress = typeof course.progress === 'number' ? course.progress : 0;
        return {
          id: index + 1,
          type: course.status === 'completed' ? 'course' : 'progress',
          title: course.status === 'completed' 
            ? `Completed ${course.title}` 
            : `Progress in ${course.title}: ${progress}%`,
          date: "Recently",
          progress: progress,
          icon: course.status === 'completed' ? BookOpen : Clock
        };
      })
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto bg-gray-50/50">
        {/* Profile Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-[#2D1F8F] to-[#4338CA] rounded-xl" />
          
          {/* Profile Info */}
          <div className="relative px-4 sm:px-6 -mt-16">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Avatar Section */}
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={userData.avatar} />
                    <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md hover:bg-primary/90 transition-colors">
                        <Camera className="h-4 w-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Choose Your Avatar</DialogTitle>
                        <DialogDescription>
                          Select from various styles to create your unique avatar
                        </DialogDescription>
                      </DialogHeader>
                      <AvatarSelector
                        username={userData.name}
                        currentAvatar={userData.avatar}
                        onSelect={handleAvatarChange}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                    <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                      <Mail className="h-4 w-4" />
                      {userData.email}
                    </p>
                    <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <User className="h-4 w-4" />
                      <code className="px-2 py-0.5 bg-primary/5 rounded text-sm font-mono">
                        {userProfile?.userId ? `TST${userProfile.userId.slice(-4)}` : 'TST****'}
                      </code>
                    </p>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      {userData.role}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {userData.joinDate}
                    </Badge>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4 items-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{userData.stats.coursesCompleted}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{userData.stats.coursesInProgress}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{userData.stats.referralCount}</p>
                    <p className="text-sm text-muted-foreground">Referrals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{userData.bio}</p>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.achievements.map((achievement) => (
                  <div key={achievement.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <achievement.icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                    <Progress value={achievement.progress} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="rounded-full p-2 bg-primary/10">
                        <activity.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.date}</p>
                        {activity.progress !== undefined && (
                          <Progress value={activity.progress} className="h-1.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Referral Section */}
            {isAuthenticated && user && (
              <ReferralLinkSection
                username={userData.name}
                userId={user._id}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;