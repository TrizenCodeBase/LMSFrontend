import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import MCQQuiz from '@/components/MCQQuiz';
import { AlertCircle, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { CustomToast } from "@/components/ui/custom-toast";
import QuizResultsDisplay from '@/components/QuizResultsDisplay';
import { useCourseDetails } from '@/services/courseService';

interface QuizAttempt {
  dayNumber: number;
  score: number;
  completedAt: Date;
  totalQuestions: number;
  attemptNumber: number;
}

interface QuizSubmission {
  dayNumber: number;
  score: number;
  submittedDate: string;
  questions: any[];
  attemptNumber: number;
}

interface QuizSubmissionResponse {
  data: QuizSubmission[];
}

const CourseQuizView = () => {
  const { courseId, dayNumber } = useParams<{ courseId: string; dayNumber: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizAttempt[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

  const { data: course, isLoading: isLoadingCourse } = useCourseDetails(courseId);
  const currentDay = course?.roadmap.find(day => day.day === parseInt(dayNumber || '1'));

  // Fetch quiz submissions
  useEffect(() => {
    const fetchQuizSubmissions = async () => {
      if (!course?.courseUrl || !token || !dayNumber) return;
      
      try {
        const { data: responseData } = await axios.get<QuizSubmissionResponse>(`/api/quiz-submissions/${course.courseUrl}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const submissions = responseData.data;
        const dayNum = parseInt(dayNumber);
        const daySubmissions = submissions
          .filter((sub) => sub.dayNumber === dayNum)
          .map((sub) => ({
            dayNumber: sub.dayNumber,
            score: sub.score,
            completedAt: new Date(sub.submittedDate),
            totalQuestions: sub.questions.length,
            attemptNumber: sub.attemptNumber
          }))
          .sort((a: QuizAttempt, b: QuizAttempt) => b.attemptNumber - a.attemptNumber);

        setQuizResults(daySubmissions);
      } catch (error) {
        console.error('Error fetching quiz submissions:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz results",
          variant: "destructive"
        });
      } finally {
        setIsLoadingSubmissions(false);
      }
    };

    fetchQuizSubmissions();
  }, [course?.courseUrl, token, dayNumber, toast]);

  const handleQuizComplete = async (score: number, selectedAnswers: number[]) => {
    if (!course?.courseUrl || !token || !dayNumber) return;

    try {
      const attemptNumber = quizResults.length > 0 
        ? Math.max(...quizResults.map(a => a.attemptNumber)) + 1 
        : 1;

      const response = await axios.post('/api/quiz-submissions', {
        courseUrl: course.courseUrl,
        dayNumber: parseInt(dayNumber),
        title: `Day ${dayNumber} Quiz`,
        questions: currentDay?.mcqs,
        selectedAnswers,
        score,
        submittedDate: new Date().toISOString(),
        attemptNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        const newAttempt = {
          dayNumber: parseInt(dayNumber),
          score,
          completedAt: new Date(),
          totalQuestions: currentDay?.mcqs?.length || 0,
          attemptNumber
        };

        setQuizResults(prev => [newAttempt, ...prev]);
        setShowQuiz(false);
        
        toast({
          title: "Quiz completed",
          description: `You scored ${score}% on attempt ${attemptNumber}`,
        });
      }
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoadingCourse || !course || !currentDay) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          {isLoadingCourse ? (
            <div className="animate-spin"><AlertCircle className="h-6 w-6" /></div>
          ) : (
            <div className="flex items-center text-red-500">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>Error loading quiz content</span>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/course/${courseId}/weeks`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
          <h1 className="text-2xl font-bold">Day {dayNumber} Quiz</h1>
          <p className="text-muted-foreground mt-1">{currentDay.topics}</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoadingSubmissions ? (
              <div className="flex items-center justify-center p-8">
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading quiz results...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {!showQuiz ? (
                  <>
                    <div className="space-y-6">
                      <div className="grid gap-6 p-6 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Quiz Information</h4>
                            <p className="text-sm text-muted-foreground">
                              {currentDay.mcqs.length} multiple choice questions
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">No Time Limit</h4>
                            <p className="text-sm text-muted-foreground">
                              Take your time to answer carefully
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Instant Results</h4>
                            <p className="text-sm text-muted-foreground">
                              Get your score immediately after completion
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Button 
                            onClick={() => setShowQuiz(true)}
                            size="lg"
                            className="w-full max-w-sm mx-auto"
                          >
                            {quizResults.length > 0 ? 'Try Again' : 'Start Quiz'}
                          </Button>
                        </div>

                        {quizResults.length > 0 && (
                          <div className="pt-8 border-t">
                            <h3 className="text-lg font-semibold mb-4">Previous Attempts</h3>
                            <QuizResultsDisplay attempts={quizResults} />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <MCQQuiz
                    questions={currentDay.mcqs}
                    onComplete={handleQuizComplete}
                    onCancel={() => setShowQuiz(false)}
                    dayNumber={parseInt(dayNumber)}
                    courseUrl={course.courseUrl}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CourseQuizView; 