import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

interface QuizAttempt {
  dayNumber: number;
  score: number;
  completedAt: Date;
  totalQuestions: number;
  attemptNumber: number;
  isCompleted: boolean;
}

interface QuizResultsDisplayProps {
  attempts: QuizAttempt[];
  onNextDay?: () => void;
}

const QuizResultsDisplay = ({ attempts }: QuizResultsDisplayProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-secondary";
    if (score >= 50) return "text-primary";
    return "text-destructive";
  };

  const getBgColor = (score: number) => {
    if (score >= 70) return "bg-secondary/10";
    if (score >= 50) return "bg-primary/10";
    return "bg-destructive/10";
  };

  return (
    <div className="space-y-4">
      {attempts.map((attempt, index) => (
        <Card key={index} className={`overflow-hidden transition-all duration-300 ${attempt.isCompleted ? 'border-green-500/20 bg-green-50/10' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {attempt.isCompleted ? (
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Attempt {attempt.attemptNumber}</h4>
                    <Badge variant={attempt.isCompleted ? "outline" : "secondary"} className={`text-xs ${attempt.isCompleted ? 'text-green-600 border-green-200 bg-green-50' : ''}`}>
                      {attempt.isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${
                  attempt.isCompleted ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {attempt.score}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Score
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuizResultsDisplay; 