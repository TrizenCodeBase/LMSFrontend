import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, XCircle, ClipboardList, Lock, Unlock } from "lucide-react";
import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  grade?: number;
  feedback?: string;
}

interface QuizSubmission {
  _id: string;
  title: string;
  courseId: string;
  courseName: string;
  dayNumber: number;
  score: number;
  questions: any[];
  selectedAnswers: Record<string, string>;
  submittedDate: string;
  completedAt: string;
  isCompleted: boolean;
  status: 'completed' | 'graded';
}

interface CourseQuiz {
  courseId: string;
  courseName: string;
  days: {
    [day: number]: {
      mcqs: any[];
      isLocked: boolean;
      isCompleted: boolean;
      submission?: QuizSubmission;
      courseId: string;
    }
  }
}

interface EnrolledCourse {
  _id: string;
  title: string;
  roadmap: {
    day: number;
    topics: string;
    video: string;
    mcqs: any[];
  }[];
  completedDays: number[];
}

const QuizCard = ({ 
  quiz, 
  dayNumber, 
  courseName 
}: { 
  quiz: CourseQuiz['days'][number], 
  dayNumber: number,
  courseName: string
}) => {
  const navigate = useNavigate();

  const getQuizStatus = () => {
    if (quiz.submission?.isCompleted) {
      const score = quiz.submission.score;
      return {
        label: 'Completed',
        color: score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500',
        icon: <CheckCircle className="h-4 w-4" />,
        score
      };
    }

    if (quiz.isLocked) {
      return {
        label: 'Locked',
        color: 'bg-gray-500',
        icon: <Lock className="h-4 w-4" />
      };
    }

    return {
      label: 'Available',
      color: 'bg-primary',
      icon: <Unlock className="h-4 w-4" />
    };
  };

  const handleStartQuiz = () => {
    navigate(`/course/${quiz.courseId}/weeks?day=${dayNumber}&startQuiz=true`);
  };

  const handleReviewQuiz = () => {
    navigate(`/course/${quiz.courseId}/weeks?day=${dayNumber}&review=true`);
  };

  const status = getQuizStatus();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 aspect-square flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Day {dayNumber}</h3>
              <p className="text-sm text-muted-foreground">{courseName}</p>
            </div>
            <Badge className={cn(
              "px-3 py-1 rounded-full",
              status.color,
              "text-white flex items-center gap-2"
            )}>
              {status.icon}
              {status.label}
            </Badge>
          </div>

          {quiz.submission?.isCompleted ? (
            <div className="space-y-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                {format(new Date(quiz.submission.completedAt), 'PP')}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Score</span>
                  <span className={cn(
                    "text-lg font-bold",
                    quiz.submission.score >= 70 ? "text-green-500" :
                    quiz.submission.score >= 50 ? "text-yellow-500" :
                    "text-red-500"
                  )}>{quiz.submission.score}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full",
                      quiz.submission.score >= 70 ? "bg-green-500" :
                      quiz.submission.score >= 50 ? "bg-yellow-500" :
                      "bg-red-500"
                    )}
                    style={{ width: `${quiz.submission.score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Questions</span>
                  <span>{Object.keys(quiz.submission.selectedAnswers).length} / {quiz.submission.questions.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="mb-4">
                {quiz.isLocked ? (
                  <Lock className="h-12 w-12 text-muted-foreground mb-2" />
                ) : (
                  <ClipboardList className="h-12 w-12 text-primary mb-2" />
                )}
                <p className="font-medium">{quiz.mcqs.length} Questions</p>
              </div>
              {quiz.isLocked && (
                <p className="text-sm text-muted-foreground">
                  Complete previous content to unlock
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6">
          {quiz.submission?.isCompleted ? (
            <Button 
              variant="outline" 
              className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
              onClick={handleReviewQuiz}
            >
              Review Quiz
            </Button>
          ) : !quiz.isLocked && (
            <Button 
              className="w-full"
              onClick={handleStartQuiz}
            >
              Start Quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CourseQuizzes = ({ 
  courseName, 
  days 
}: { 
  courseName: string, 
  days: CourseQuiz['days'] 
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{courseName}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(days)
          .sort(([dayA], [dayB]) => parseInt(dayA) - parseInt(dayB))
          .map(([day, quiz]) => (
            <QuizCard 
              key={day}
              quiz={quiz} 
              dayNumber={parseInt(day)} 
              courseName={courseName}
            />
          ))}
      </div>
    </div>
  );
};

const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'submitted':
        return 'bg-blue-500';
      case 'graded':
        return 'bg-green-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'submitted':
        return <FileText className="h-4 w-4" />;
      case 'graded':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 aspect-square flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">{assignment.title}</h3>
              <p className="text-sm text-muted-foreground">{assignment.course}</p>
            </div>
            <Badge className={cn(
              "px-3 py-1 rounded-full",
              getStatusColor(assignment.status),
              "text-white flex items-center gap-2"
            )}>
              {getStatusIcon(assignment.status)}
              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Due: {format(new Date(assignment.dueDate), 'PPP')}
            </div>

            {assignment.grade && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Grade</span>
                  <span className="text-lg font-bold text-green-500">{assignment.grade}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500"
                    style={{ width: `${assignment.grade}%` }}
                  />
                </div>
              </div>
            )}

            {assignment.feedback && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  {assignment.feedback}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 group-hover:bg-primary group-hover:text-white transition-colors"
          >
            View Details
          </Button>
          {assignment.status === 'pending' && (
            <Button className="flex-1">Submit</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Assignments = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { token, user } = useAuth();
  const [courseQuizzes, setCourseQuizzes] = useState<Record<string, CourseQuiz>>({});

  // Fetch quiz submissions
  const { data: quizSubmissions = [], isLoading: isLoadingSubmissions } = useQuery<QuizSubmission[]>({
    queryKey: ['quiz-submissions'],
    queryFn: async () => {
      if (!token) return [];
      try {
        const response = await axios.get<{ data: QuizSubmission[] }>('/api/student/quiz-submissions');
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch quiz submissions:', error);
        return [];
      }
    },
    enabled: !!token
  });

  // Fetch enrolled courses with their quizzes
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<EnrolledCourse[]>({
    queryKey: ['enrolled-courses'],
    queryFn: async () => {
      if (!token) return [];
      try {
        const response = await axios.get<{ data: EnrolledCourse[] }>('/api/student/enrolled-courses');
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch enrolled courses:', error);
        return [];
      }
    },
    enabled: !!token
  });

  // Fetch course assignments
  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery<Assignment[]>({
    queryKey: ['course-assignments', activeTab],
    queryFn: async () => {
      if (!token) return [];
      try {
        const response = await axios.get<{ data: Assignment[] }>(`/api/student/assignments${activeTab !== 'all' ? `?status=${activeTab}` : ''}`);
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        return [];
      }
    },
    enabled: !!token
  });

  // Process courses and quiz submissions to create courseQuizzes state
  useEffect(() => {
    const newCourseQuizzes: Record<string, CourseQuiz> = {};
    
    (courses as EnrolledCourse[]).forEach((course) => {
      if (!course.roadmap) return;
      
      const courseSubmissions = quizSubmissions.filter(sub => sub.courseId === course._id);
      const days: CourseQuiz['days'] = {};
      
      course.roadmap.forEach((day: any, index: number) => {
        if (!day.mcqs || day.mcqs.length === 0) return;
        
        const submission = courseSubmissions.find(sub => sub.dayNumber === day.day);
        const isLocked = index > 0 && !course.completedDays.includes(index);
        
        days[day.day] = {
          mcqs: day.mcqs,
          isLocked,
          isCompleted: course.completedDays.includes(day.day),
          submission,
          courseId: course._id
        };
      });
      
      if (Object.keys(days).length > 0) {
        newCourseQuizzes[course._id] = {
          courseId: course._id,
          courseName: course.title,
          days
        };
      }
    });
    
    setCourseQuizzes(newCourseQuizzes);
  }, [courses, quizSubmissions]);

  const isLoading = isLoadingSubmissions || isLoadingCourses || isLoadingAssignments;
  const hasItems = assignments.length > 0 || Object.keys(courseQuizzes).length > 0;

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Assignments</h1>
              <p className="text-muted-foreground mt-2">
                View and manage your course assignments and quiz submissions
              </p>
            </div>
          </div>

          <Tabs 
            defaultValue="all" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-8"
          >
            <div className="overflow-x-auto">
              <TabsList className="inline-flex min-w-max">
                <TabsTrigger value="all" className="px-6">All</TabsTrigger>
                <TabsTrigger value="pending" className="px-6">Pending</TabsTrigger>
                <TabsTrigger value="submitted" className="px-6">Submitted</TabsTrigger>
                <TabsTrigger value="graded" className="px-6">Graded</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-8">
              {!isLoading && hasItems ? (
                <div className="space-y-12">
                  {Object.entries(courseQuizzes).length > 0 && (
                    <div className="space-y-8">
                      <h2 className="text-2xl font-semibold">Course Quizzes</h2>
                      {Object.entries(courseQuizzes).map(([courseId, courseQuiz]) => (
                        <CourseQuizzes 
                          key={courseId} 
                          courseName={courseQuiz.courseName} 
                          days={courseQuiz.days} 
                        />
                      ))}
                    </div>
                  )}
                  
                  {assignments.length > 0 && (
                    <div className="space-y-8">
                      <h2 className="text-2xl font-semibold">Course Assignments</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {assignments.map(assignment => (
                          <AssignmentCard key={assignment.id} assignment={assignment} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No assignments found</h3>
                  <p className="mt-2 text-muted-foreground">
                    {isLoading ? 'Loading assignments...' : 'You have no assignments in this category.'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
