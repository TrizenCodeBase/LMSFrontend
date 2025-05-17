import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import { MCQQuestion } from "@/services/courseService";

interface MCQFormProps {
  mcqs: MCQQuestion[];
  onChange: (mcqs: MCQQuestion[]) => void;
  dayNumber: number;
}

const DEFAULT_QUESTION: MCQQuestion = {
  question: "",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ],
  explanation: ""
};

const MCQForm: React.FC<MCQFormProps> = ({ mcqs, onChange, dayNumber }) => {
  const [questions, setQuestions] = useState<MCQQuestion[]>(mcqs.length ? mcqs : []);

  const addQuestion = () => {
    const newQuestions = [...questions, { ...DEFAULT_QUESTION }];
    setQuestions(newQuestions);
    onChange(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    onChange(newQuestions);
  };

  const updateQuestion = (index: number, field: keyof MCQQuestion, value: string | any[]) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
    onChange(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: keyof MCQQuestion["options"][0], value: string | boolean) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = { 
      ...newQuestions[questionIndex].options[optionIndex], 
      [field]: value 
    };
    setQuestions(newQuestions);
    onChange(newQuestions);
  };

  const setCorrectOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.forEach((option, i) => {
      option.isCorrect = i === optionIndex;
    });
    setQuestions(newQuestions);
    onChange(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length < 6) { // Limit to 6 options
      newQuestions[questionIndex].options.push({ text: "", isCorrect: false });
      setQuestions(newQuestions);
      onChange(newQuestions);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    // Don't remove if it's the correct option or if there would be less than 2 options
    const isCorrect = newQuestions[questionIndex].options[optionIndex].isCorrect;
    if (newQuestions[questionIndex].options.length <= 2 || isCorrect) return;
    
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(newQuestions);
    onChange(newQuestions);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg">MCQ Questions for Day {dayNumber}</CardTitle>
        <Button 
          onClick={addQuestion} 
          type="button"
          className="text-sm p-2 h-8 sm:h-10 sm:p-4"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Question</span>
          <span className="sm:hidden ml-1">Add</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No questions added yet. Click "Add Question" to start creating quiz questions.
          </div>
        ) : (
          questions.map((question, qIndex) => (
            <div key={qIndex} className="space-y-4 border p-4 rounded-md relative">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Question {qIndex + 1}</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeQuestion(qIndex)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`question-${qIndex}`}>Question Text</Label>
                <Textarea
                  id={`question-${qIndex}`}
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                  placeholder="Enter your question here"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Answer Options</Label>
                <div className="space-y-3">
                  <RadioGroup 
                    value={question.options.findIndex(opt => opt.isCorrect).toString()} 
                    onValueChange={(value) => setCorrectOption(qIndex, parseInt(value))}
                    className="space-y-2"
                  >
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-option-${oIndex}`} />
                        <Input
                          className="flex-1"
                          value={option.text}
                          onChange={(e) => updateOption(qIndex, oIndex, "text", e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          required
                        />
                        {question.options.length > 2 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeOption(qIndex, oIndex)}
                            disabled={option.isCorrect}
                            className="h-8 w-8 p-0"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {question.options.length < 6 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addOption(qIndex)} 
                      className="mt-2"
                      type="button"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select the radio button next to the correct answer
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`explanation-${qIndex}`}>Explanation (Optional)</Label>
                <Textarea
                  id={`explanation-${qIndex}`}
                  value={question.explanation || ""}
                  onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                  placeholder="Explain why the correct answer is right (shown after answering)"
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default MCQForm;
