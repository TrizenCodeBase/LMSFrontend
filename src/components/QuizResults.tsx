import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCQOption {
  text: string;
  isCorrect: boolean;
  _id?: string;
}

interface MCQQuestion {
  question: string;
  options: MCQOption[];
  correctAnswer?: number;
}

interface QuizResultsProps {
  questions: MCQQuestion[];
  selectedAnswers: number[];
  onRetry: () => void;
  attemptNumber: number;
  score: number;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  questions,
  selectedAnswers,
  onRetry,
  attemptNumber,
  score
}) => {
  const isPerfectFirstAttempt = score === 100 && attemptNumber === 1;
  const canRetry = !isPerfectFirstAttempt && attemptNumber < 2;

  const handleRetry = () => {
    // Request fullscreen before retrying
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
    onRetry();
  };
  
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Quiz Results</h2>
          <p className="text-muted-foreground">
            Attempt {attemptNumber} • Score: {score}%
          </p>
          {isPerfectFirstAttempt ? (
            <div className="mt-2 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-800 flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-4 w-4" />
                <span>🎉 Excellent! You've achieved a perfect score on your first attempt!</span>
              </p>
            </div>
          ) : !canRetry ? (
            <div className="mt-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 text-center">
                You've used all your attempts for this quiz.
              </p>
            </div>
          ) : (
            <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 text-center">
                You have one more attempt available to improve your score.
            </p>
          </div>
          )}
        </div>

      <div className="space-y-4">
        {questions.map((question, index) => {
            const selectedOption = question.options[selectedAnswers[index]];
            const correctOption = question.options.find(opt => opt.isCorrect);
          const isCorrect = selectedOption?.isCorrect;

          return (
              <div key={index} className="space-y-2">
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">Question {index + 1}</p>
                    <p className="text-sm text-muted-foreground">{question.question}</p>
                  </div>
                </div>

                <div className="ml-7 space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        selectedAnswers[index] === optIndex && option.isCorrect && "bg-green-50 text-green-700 border border-green-200",
                        selectedAnswers[index] === optIndex && !option.isCorrect && "bg-red-50 text-red-700 border border-red-200",
                        option.isCorrect && selectedAnswers[index] !== optIndex && "bg-green-50 text-green-700 border border-green-200",
                        selectedAnswers[index] !== optIndex && !option.isCorrect && "bg-gray-50 border border-gray-200"
                      )}
                    >
                      {option.text}
                      {option.isCorrect && selectedAnswers[index] !== optIndex && (
                        <span className="ml-2 text-green-600">(Correct Answer)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          );
        })}
      </div>

        {canRetry && (
      <div className="flex justify-center pt-4">
        <Button 
              onClick={handleRetry} 
              className="min-w-[200px] group"
              size="lg"
        >
          Try Again
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizResults; 