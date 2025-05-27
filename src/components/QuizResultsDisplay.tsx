import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface QuizAttempt {
  dayNumber: number;
  score: number;
  completedAt: Date;
  totalQuestions: number;
  attemptNumber: number;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {attempts.map((attempt) => (
        <Card 
          key={attempt.attemptNumber}
          className={cn("transition-colors", getBgColor(attempt.score))}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Attempt {attempt.attemptNumber}</h4>
                <Badge className={cn(
                  "text-white",
                  attempt.score >= 70 ? "bg-secondary" : 
                  attempt.score >= 50 ? "bg-primary" : 
                  "bg-destructive"
                )}>
                  {attempt.score}%
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(attempt.completedAt, 'PP')}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span>Questions:</span>
                  <span>{attempt.totalQuestions}</span>
                </div>
                
                <div className="w-full bg-background/50 h-1.5 rounded-full">
                  <div 
                    className={cn(
                      "h-1.5 rounded-full",
                      attempt.score >= 70 ? "bg-secondary" : 
                      attempt.score >= 50 ? "bg-primary" : 
                      "bg-destructive"
                    )} 
                    style={{ width: `${attempt.score}%` }}
                  />
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