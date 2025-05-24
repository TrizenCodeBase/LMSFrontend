import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MCQQuestion } from '@/services/courseService';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubmitQuizToAssignments } from '@/services/assessmentService';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface MCQQuizProps {
  questions: MCQQuestion[];
  onComplete: (score: number) => void;
  onCancel: () => void;
  dayNumber?: number;
}

const MCQQuiz: React.FC<MCQQuizProps> = ({ questions, onComplete, onCancel, dayNumber }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>(Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  
  const submitQuizToAssignments = useSubmitQuizToAssignments();
  
  const handleOptionSelect = (optionIndex: number) => {
    const newSelectedOptions = [...selectedOptionIndices];
    newSelectedOptions[currentQuestionIndex] = optionIndex;
    setSelectedOptionIndices(newSelectedOptions);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
    } else {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        const selectedOptionIndex = selectedOptionIndices[index];
        if (selectedOptionIndex !== -1 && question.options[selectedOptionIndex].isCorrect) {
          correctAnswers++;
        }
      });
      const finalScore = Math.round((correctAnswers / questions.length) * 100);
      setScore(finalScore);
      setShowResults(true);
      
      // Create a map of selected answers
      const selectedAnswers: Record<string, string> = {};
      questions.forEach((question, index) => {
        if (selectedOptionIndices[index] >= 0) {
          selectedAnswers[question.question] = question.options[selectedOptionIndices[index]].text;
        }
      });
      
      // Submit to assignments
      if (courseId) {
        submitQuizToAssignments.mutate({
          courseId,
          dayNumber,
          title: `Day ${dayNumber} Quiz`,
          questions,
          selectedAnswers,
          score: finalScore
        }, {
          onSuccess: () => {
            toast({
              title: "Quiz submitted to assignments",
              description: "Your quiz has been graded and added to your assignments."
            });
          },
          onError: () => {
            toast({
              title: "Error submitting quiz",
              description: "There was an error submitting your quiz to assignments.",
              variant: "destructive"
            });
          }
        });
      }
      
      onComplete(finalScore);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowExplanation(false);
    }
  };

  const handleCheckAnswer = () => {
    setShowExplanation(true);
  };

  const getCurrentQuestion = () => questions[currentQuestionIndex];
  
  const isAnswerCorrect = () => {
    const selectedIndex = selectedOptionIndices[currentQuestionIndex];
    if (selectedIndex === -1) return false;
    return getCurrentQuestion().options[selectedIndex].isCorrect;
  };

  const isOptionSelected = selectedOptionIndices[currentQuestionIndex] !== -1;
  
  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center">No quiz questions available for this day.</p>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Quiz Results</CardTitle>
          <CardDescription className="text-center">
            You've completed the quiz for this day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <span className="text-2xl font-bold text-primary">{score}%</span>
            </div>
            <h3 className="text-lg font-medium">
              {score >= 70 ? "Great job!" : "Keep practicing!"}
            </h3>
            <p className="text-muted-foreground">
              You answered {score}% of the questions correctly
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setShowResults(false)} className="w-full">
            Review Questions
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
        <CardDescription>
          Test your understanding of the material from this day's lesson
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="text-lg font-medium">{getCurrentQuestion().question}</div>
          <RadioGroup 
            value={selectedOptionIndices[currentQuestionIndex].toString()} 
            onValueChange={(value) => handleOptionSelect(parseInt(value))}
            className="space-y-3"
          >
            {getCurrentQuestion().options.map((option, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center space-x-2 p-3 border rounded-md",
                  showExplanation && option.isCorrect && "bg-green-50 border-green-200",
                  showExplanation && !option.isCorrect && selectedOptionIndices[currentQuestionIndex] === index && "bg-red-50 border-red-200"
                )}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                  {option.text}
                </Label>
                {showExplanation && option.isCorrect && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
                {showExplanation && !option.isCorrect && selectedOptionIndices[currentQuestionIndex] === index && (
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </RadioGroup>
          
          {showExplanation && getCurrentQuestion().explanation && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="font-medium">Explanation:</p>
              <p className="text-muted-foreground">{getCurrentQuestion().explanation}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          {!showExplanation ? (
            <Button
              onClick={handleCheckAnswer}
              disabled={!isOptionSelected}
            >
              Check Answer
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
            >
              {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
            </Button>
          )}
        </div>
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleNextQuestion}>
            Submit Quiz
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MCQQuiz;
