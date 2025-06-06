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

interface MCQQuestion {
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

interface RoadmapDay {
  day: number;
  topics: string;
  video: string;
  mcqs: MCQQuestion[];
}

interface CourseData {
  _id: string;
  title: string;
  courseUrl: string;
  roadmap: RoadmapDay[];
}

interface QuizAttempt {
  dayNumber: number;
  score: number;
  completedAt: Date;
  totalQuestions: number;
  attemptNumber: number;
  isCompleted: boolean;
}

interface QuizSubmissionResponse {
  data: {
    dayNumber: number;
    score: number;
    submittedDate: string;
    questions: MCQQuestion[];
    attemptNumber: number;
    isCompleted: boolean;
  }[];
}

interface ProgressResponse {
  enrollment: {
    completedDays: number[];
    progress: number;
    status: string;
  }
}

const MAX_ATTEMPTS = 2;

const CourseQuizView = () => {
  const { courseId, dayNumber } = useParams<{ courseId: string; dayNumber: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizAttempt[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [quizNumber, setQuizNumber] = useState(1);

  const { data: course, isLoading: isLoadingCourse } = useCourseDetails(courseId) as { data: CourseData | undefined; isLoading: boolean };
  const currentDay = course?.roadmap?.find(day => day.day === parseInt(dayNumber || '1'));

  // Calculate quiz number based on total quizzes
  useEffect(() => {
    if (course?.roadmap) {
      const quizIndex = course.roadmap.findIndex(day => day.mcqs && day.mcqs.length > 0);
      if (quizIndex !== -1) {
        const quizCount = course.roadmap
          .slice(0, parseInt(dayNumber || '1'))
          .filter(day => day.mcqs && day.mcqs.length > 0)
          .length;
        setQuizNumber(quizCount);
      }
    }
  }, [course?.roadmap, dayNumber]);

  // Scroll to current day in sidebar
  useEffect(() => {
    const dayElement = document.getElementById(`day-${dayNumber}`);
    if (dayElement) {
      dayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [dayNumber]);

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
            attemptNumber: sub.attemptNumber,
            isCompleted: sub.isCompleted
          }))
          .sort((a: QuizAttempt, b: QuizAttempt) => b.attemptNumber - a.attemptNumber);

        setQuizResults(daySubmissions);
      } catch (error) {
        console.error('Error fetching quiz submissions:', error);
        toast({
          description: (
            <CustomToast 
              title="Error"
              description="Failed to load quiz results"
              type="error"
            />
          ),
          duration: 3000,
          className: "p-0 bg-transparent border-0"
        });
      } finally {
        setIsLoadingSubmissions(false);
      }
    };

    fetchQuizSubmissions();
  }, [course?.courseUrl, token, dayNumber, toast]);

  const handleQuizComplete = async (score: number, selectedAnswers: number[]) => {
    if (!course?.courseUrl || !token || !dayNumber || !course?._id) return;

    try {
      const attemptNumber = quizResults.length + 1;

      // Submit quiz results
      const response = await axios.post('/api/quiz-submissions', {
        courseUrl: course.courseUrl,
        dayNumber: parseInt(dayNumber),
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
          attemptNumber,
          isCompleted: score >= 10
        };

        setQuizResults(prev => [newAttempt, ...prev]);
        
        // Show appropriate message based on score
        if (score >= 70) {
          toast({
            description: (
              <CustomToast 
                title="Quiz Passed!"
                description={`Congratulations! You've passed the quiz with ${score}%. Great job!`}
                type="success"
              />
            ),
            duration: 5000,
            className: "p-0 bg-transparent border-0"
          });
        } else if (score >= 10) {
          toast({
            description: (
              <CustomToast 
                title="Quiz Completed - Not Passed"
                description={`You scored ${score}%. You need 70% or higher to pass. You can retake the quiz to improve your score.`}
                type="warning"
              />
            ),
            duration: 5000,
            className: "p-0 bg-transparent border-0"
          });
        } else {
          toast({
            description: (
              <CustomToast 
                title="Quiz Not Completed"
                description={`You scored ${score}%. You need at least 10% to complete the quiz.`}
                type="error"
              />
            ),
            duration: 3000,
            className: "p-0 bg-transparent border-0"
          });
        }

        setShowQuiz(false);
      }
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast({
        description: (
          <CustomToast 
            title="Error"
            description={error.response?.data?.message || "Failed to submit quiz. Please try again."}
            type="error"
          />
        ),
        duration: 3000,
        className: "p-0 bg-transparent border-0"
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
          <h1 className="text-2xl font-bold">Quiz {quizNumber}</h1>
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
                          {(quizResults.length < MAX_ATTEMPTS && !quizResults.some(r => r.isCompleted)) && (
                            <Button 
                              onClick={() => setShowQuiz(true)}
                              size="lg"
                              className="w-full max-w-sm mx-auto"
                            >
                              {quizResults.length > 0 ? 'Try Again' : 'Start Quiz'}
                            </Button>
                          )}
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
                    courseUrl={course.courseUrl || ''}
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
