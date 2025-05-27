import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MCQQuestion } from '@/services/courseService';
import { AlertCircle, FileText, Calculator, ChevronRight, ChevronLeft, Trash2, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubmitQuizToAssignments } from '@/services/assessmentService';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import QuizResults from './QuizResults';

interface MCQQuizProps {
  questions: MCQQuestion[];
  onComplete: (score: number, selectedAnswers: number[]) => void;
  onCancel: () => void;
  dayNumber?: number;
  courseUrl: string;
}

const calculateScore = (questions: MCQQuestion[], selectedOptionIndices: number[]) => {
  const correctAnswers = selectedOptionIndices.reduce((count, selectedIndex, questionIndex) => {
    if (selectedIndex === -1) return count;
    const question = questions[questionIndex];
    const selectedOption = question.options[selectedIndex];
    return count + (selectedOption.isCorrect ? 1 : 0);
  }, 0);
  return Math.round((correctAnswers / questions.length) * 100);
};

const MCQQuiz: React.FC<MCQQuizProps> = ({ questions, onComplete, onCancel, dayNumber, courseUrl }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>(Array(questions.length).fill(-1));
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  
  const submitQuizToAssignments = useSubmitQuizToAssignments();
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Auto-enter fullscreen on component mount
  useEffect(() => {
    // Small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
          toast({
            title: "Fullscreen Error",
            description: "Could not enter fullscreen mode automatically. You can click the fullscreen button to try again.",
            variant: "destructive",
          });
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault(); // Prevent browser's default fullscreen behavior
        toggleFullscreen();
      } else if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else if (e.key >= '1' && e.key <= '4') {
        const optionIndex = parseInt(e.key) - 1;
        if (optionIndex < questions[currentQuestionIndex].options.length) {
          handleOptionSelect(optionIndex);
        }
      }
    };

    // Add fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [currentQuestionIndex, questions]);
  
  const handleOptionSelect = (optionIndex: number) => {
    const newSelectedOptions = [...selectedOptionIndices];
    newSelectedOptions[currentQuestionIndex] = optionIndex;
    setSelectedOptionIndices(newSelectedOptions);
  };

  const handleMarkForReviewAndNext = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      newSet.add(currentQuestionIndex);
      return newSet;
    });
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleClearResponse = () => {
    const newSelectedOptions = [...selectedOptionIndices];
    newSelectedOptions[currentQuestionIndex] = -1;
    setSelectedOptionIndices(newSelectedOptions);
  };

  const getQuestionStatus = (index: number) => {
    const isAnswered = selectedOptionIndices[index] !== -1;
    const isMarkedForReview = markedForReview.has(index);
    
    if (isMarkedForReview) return 'marked';
    if (isAnswered) return 'answered';
    return 'not-answered';
  };

  const handleSubmit = async () => {
    const score = calculateScore(questions, selectedOptionIndices);
    
    try {
      // Call onComplete with both score and selected answers
      onComplete(score, selectedOptionIndices);
    } catch (error) {
      console.error('Error submitting quiz:', error);
            toast({
        title: "Error",
        description: "Failed to save quiz results. Please try again.",
        variant: "destructive",
            });
          }
  };

  const handleRetry = () => {
    setShowResults(false);
    setSelectedOptionIndices(Array(questions.length).fill(-1));
    setMarkedForReview(new Set());
    setCurrentQuestionIndex(0);
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allQuestionsAnswered = selectedOptionIndices.every(index => index !== -1);

  // Add keyboard shortcuts tooltip
  const keyboardShortcuts = [
    { key: '←/→', description: 'Navigate questions' },
    { key: '1-4', description: 'Select answer' },
    { key: 'F', description: 'Toggle fullscreen' },
  ];

  if (showResults) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <QuizResults
          questions={questions}
          selectedAnswers={selectedOptionIndices}
          onRetry={handleRetry}
        />
          </div>
    );
  }

  return (
    <div className={cn(
      "bg-background flex flex-col",
      isFullscreen ? "fixed inset-0 z-50 min-h-screen" : "h-[calc(100vh-16rem)]"
    )}>
      {/* Quiz Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-semibold">Day {dayNumber} Quiz</h2>
                <span className="text-xs sm:text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
              <span>Marks: <span className="text-green-600 font-medium">1.00</span></span>
              <span>Negative: <span className="text-red-600 font-medium">0.00</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Main Quiz Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-3 sm:p-6">
            {/* Question */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-medium">Question {currentQuestionIndex + 1}</span>
              </div>
              
              <p className="text-base sm:text-lg">
                {currentQuestion.question}
              </p>
              
          <RadioGroup 
                value={selectedOptionIndices[currentQuestionIndex]?.toString()}
            onValueChange={(value) => handleOptionSelect(parseInt(value))}
                className="space-y-3 sm:space-y-4"
          >
                {currentQuestion.options.map((option, index) => (
              <div 
                key={index} 
                className={cn(
                      "flex items-center space-x-3 rounded-lg border p-3 sm:p-4 transition-colors",
                      selectedOptionIndices[currentQuestionIndex] === index
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-sm sm:text-base"
                    >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Question Navigation */}
        <div className="w-full lg:w-[280px] border-t lg:border-t-0 lg:border-l bg-muted/10 overflow-y-auto p-3 sm:p-4">
          <div className="space-y-4 sm:space-y-6">
            {/* Question Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                  {selectedOptionIndices.filter(i => i !== -1).length}
                </div>
                <span className="text-xs sm:text-sm">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                  {selectedOptionIndices.filter(i => i === -1).length}
                </div>
                <span className="text-xs sm:text-sm">Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">
                  0
                </div>
                <span className="text-xs sm:text-sm">Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                  {markedForReview.size}
                </div>
                <span className="text-xs sm:text-sm">Marked</span>
              </div>
            </div>

            {/* Question Navigation */}
            <div>
              <h4 className="font-medium mb-3 text-sm sm:text-base">Choose a Question</h4>
              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-4 gap-2 sm:gap-3">
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={cn(
                        "relative h-8 w-8 sm:h-10 sm:w-10",
                        "flex items-center justify-center",
                        "text-xs sm:text-sm font-medium text-white",
                        "clip-path-shield",
                        status === 'marked' && "bg-purple-500",
                        status === 'answered' && "bg-green-500",
                        status === 'not-answered' && "bg-red-500",
                        currentQuestionIndex === index && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="border-t bg-muted/5 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
          <div className="flex gap-2 sm:gap-3 order-2 sm:order-1">
          <Button
            variant="outline"
              onClick={handleMarkForReviewAndNext}
              className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10 bg-white hover:bg-gray-100 active:bg-gray-200 border-gray-200 hover:border-gray-300 transition-all"
          >
              Mark & Next
          </Button>
            <Button
              variant="outline" 
              onClick={handleClearResponse}
              className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10 bg-white hover:bg-gray-100 active:bg-gray-200 border-gray-200 hover:border-gray-300 transition-all"
            >
              Clear
            </Button>
          </div>
          <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
            {!isLastQuestion && (
              <Button 
                variant="default"
                onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-sm hover:shadow transition-all"
              >
                Save & Next
              </Button>
            )}
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered}
              className={cn(
                "flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10 bg-blue-800 text-white shadow-sm transition-all",
                !allQuestionsAnswered 
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-900 active:bg-blue-950 hover:shadow"
              )}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
        </div>
  );
};

export default MCQQuiz;
