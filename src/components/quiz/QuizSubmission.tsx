import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';

interface QuizQuestion {
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

interface QuizSubmissionProps {
  courseUrl: string;
  dayNumber: number;
  questions: QuizQuestion[];
  onComplete?: (submission: any) => void;
}

interface QuizSubmissionResponse {
  message: string;
  submission: {
    userId: string;
    courseUrl: string;
    dayNumber: number;
    title: string;
    questions: QuizQuestion[];
    selectedAnswers: number[];
    score: number;
    submittedDate: string;
    attemptNumber: number;
    isCompleted: boolean;
  };
}

export const QuizSubmission = ({ courseUrl, dayNumber, questions, onComplete }: QuizSubmissionProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Calculate score
      const totalQuestions = questions.length;
      const correctAnswers = questions.filter((q, idx) => 
        q.options[selectedAnswers[idx]]?.isCorrect
      ).length;
      const calculatedScore = Math.round((correctAnswers / totalQuestions) * 100);
      setScore(calculatedScore);

      // Submit quiz
      const response = await axios.post<QuizSubmissionResponse>('/api/quiz-submissions', {
        courseUrl,
        dayNumber,
        title: `Day ${dayNumber} Quiz`,
        questions,
        selectedAnswers,
        score: calculatedScore,
        submittedDate: new Date()
      });

      // Invalidate leaderboard cache to trigger refresh
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      await queryClient.invalidateQueries({ queryKey: ['leaderboard', courseUrl] });

      // Call completion handler
      onComplete?.(response.data.submission);

    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of the component code ...
}; 