import React, { useState } from 'react';
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLeaderboard, LeaderboardMetrics } from "@/services/leaderboardService";
import { AvatarSelector } from "@/components/ui/avatar-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Medal, Trophy, Crown, BookOpen, Target, GraduationCap, BookOpenCheck, Brain, Filter, Users, BarChart3 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import axios from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper functions
const getProgressColor = (points: number) => {
  if (points >= 90) return "bg-green-500";
  if (points >= 70) return "bg-blue-500";
  if (points >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const getDefaultAvatarUrl = (name: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
};

// Podium Card Component
const PodiumCard = ({ 
  student, 
  position,
  onAvatarChange 
}: { 
  student: LeaderboardMetrics; 
  position: number;
  onAvatarChange?: (newAvatarUrl: string) => Promise<void>;
}) => {
  const cardColors = {
    1: "border-yellow-500/30 bg-white",
    2: "border-blue-500/30 bg-white",
    3: "border-emerald-500/30 bg-white"
  };

  const pointColors = {
    1: "bg-yellow-500",
    2: "bg-blue-500",
    3: "bg-emerald-500"
  };

  return (
    <Card className={cn(
      "overflow-hidden border backdrop-blur-sm",
      "rounded-3xl shadow-lg border-[1px]",
      cardColors[position as keyof typeof cardColors]
    )}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full text-base shadow-sm">
              {position === 1 ? (
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-gray-900">#{position}</span>
                </div>
              ) : (
                <span className="font-semibold text-gray-900">#{position}</span>
              )}
            </div>
            
            <div className="pt-6">
              {onAvatarChange ? (
                <AvatarSelector
                  currentAvatar={student.avatar}
                  name={student.name}
                  onAvatarChange={onAvatarChange}
                  className="h-16 w-16 mx-auto ring-2 ring-primary/10"
                />
              ) : (
                <Avatar className="h-16 w-16 mx-auto ring-2 ring-primary/10">
                  <AvatarImage 
                    src={student.avatar || getDefaultAvatarUrl(student.name)} 
                    alt={student.name} 
                  />
                  <AvatarFallback className="text-lg bg-gray-50">
                    {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">@{student.userId}</p>
              <h3 className="text-base font-medium text-gray-900">{student.name}</h3>
              <Badge 
                className={cn(
                  "px-3 py-1 text-sm font-medium text-white",
                  pointColors[position as keyof typeof pointColors]
                )}
              >
                {student.metrics.totalPoints} points
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-gray-900">{student.metrics.coursePoints}</div>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  Course Score
                </p>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-gray-900">{student.metrics.quizPoints}</div>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                  <Brain className="h-3.5 w-3.5" />
                  Quiz Score
                </p>
              </div>
            </div>

            <div>
              <Badge variant="secondary" className="flex items-center gap-1.5 mx-auto text-xs bg-gray-50 text-gray-600 px-3 py-1 border border-gray-200">
                <GraduationCap className="h-3.5 w-3.5" />
                {student.metrics.coursesEnrolled} Active Courses
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CourseResponse {
  _id: string;
  title: string;
  courseUrl: string;
}

interface ExtendedUser {
  id: string;
  name: string;
  avatar: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  updateUser: (user: ExtendedUser) => void;
}

interface LeaderboardMetricsWithCourses extends LeaderboardMetrics {
  metrics: {
    coursesEnrolled: number;
    coursePoints: number;
    quizPoints: number;
    totalPoints: number;
    enrolledCourses: string[];
  };
}

interface UserCourseEnrollment {
  _id: string;
  userId: string;
  courseId: string;
  progress?: number;
  daysCompletedPerDuration?: string;
  status?: string;
}

interface QuizSubmission {
  userId: string;
  courseUrl: string;
  dayNumber: number;
  score: number;
  submittedDate: string;
  isCompleted: boolean;
}

interface QuizAttempt {
  dayNumber: number;
  score: number;
  completedAt: Date;
  totalQuestions: number;
  attemptNumber: number;
  isCompleted: boolean;
}

interface UserResponse {
  _id: string;
  userId: string;
  name: string;
  avatar?: string;
}

type EnrolledStudent = {
  userId: string;
  name: string;
  avatar: string;
  rank: number;
  metrics: {
    coursesEnrolled: number;
    coursePoints: number;
    quizPoints: number;
    totalPoints: number;
    enrolledCourses: string[];
  };
};

const Leaderboard = () => {
  const auth = useAuth();
  const { user, updateUser } = auth as unknown as AuthContextType;
  const { data: leaderboardData, isLoading, error } = useLeaderboard();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);

  // Fetch courses on component mount
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get<CourseResponse[]>('/api/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toast({
          title: "Error",
          description: "Failed to load courses. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchCourses();
  }, [toast]);

  // Fetch enrolled students
  const fetchEnrolledStudents = React.useCallback(async (courseUrl: string) => {
    try {
      console.log('Fetching enrolled students for course:', courseUrl);
      
      // First get the course details to get the courseId
      const courseResponse = await axios.get<CourseResponse>(`/api/courses/url/${courseUrl}`);
      const course = courseResponse.data;
      
      if (!course || !course._id) {
        console.error('Course not found:', courseUrl);
        return;
      }

      console.log('Found course:', course);

      // Get enrollments using courseId
      const enrollmentsResponse = await axios.get<UserCourseEnrollment[]>(`/api/usercourses/course/${course._id}`);
      
      console.log('Found enrollments:', enrollmentsResponse.data);

      if (!enrollmentsResponse.data || enrollmentsResponse.data.length === 0) {
        console.log('No enrollments found for course:', courseUrl);
        setEnrolledStudents([]);
        return;
      }

      // Get user IDs from enrollments
      const userIds = enrollmentsResponse.data.map(enrollment => enrollment.userId);
      console.log('Found enrolled user IDs:', userIds);

      // Fetch quiz submissions for the course
      const { data: quizResponse } = await axios.get<{ data: { userId: string; averageScore: number }[] }>(`/api/quiz-submissions/${courseUrl}`);
      const userQuizScores = new Map(
        quizResponse.data.map(item => [item.userId, item.averageScore])
      );
      console.log('Found quiz scores:', userQuizScores);

      // Fetch user details one by one with userId field
      const userDetailsPromises = userIds.map(async (userId) => {
        try {
          const userResponse = await axios.get<UserResponse>(`/api/users/${userId}`);
          // If the user document doesn't have a userId field, use their _id
          const userData = userResponse.data;
          return {
            ...userData,
            userId: userData.userId || userData._id // Fallback to _id if userId is not present
          };
        } catch (error) {
          console.error(`Failed to fetch user details for userId ${userId}:`, error);
          return null;
        }
      });

      const userDetails = await Promise.all(userDetailsPromises);
      const validUserDetails = userDetails.filter((user): user is UserResponse => user !== null);
      console.log('Fetched user details:', validUserDetails);

      // Map user details to enrolled students format
      const students: EnrolledStudent[] = validUserDetails.map((user) => {
        const enrollment = enrollmentsResponse.data.find(e => e.userId === user._id);
        const [completedDays, totalDays] = (enrollment?.daysCompletedPerDuration || '0/0').split('/').map(Number);
        const coursePoints = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        const quizPoints = userQuizScores.get(user.userId) || userQuizScores.get(user._id) || 0;
        const studentTotalPoints = coursePoints + quizPoints;

        return {
          userId: user.userId, // Use the userId from the user document
          name: user.name,
          avatar: user.avatar || getDefaultAvatarUrl(user.name),
          rank: 0, // Will be updated after sorting
          metrics: {
            coursesEnrolled: 1,
            coursePoints: coursePoints,
            quizPoints: quizPoints,
            totalPoints: studentTotalPoints,
            enrolledCourses: [courseUrl]
          }
        };
      });

      // Sort students by total points (course points + quiz points)
      students.sort((a, b) => b.metrics.totalPoints - a.metrics.totalPoints);
      
      // Update ranks after sorting
      students.forEach((student, index) => {
        student.rank = index + 1;
      });

      console.log('Setting enrolled students:', students);
      setEnrolledStudents(students);

    } catch (error) {
      console.error('Failed to fetch enrolled students:', error);
      toast({
        title: "Error",
        description: "Failed to load enrolled students. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle course selection
  const handleCourseChange = async (value: string) => {
    console.log('Course selection changed to:', value);
    setSelectedCourse(value);
    
    if (value === "all") {
      setEnrolledStudents([]);
      return;
    }

    await fetchEnrolledStudents(value);
  };

  // Display rankings based on selection
  const displayedRankings = React.useMemo(() => {
    if (selectedCourse === "all") {
      return leaderboardData?.rankings || [];
    }
    return enrolledStudents;
  }, [selectedCourse, enrolledStudents, leaderboardData?.rankings]);

  // Get top 3 from rankings
  const topThree = displayedRankings.slice(0, 3);

  const handleAvatarChange = async (newAvatarUrl: string) => {
    if (!user) return;
    
    try {
      const response = await axios.put<{ user: ExtendedUser }>('/api/users/avatar', { avatar: newAvatarUrl });
      updateUser({
        ...user,
        avatar: response.data.user.avatar
      });
      toast({
        title: "Avatar Updated",
        description: "Your avatar has been successfully updated.",
      });
    } catch (error) {
      console.error('Failed to update avatar:', error);
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500 text-white";
      case 2:
        return "bg-gray-500 text-white";
      case 3:
        return "bg-amber-500 text-white";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-8">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 font-medium">Error loading students. Please try again later.</div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!leaderboardData?.rankings?.length) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 font-medium">No students found in the leaderboard yet.</div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header with Course Selection */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Leaderboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Track your progress and compete with other students</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-[280px]">
            <Select value={selectedCourse} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-full bg-gray-50/80 border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Filter by course" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Courses</SelectLabel>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.courseUrl} value={course.courseUrl}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Podium Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 rounded-xl" />
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto py-12 px-8">
            {/* Second Place */}
            <div className="md:mt-16 md:self-end">
              {topThree[1] && (
                <div className="transform md:scale-90 md:hover:scale-95 transition-all duration-300 hover:translate-y-[-4px]">
                  <PodiumCard 
                    student={topThree[1]} 
                    position={2}
                    onAvatarChange={topThree[1].userId === user?.id ? handleAvatarChange : undefined}
                  />
                </div>
              )}
            </div>

            {/* First Place */}
            <div className="md:order-2 md:-mt-4">
              {topThree[0] && (
                <div className="transform scale-100 md:hover:scale-105 transition-all duration-300 hover:translate-y-[-4px]">
                  <PodiumCard 
                    student={topThree[0]} 
                    position={1}
                    onAvatarChange={topThree[0].userId === user?.id ? handleAvatarChange : undefined}
                  />
                </div>
              )}
            </div>

            {/* Third Place */}
            <div className="md:mt-24 md:self-end md:order-3">
              {topThree[2] && (
                <div className="transform md:scale-80 md:hover:scale-85 transition-all duration-300 hover:translate-y-[-4px]">
                  <PodiumCard 
                    student={topThree[2]} 
                    position={3}
                    onAvatarChange={topThree[2].userId === user?.id ? handleAvatarChange : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        <Card className="overflow-hidden border-gray-200 bg-white rounded-xl shadow-sm">
          <CardHeader className="py-5 px-6 border-b border-gray-200 bg-gray-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-gray-500" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Complete Rankings
                </CardTitle>
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 px-2.5 py-1 font-medium">
                {selectedCourse === "all" 
                  ? "All courses" 
                  : courses.find(c => c.courseUrl === selectedCourse)?.title
                }
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-200">
                    <TableHead className="w-[70px] text-gray-500 font-medium">Rank</TableHead>
                    <TableHead className="text-gray-500 font-medium">Student</TableHead>
                    <TableHead className="text-center text-gray-500 font-medium">
                      <div className="flex items-center justify-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        Courses
                      </div>
                    </TableHead>
                    <TableHead className="text-center text-gray-500 font-medium">
                      <div className="flex items-center justify-center gap-1.5">
                        <BookOpenCheck className="h-4 w-4 text-gray-400" />
                        Course Score
                      </div>
                    </TableHead>
                    <TableHead className="text-center text-gray-500 font-medium">
                      <div className="flex items-center justify-center gap-1.5">
                        <Brain className="h-4 w-4 text-gray-400" />
                        Quiz Score
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-gray-500 font-medium pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Trophy className="h-4 w-4 text-gray-400" />
                        Total Score
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {displayedRankings.map((entry, index) => (
                      <motion.tr
                        key={entry.userId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "group relative border-gray-100",
                          entry.userId === user?.id && "bg-blue-50/50",
                          "hover:bg-gray-50/80 transition-all duration-200"
                        )}
                      >
                        <TableCell className="font-medium py-3">
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm",
                              entry.rank <= 3 
                                ? entry.rank === 1 
                                  ? "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-500/20"
                                  : entry.rank === 2
                                    ? "bg-blue-100 text-blue-700 ring-1 ring-blue-500/20"
                                    : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20"
                              : "bg-gray-100 text-gray-600 ring-1 ring-gray-500/20"
                            )}>
                              {entry.rank}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            {entry.userId === user?.id ? (
                              <AvatarSelector
                                currentAvatar={user.avatar}
                                name={entry.name}
                                onAvatarChange={handleAvatarChange}
                                className="h-10 w-10 ring-2 ring-white shadow-sm"
                              />
                            ) : (
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                <AvatarImage 
                                  src={entry.avatar || getDefaultAvatarUrl(entry.name)} 
                                  alt={entry.name} 
                                />
                                <AvatarFallback className="text-sm font-medium bg-gray-100 text-gray-600">
                                  {entry.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{entry.name}</div>
                              <div className="text-sm text-gray-500">@{entry.userId}</div>
                            </div>
                            {entry.userId === user?.id && (
                              <Badge className="bg-blue-50 text-blue-600 ml-2">You</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <Badge variant="secondary" className="font-medium px-2.5 py-1 bg-gray-100/80">
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="h-4 w-4 text-gray-500" />
                              {entry.metrics.coursesEnrolled}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <BookOpenCheck className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold text-gray-900">{entry.metrics.coursePoints}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <Brain className="h-4 w-4 text-emerald-500" />
                            <span className="font-semibold text-gray-900">{entry.metrics.quizPoints}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-3">
                          <Badge className={cn(
                            "font-semibold px-3 py-1 shadow-sm",
                            entry.rank <= 3 
                              ? entry.rank === 1 
                                ? "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-500/20"
                                : entry.rank === 2
                                  ? "bg-blue-100 text-blue-700 ring-1 ring-blue-500/20"
                                  : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20"
                            : "bg-gray-100 text-gray-600 ring-1 ring-gray-500/20"
                          )}>
                            <div className="flex items-center gap-1.5">
                              <Trophy className="h-4 w-4" />
                              {entry.metrics.totalPoints}
                            </div>
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard; 