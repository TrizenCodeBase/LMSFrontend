import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, FileText, Calculator, ChevronRight, ChevronLeft, Trash2, ArrowLeft, Maximize2, Minimize2, Check, Timer, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubmitQuizToAssignments } from '@/services/assessmentService';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import QuizResults from './QuizResults';

interface MCQOption {
  text: string;
  isCorrect: boolean;
  _id?: string;
}

interface MCQQuestion {
  question: string;
  options: MCQOption[];
  correctAnswer?: number;
  explanation?: string;
}

interface MCQQuizProps {
  questions: MCQQuestion[];
  onComplete: (score: number, selectedAnswers: number[]) => void;
  onCancel: () => void;
  dayNumber?: number;
  courseUrl: string;
  quizNumber?: number;
}

const calculateScore = (questions: MCQQuestion[], selectedOptionIndices: number[]) => {
  const correctAnswers = selectedOptionIndices.reduce((count, selectedIndex, questionIndex) => {
    if (selectedIndex === -1) return count;
    const question = questions[questionIndex];
    if (!question.options || !question.options[selectedIndex]) return count;
    return count + (question.options[selectedIndex].isCorrect ? 1 : 0);
  }, 0);
  return Math.round((correctAnswers / questions.length) * 100);
};

const MCQQuiz: React.FC<MCQQuizProps> = ({ questions, onComplete, onCancel, dayNumber, courseUrl, quizNumber }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>(Array(questions.length).fill(-1));
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [lastScore, setLastScore] = useState(0);
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  const [timeSpent, setTimeSpent] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
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
    setLastScore(score);
    
    try {
      // Call onComplete with both score and selected answers
      onComplete(score, selectedOptionIndices);
      setShowResults(true);
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
    setAttemptNumber(prev => prev + 1);
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

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time spent
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <QuizResults
          questions={questions}
          selectedAnswers={selectedOptionIndices}
          onRetry={handleRetry}
          attemptNumber={attemptNumber}
          score={lastScore}
        />
          </div>
    );
  }

  return (
    <div className={cn(
      "bg-gradient-to-br from-background to-background/95 flex flex-col",
      isFullscreen ? "fixed inset-0 z-50 min-h-screen" : "min-h-[calc(100vh-4rem)]"
    )}>
      {/* Quiz Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-10"
      >
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h2 className="text-lg sm:text-xl font-semibold text-black">
                  Quiz {quizNumber || dayNumber}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs sm:text-sm whitespace-nowrap px-2 py-1">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                  <Badge variant="outline" className="flex gap-1.5 items-center text-xs sm:text-sm whitespace-nowrap px-2 py-1">
                  <Timer className="w-3 h-3" />
                  {formatTime(timeSpent)}
                </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="hover:bg-green-600/10 transition-colors h-9 w-9 sm:h-10 sm:w-10 shrink-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Progress 
              value={(currentQuestionIndex + 1) / questions.length * 100} 
              className="h-1.5 bg-green-600/10"
            />
          </div>
        </div>
      </motion.div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Main Quiz Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestionIndex}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-3 py-4 sm:p-6 md:p-8">
            {/* Question */}
              <div className="space-y-5">
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-base leading-relaxed sm:text-2xl font-semibold text-black mb-4">
                {currentQuestion.question}
                  </h3>
                </motion.div>
              
          <RadioGroup 
                value={selectedOptionIndices[currentQuestionIndex]?.toString()}
            onValueChange={(value) => handleOptionSelect(parseInt(value))}
                  className="space-y-3 sm:space-y-4"
          >
                {(currentQuestion.options || []).map((option, index) => (
                    <motion.div
                key={index} 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <Label
                        htmlFor={`option-${index}`}
                        className="block cursor-pointer"
                      >
                        <div 
                className={cn(
                            "group relative flex items-center space-x-3 rounded-xl border-2 p-4 transition-all duration-300",
                      selectedOptionIndices[currentQuestionIndex] === index
                              ? "border-green-600 bg-green-600/5 shadow-lg shadow-green-600/10"
                              : "hover:border-green-600/50 hover:bg-green-600/5 hover:shadow-md"
                          )}
                        >
                          <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                            selectedOptionIndices[currentQuestionIndex] === index
                              ? "border-green-600 bg-green-600 text-white scale-110"
                              : "border-muted-foreground/30 group-hover:border-green-600/50"
                          )}>
                            {selectedOptionIndices[currentQuestionIndex] === index && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </motion.div>
                            )}
                          </div>
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} className="sr-only" />
                          <span className="flex-1 text-sm leading-relaxed sm:text-base md:text-lg text-black">
                            {option.text}
                          </span>
                        </div>
                </Label>
                    </motion.div>
            ))}
          </RadioGroup>
            </div>
          </div>
          </motion.div>
        </AnimatePresence>

        {/* Right Sidebar - Question Navigation */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:w-[300px] border-t lg:border-t-0 lg:border-l bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-y-auto p-4 sm:p-6"
        >
          <div className="space-y-4 sm:space-y-6">
            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div 
                className="bg-white rounded-lg p-3 shadow-sm border"
                whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              >
                <div className="flex flex-col items-center">
                  <motion.div 
                    className="text-lg sm:text-2xl font-bold text-green-500"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                  {selectedOptionIndices.filter(i => i !== -1).length}
                  </motion.div>
                  <div className="text-xs text-black">Answered</div>
                </div>
              </motion.div>
              <motion.div 
                className="bg-white rounded-lg p-3 shadow-sm border"
                whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              >
                <div className="flex flex-col items-center">
                  <motion.div 
                    className="text-lg sm:text-2xl font-bold text-red-500"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                  {selectedOptionIndices.filter(i => i === -1).length}
                  </motion.div>
                  <div className="text-xs text-black">Pending</div>
                </div>
              </motion.div>
              <motion.div 
                className="bg-white rounded-lg p-3 shadow-sm border"
                whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              >
                <div className="flex flex-col items-center">
                  <motion.div 
                    className="text-lg sm:text-2xl font-bold text-blue-500"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {Math.round((selectedOptionIndices.filter(i => i !== -1).length / questions.length) * 100)}%
                  </motion.div>
                  <div className="text-xs text-black">Complete</div>
                </div>
              </motion.div>
            </div>

            {/* Question Navigation */}
            <motion.div 
              className="bg-white rounded-lg p-4 shadow-sm border"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="font-medium mb-3 text-sm text-black">Questions</h4>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => {
                  const isAnswered = selectedOptionIndices[index] !== -1;
                  const isCurrent = currentQuestionIndex === index;
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigateToQuestion(index)}
                      className={cn(
                        "relative h-10 w-10 rounded-lg font-medium text-sm transition-all duration-200",
                        isAnswered 
                          ? "bg-green-600 text-white shadow-md" 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                        isCurrent && "ring-2 ring-green-600 ring-offset-2"
                      )}
                    >
                      {index + 1}
                      {isAnswered && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Keyboard Shortcuts - Hidden on Mobile */}
            <motion.div 
              className="hidden sm:block bg-white/50 backdrop-blur-sm rounded-lg p-4 text-sm space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-medium mb-2 text-black">Keyboard Shortcuts</h4>
              <div className="flex items-center justify-between text-black">
                <span>←/→</span>
                <span>Navigate questions</span>
              </div>
              <div className="flex items-center justify-between text-black">
                <span>1-4</span>
                <span>Select answer</span>
              </div>
              <div className="flex items-center justify-between text-black">
                <span>F</span>
                <span>Toggle fullscreen</span>
            </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Action Buttons */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/50 p-4 sticky bottom-0"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleClearResponse}
            className="h-12 sm:h-11 text-sm hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 group"
          >
            <Trash2 className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
            Clear Response
          </Button>
          <div className="flex gap-3">
            {!isLastQuestion && (
              <Button 
                variant="default"
                onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                className="flex-1 sm:flex-none h-12 sm:h-11 text-sm bg-green-600 hover:bg-green-600/90 group"
              >
                Next Question
                <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered}
              className={cn(
                "flex-1 sm:flex-none h-12 sm:h-11 text-sm transition-all duration-200 group",
                allQuestionsAnswered 
                  ? "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
                  : "bg-gray-400 cursor-not-allowed"
              )}
            >
              <Award className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
              Submit Quiz
            </Button>
          </div>
        </div>
      </motion.div>
        </div>
  );
};

export default MCQQuiz;
