import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useAllCourses } from "@/services/courseService";
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
  studentId,
  userId
}: { 
  username: string,
  studentId: string,
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
  const { data: enrolledCourses = [] } = useAllCourses();
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
  const coursesInProgress = enrolledCourses.filter(course => course.status === 'started' || (course.status === 'enrolled' && course.progress > 0));
  
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
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Left Column - Avatar and Basic Info */}
                <div className="flex flex-col items-center sm:items-start space-y-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-2 ring-primary/10">
                      <AvatarImage src={userData.avatar} />
                      <AvatarFallback>{userData.name[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute -bottom-2 -right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Choose Your Avatar</DialogTitle>
                          <DialogDescription>
                            Select from different avatar styles to personalize your profile
                          </DialogDescription>
                        </DialogHeader>
                        <AvatarSelector
                          username={displayName}
                          currentAvatar={userData.avatar}
                          onSelect={handleAvatarChange}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl font-bold">{userData.name}</h1>
                    <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <code className="px-2 py-0.5 rounded bg-primary/10 text-sm font-mono">
                        {userProfile?.userId || '****'}
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
            {/* Courses Completed Card */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-muted-foreground">
                    Courses Completed
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{userData.stats.coursesCompleted}</h3>
                </div>
                <div className="absolute right-2 top-2 text-muted-foreground/20">
                  <BookOpen className="h-12 w-12" />
                </div>
              </CardContent>
            </Card>

            {/* Courses In Progress Card */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-muted-foreground">
                    Courses In Progress
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{userData.stats.coursesInProgress}</h3>
                </div>
                <div className="absolute right-2 top-2 text-muted-foreground/20">
                  <Clock className="h-12 w-12" />
                </div>
              </CardContent>
            </Card>

            {/* Referral Count Card */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-muted-foreground">
                    Successful Referrals
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{userData.stats.referralCount}</h3>
                </div>
                <div className="absolute right-2 top-2 text-muted-foreground/20">
                  <Users2 className="h-12 w-12" />
                </div>
              </CardContent>
            </Card>

            {/* Average Grade Card */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Grade
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{userData.stats.averageGrade}%</h3>
                </div>
                <div className="absolute right-2 top-2 text-muted-foreground/20">
                  <Star className="h-12 w-12" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Section */}
          <ReferralLinkSection 
            username={displayName}
            studentId={userProfile?.userId || ''}
            userId={userProfile?.userId || ''}
          />

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
      </div>
    </DashboardLayout>
  );
};

export default Profile;