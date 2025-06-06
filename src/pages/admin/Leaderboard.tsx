import React from 'react';
import AdminLayout from "@/components/layouts/AdminLayout";
import { useLeaderboard, LeaderboardMetrics } from "@/services/leaderboardService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// Reuse all the helper functions and components from the original Leaderboard
const getProgressColor = (points: number) => {
  if (points >= 90) return "bg-green-500";
  if (points >= 70) return "bg-blue-500";
  if (points >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const getDefaultAvatarUrl = (name: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
};

// Reuse the AnimatedCrown component
const AnimatedCrown = ({ position }: { position: number }) => {
  const colorByPosition = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-600"
  };

  return (
    <motion.div
      initial={{ y: -10, rotate: -15, opacity: 0 }}
      animate={{ 
        y: [-10, -5, -10],
        rotate: [-15, 0, -15],
        opacity: 1
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn(
        "absolute -top-8 left-1/2 -translate-x-1/2 z-30",
        colorByPosition[position]
      )}
    >
      {position === 1 ? (
        <Crown className="h-8 w-8 drop-shadow-lg" />
      ) : (
        <Medal className="h-7 w-7 drop-shadow-lg" />
      )}
    </motion.div>
  );
};

// Reuse the PodiumCard component
const PodiumCard = ({ 
  student, 
  position,
  onAvatarChange 
}: { 
  student: LeaderboardMetrics; 
  position: number;
  onAvatarChange?: (newAvatarUrl: string) => Promise<void>;
}) => {
  const heightByRank = {
    1: "h-[380px]",
    2: "h-[340px]",
    3: "h-[300px]"
  };

  const colorByRank = {
    1: {
      border: "border-yellow-400",
      ring: "ring-yellow-400",
      bg: "from-yellow-500/30 to-yellow-400/10",
      text: "text-yellow-500",
      glow: "shadow-[0_0_15px_rgba(234,179,8,0.3)]",
      score: "text-yellow-500"
    },
    2: {
      border: "border-blue-400",
      ring: "ring-blue-400",
      bg: "from-blue-500/30 to-blue-400/10",
      text: "text-blue-500",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
      score: "text-blue-500"
    },
    3: {
      border: "border-emerald-400",
      ring: "ring-emerald-400",
      bg: "from-emerald-500/30 to-emerald-400/10",
      text: "text-emerald-500",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
      score: "text-emerald-500"
    }
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay: position * 0.1 
      }}
      className="flex flex-col items-center relative"
    >
      {/* Crown for 1st place */}
      {position === 1 && (
        <motion.div
          initial={{ y: -10, rotate: -15, opacity: 0 }}
          animate={{ 
            y: [-10, -5, -10],
            rotate: [-15, 0, -15],
            opacity: 1
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 z-30"
        >
          <Crown className="h-8 w-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
        </motion.div>
      )}

      {/* Avatar Section */}
      <div className="relative z-20 -mb-8">
        <div className="relative">
          {onAvatarChange ? (
            <AvatarSelector
              currentAvatar={student.avatar}
              name={student.name}
              onAvatarChange={onAvatarChange}
              className={cn(
                "h-20 w-20 ring-4 ring-opacity-60 shadow-xl transform transition-transform hover:scale-105",
                colorByRank[position].ring
              )}
            />
          ) : (
            <Avatar className={cn(
              "h-20 w-20 ring-4 ring-opacity-60 shadow-xl",
              colorByRank[position].ring
            )}>
              <AvatarImage 
                src={student.avatar || getDefaultAvatarUrl(student.name)} 
                alt={student.name} 
              />
              <AvatarFallback className="text-xl font-semibold bg-gray-800 text-white">
                {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          {/* Position Badge */}
          <div className={cn(
            "absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 shadow-lg flex items-center justify-center border-2",
            colorByRank[position].border
          )}>
            <span className={cn("text-sm font-bold", colorByRank[position].text)}>#{position}</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <motion.div 
        whileHover={{ y: -5 }}
        className={cn(
          "w-[220px] relative rounded-2xl bg-gray-800/90 shadow-xl border border-opacity-30 backdrop-blur-sm overflow-hidden",
          heightByRank[position],
          colorByRank[position].border,
          colorByRank[position].glow
        )}
      >
        {/* Top colored section */}
        <div className={cn(
          "h-16 rounded-t-2xl bg-gradient-to-b",
          colorByRank[position].bg
        )} />

        {/* Content */}
        <div className="p-4 text-center mt-2">
          <div className="font-semibold text-gray-100 mb-1 text-sm leading-tight min-h-[32px] flex items-center justify-center">
            <span className="break-words hyphens-auto px-1 line-clamp-2">
              {student.name}
            </span>
          </div>
          <div className="text-xs text-gray-300 font-mono mb-3">
            @{student.userId}
          </div>

          {/* Total Points */}
          <div className={cn("text-3xl font-bold mb-3", colorByRank[position].score)}>
            {student.metrics.totalPoints}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-700/50 rounded-xl p-2 backdrop-blur-sm">
              <div className={cn("text-lg font-semibold", colorByRank[position].text)}>
                {student.metrics.coursePoints}
              </div>
              <div className="text-xs text-gray-300 font-medium">
                Course Score
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-2 backdrop-blur-sm">
              <div className={cn("text-lg font-semibold", colorByRank[position].text)}>
                {student.metrics.quizPoints}
              </div>
              <div className="text-xs text-gray-300 font-medium">
                Quiz Score
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface Course {
  _id: string;
  courseUrl: string;
  title: string;
}

interface UserCourse {
  userId: string;
  daysCompletedPerDuration: string;
}

interface QuizSubmission {
  userId: string;
  averageScore: number;
}

interface UserDetails {
  _id: string;
  userId: string;
  name: string;
  avatar?: string;
}

interface QuizResponse {
  data: QuizSubmission[];
}

interface LeaderboardData {
  rankings: LeaderboardMetrics[];
  currentUserRank: number;
}

const AdminLeaderboard = () => {
  const auth = useAuth();
  const { user, updateUser } = auth as any;
  const { data: leaderboardData, isLoading, error } = useLeaderboard();
  const { toast } = useToast();
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [enrolledStudents, setEnrolledStudents] = React.useState<LeaderboardMetrics[]>([]);
  const [selectedCourse, setSelectedCourse] = React.useState<string>("");

  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get<Course[]>('/api/courses');
        setCourses(response.data);
        if (response.data.length > 0) {
          setSelectedCourse(response.data[0].courseUrl);
          fetchEnrolledStudents(response.data[0].courseUrl);
        }
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

  const fetchEnrolledStudents = React.useCallback(async (courseUrl: string) => {
    try {
      console.log('Fetching enrolled students for course:', courseUrl);
      
      const courseResponse = await axios.get<Course>(`/api/courses/url/${courseUrl}`);
      const course = courseResponse.data;
      
      if (!course || !course._id) {
        console.error('Course not found:', courseUrl);
        return;
      }

      console.log('Found course:', course);

      const enrollmentsResponse = await axios.get<UserCourse[]>(`/api/usercourses/course/${course._id}`);
      
      console.log('Found enrollments:', enrollmentsResponse.data);

      if (!enrollmentsResponse.data || enrollmentsResponse.data.length === 0) {
        console.log('No enrollments found for course:', courseUrl);
        setEnrolledStudents([]);
        return;
      }

      const userIds = enrollmentsResponse.data.map(enrollment => enrollment.userId);
      console.log('Found enrolled user IDs:', userIds);

      const { data: quizResponse } = await axios.get<QuizResponse>(`/api/quiz-submissions/${courseUrl}`);
      const userQuizScores = new Map(
        quizResponse.data.map(item => [item.userId, item.averageScore])
      );
      console.log('Found quiz scores:', userQuizScores);

      const userDetailsPromises = userIds.map(async (userId) => {
        try {
          const userResponse = await axios.get<UserDetails>(`/api/users/${userId}`);
          const userData = userResponse.data;
          return {
            ...userData,
            userId: userData.userId || userData._id
          };
        } catch (error) {
          console.error(`Failed to fetch user details for userId ${userId}:`, error);
          return null;
        }
      });

      const userDetails = await Promise.all(userDetailsPromises);
      const validUserDetails = userDetails.filter((user): user is UserDetails => user !== null);
      console.log('Fetched user details:', validUserDetails);

      const students = validUserDetails.map((user) => {
        const enrollment = enrollmentsResponse.data.find(e => e.userId === user._id);
        const [completedDays, totalDays] = (enrollment?.daysCompletedPerDuration || '0/0').split('/').map(Number);
        const coursePoints = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        const quizPoints = userQuizScores.get(user.userId) || userQuizScores.get(user._id) || 0;
        const studentTotalPoints = coursePoints + quizPoints;

        return {
          userId: user.userId,
          name: user.name,
          avatar: user.avatar || getDefaultAvatarUrl(user.name),
          rank: 0,
          metrics: {
            coursesEnrolled: 1,
            coursePoints: coursePoints,
            quizPoints: quizPoints,
            totalPoints: studentTotalPoints,
            enrolledCourses: [courseUrl]
          }
        };
      });

      students.sort((a, b) => b.metrics.totalPoints - a.metrics.totalPoints);
      
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

  const handleCourseChange = async (value: string) => {
    console.log('Course selection changed to:', value);
    setSelectedCourse(value);
    
    if (value === "all") {
      setEnrolledStudents([]);
      return;
    }

    await fetchEnrolledStudents(value);
  };

  const displayedRankings = React.useMemo(() => {
    if (selectedCourse === "all") {
      return (leaderboardData as LeaderboardData)?.rankings || [];
    }
    return enrolledStudents;
  }, [selectedCourse, enrolledStudents, leaderboardData]);

  const topThree = displayedRankings.slice(0, 3);

  if (isLoading) {
    return (
      <AdminLayout>
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
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 font-medium">Error loading students. Please try again later.</div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 relative z-0">
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header with Stats */}
          <div className="grid gap-6">
            {/* Main Header */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#34226C] to-[#5f3dc4] p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white">Student Leaderboard</h1>
                  <p className="text-purple-100/80 text-sm mt-1">
                    Track and monitor student performance across courses
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-[260px]">
                    <Select value={selectedCourse} onValueChange={handleCourseChange}>
                      <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border-0 focus-visible:ring-2 focus-visible:ring-white/20">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-[#5f3dc4]" />
                          <SelectValue placeholder="Select a course" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-[#5f3dc4] font-semibold">Available Courses</SelectLabel>
                          <SelectItem value="all" className="focus:bg-purple-50">All Courses</SelectItem>
                          {courses.map(course => (
                            <SelectItem 
                              key={course.courseUrl} 
                              value={course.courseUrl}
                              className="focus:bg-purple-50"
                            >
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-[#e6e0f7] to-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-[#5f3dc4]" />
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="text-2xl font-bold text-[#5f3dc4]">{displayedRankings.length}</div>
                  <p className="text-sm text-[#5f3dc4]/80">
                    Active learners
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#e6e0f7] to-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
                  <CardTitle className="text-sm font-medium">Top Score</CardTitle>
                  <Trophy className="h-4 w-4 text-[#5f3dc4]" />
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="text-2xl font-bold text-[#5f3dc4]">
                    {displayedRankings[0]?.metrics.totalPoints || 0}
                  </div>
                  <p className="text-sm text-[#5f3dc4]/80">Highest achievement</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#e6e0f7] to-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
                  <CardTitle className="text-sm font-medium">Avg. Course Score</CardTitle>
                  <BookOpenCheck className="h-4 w-4 text-[#5f3dc4]" />
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="text-2xl font-bold text-[#5f3dc4]">
                    {Math.round(displayedRankings.reduce((acc, curr) => acc + curr.metrics.coursePoints, 0) / displayedRankings.length || 0)}
                  </div>
                  <p className="text-sm text-[#5f3dc4]/80">Course completion</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-[#e6e0f7] to-white border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
                  <CardTitle className="text-sm font-medium">Avg. Quiz Score</CardTitle>
                  <Brain className="h-4 w-4 text-[#5f3dc4]" />
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="text-2xl font-bold text-[#5f3dc4]">
                    {Math.round(displayedRankings.reduce((acc, curr) => acc + curr.metrics.quizPoints, 0) / displayedRankings.length || 0)}
                  </div>
                  <p className="text-sm text-[#5f3dc4]/80">Quiz performance</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Podium Section */}
          <div className="relative min-h-[600px] z-[1]">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-100/50 via-transparent to-gray-100/50 rounded-3xl" />
            <div className="relative flex items-end justify-center gap-0 max-w-3xl mx-auto py-20 px-4">
              {/* Second Place */}
              <div className="flex-1 flex justify-end -mr-4 z-[2]">
                {topThree[1] && <PodiumCard student={topThree[1]} position={2} />}
              </div>

              {/* First Place */}
              <div className="flex-1 flex justify-center z-[3]">
                {topThree[0] && <PodiumCard student={topThree[0]} position={1} />}
              </div>

              {/* Third Place */}
              <div className="flex-1 flex justify-start -ml-4 z-[1]">
                {topThree[2] && <PodiumCard student={topThree[2]} position={3} />}
              </div>
            </div>
          </div>

          {/* Enhanced Rankings Table */}
          <Card className="overflow-hidden border-purple-100 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader className="py-6 px-8 border-b border-purple-100/50 bg-gradient-to-r from-purple-50 via-white to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center border border-purple-200 shadow-sm">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      Student Rankings
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {selectedCourse === "all" 
                        ? "All Courses" 
                        : courses.find(c => c.courseUrl === selectedCourse)?.title}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-purple-50 text-purple-600 px-3 py-1.5 text-sm font-medium shadow-sm border border-purple-200">
                  <Users className="h-4 w-4 mr-1" />
                  {displayedRankings.length} Students
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-purple-100/50">
                      <TableHead className="w-[80px] text-gray-700 font-semibold">Rank</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Student</TableHead>
                      <TableHead className="text-center text-gray-700 font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <GraduationCap className="h-4 w-4 text-purple-500" />
                          Course Enrolled
                        </div>
                      </TableHead>
                      <TableHead className="text-center text-gray-700 font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <BookOpenCheck className="h-4 w-4 text-purple-500" />
                          Course Score
                        </div>
                      </TableHead>
                      <TableHead className="text-center text-gray-700 font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          Quiz Score
                        </div>
                      </TableHead>
                      <TableHead className="text-right text-gray-700 font-semibold pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <Trophy className="h-4 w-4 text-purple-500" />
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
                          className="group relative border-purple-100/50 hover:bg-purple-50/80 transition-all duration-200"
                        >
                          <TableCell className="font-medium py-3">
                            <div className="flex items-center gap-2">
                              <Badge className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono shadow-sm",
                                entry.rank <= 3 
                                  ? entry.rank === 1 
                                    ? "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 ring-1 ring-amber-200/50"
                                    : entry.rank === 2
                                      ? "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 ring-1 ring-blue-200/50"
                                      : "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50"
                                  : "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 ring-1 ring-gray-200/50"
                              )}>
                                {entry.rank}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                                <AvatarImage 
                                  src={entry.avatar || getDefaultAvatarUrl(entry.name)} 
                                  alt={entry.name} 
                                />
                                <AvatarFallback className="text-sm font-medium bg-gray-100 text-gray-600">
                                  {entry.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{entry.name}</div>
                                <div className="text-sm text-gray-500 font-mono">@{entry.userId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <Badge variant="secondary" className="font-mono px-2.5 py-1 bg-white text-gray-600 ring-1 ring-gray-200/50 shadow-sm">
                              <div className="flex items-center gap-1.5">
                                <GraduationCap className="h-4 w-4 text-gray-500" />
                                {entry.metrics.coursesEnrolled}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <BookOpenCheck className="h-4 w-4 text-purple-500" />
                              <span className="font-semibold font-mono text-gray-700">{entry.metrics.coursePoints}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <Brain className="h-4 w-4 text-emerald-500" />
                              <span className="font-semibold font-mono text-gray-700">{entry.metrics.quizPoints}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8 py-3">
                            <Badge className={cn(
                              "font-mono px-3 py-1 shadow-sm",
                              entry.rank <= 3 
                                ? entry.rank === 1 
                                  ? "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 ring-1 ring-amber-200/50"
                                  : entry.rank === 2
                                    ? "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 ring-1 ring-blue-200/50"
                                    : "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50"
                                : "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 ring-1 ring-gray-200/50"
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
      </div>
    </AdminLayout>
  );
};

export default AdminLeaderboard; 