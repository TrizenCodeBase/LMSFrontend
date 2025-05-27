import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MCQQuestion } from '@/services/courseService';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface QuizResultsProps {
  questions: MCQQuestion[];
  selectedAnswers: number[];
  onRetry: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  questions,
  selectedAnswers,
  onRetry,
}) => {
  const totalQuestions = questions.length;
  const correctAnswers = selectedAnswers.reduce((count, selectedIndex, questionIndex) => {
    if (selectedIndex === -1) return count;
    const question = questions[questionIndex];
    const selectedOption = question.options[selectedIndex];
    return count + (selectedOption.isCorrect ? 1 : 0);
  }, 0);
  
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Score Overview */}
      <Card className="border-2">
        <CardHeader className="text-center pb-2">
          <CardTitle>Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-bold">
              {correctAnswers} / {totalQuestions}
            </div>
            <Progress value={score} className="w-full max-w-md h-2" />
            <p className="text-lg text-muted-foreground">
              You scored {score}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Question Breakdown</h3>
        {questions.map((question, index) => {
          const selectedAnswer = selectedAnswers[index];
          const selectedOption = selectedAnswer !== -1 ? question.options[selectedAnswer] : null;
          const isCorrect = selectedOption?.isCorrect;
          const correctOption = question.options.find(opt => opt.isCorrect);

          return (
            <Card key={index} className={cn(
              "border-l-4",
              isCorrect ? "border-l-green-500" : "border-l-red-500"
            )}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-2 flex-1">
                    <p className="font-medium">Question {index + 1}</p>
                    <p className="text-sm text-muted-foreground">{question.question}</p>
                    
                    {/* Selected Answer */}
                    {selectedOption && (
                      <div className={cn(
                        "p-2 rounded-md text-sm",
                        isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      )}>
                        <p className="font-medium">Your answer:</p>
                        <p>{selectedOption.text}</p>
                      </div>
                    )}
                    
                    {/* Show Correct Answer if Wrong */}
                    {!isCorrect && correctOption && (
                      <div className="p-2 rounded-md bg-green-50 text-green-700 text-sm">
                        <p className="font-medium">Correct answer:</p>
                        <p>{correctOption.text}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={onRetry}
          className="bg-primary hover:bg-primary/90"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default QuizResults; 