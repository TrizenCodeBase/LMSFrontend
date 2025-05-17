
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudentAssessments, Assessment, useSubmitAssessment } from '@/services/assessmentService';
import { format } from 'date-fns';
import { Editor } from '@/components/Editor';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const AssessmentCard = ({ assessment }: { assessment: Assessment }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [code, setCode] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitAssessment = useSubmitAssessment();
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const answers = assessment.questions.map(question => {
        if (question.type === 'MCQ') {
          return {
            type: 'MCQ' as const,
            questionId: question._id,
            selectedAnswer: selectedAnswers[question._id] || '',
          };
        } else {
          return {
            type: 'CODING' as const,
            questionId: question._id,
            code: code[question._id] || '',
            language: 'javascript', // You might want to make this configurable
          };
        }
      });

      await submitAssessment.mutateAsync({
        assessmentId: assessment._id,
        answers,
      });

      toast({
        title: 'Success',
        description: 'Assessment submitted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{assessment.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Due: {format(new Date(assessment.dueDate), 'PPP')}
            </p>
          </div>
          <Badge variant={assessment.status === 'completed' ? 'secondary' : 'default'}>
            {assessment.status === 'completed' ? 'Completed' : 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-muted-foreground">{assessment.description}</p>

          {assessment.type === 'MCQ' ? (
            <div className="space-y-6">
              {assessment.questions.map((question, index) => (
                question.type === 'MCQ' && (
                  <div key={question._id} className="space-y-4">
                    <div className="font-medium">Question {index + 1}</div>
                    <p>{question.questionText}</p>
                    <RadioGroup
                      value={selectedAnswers[question._id]}
                      onValueChange={(value) => 
                        setSelectedAnswers(prev => ({ ...prev, [question._id]: value }))
                      }
                    >
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question._id}-${optionIndex}`} />
                          <Label htmlFor={`${question._id}-${optionIndex}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {assessment.questions.map((question, index) => (
                question.type === 'CODING' && (
                  <div key={question._id} className="space-y-4">
                    <div className="font-medium">Question {index + 1}</div>
                    <div className="prose prose-sm max-w-none">
                      <h4>Problem Statement</h4>
                      <p>{question.problemStatement}</p>
                      
                      <h4>Input Format</h4>
                      <p>{question.inputFormat}</p>
                      
                      <h4>Output Format</h4>
                      <p>{question.outputFormat}</p>
                      
                      <h4>Sample Code</h4>
                      <Editor
                        value={code[question._id] || question.sampleCode || ''}
                        onChange={(value) => setCode(prev => ({ ...prev, [question._id]: value }))}
                        language="javascript"
                        height="300px"
                      />
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {assessment.status !== 'completed' && (
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Assessments = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { data: assessments, isLoading } = useStudentAssessments(courseId, selectedDay);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  const dayAssessments = Array.from({ length: 30 }, (_, i) => {
    const dayNumber = i + 1;
    return {
      day: dayNumber,
      assessments: assessments?.filter(a => a.assignedDays.includes(dayNumber)) || [],
    };
  });

  const courseAssessments = assessments?.filter(a => !a.assignedDays.length) || [];

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={
                  assessments
                    ? (assessments.filter(a => a.status === 'completed').length / assessments.length) * 100
                    : 0
                } 
              />
              <p className="text-sm text-muted-foreground mt-2">
                {assessments?.filter(a => a.status === 'completed').length || 0} of{' '}
                {assessments?.length || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Days</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4">
                  {dayAssessments.map(({ day, assessments }) => (
                    assessments.length > 0 && (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          selectedDay === day
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Day {day}</span>
                          <Badge variant="outline">{assessments.length}</Badge>
                        </div>
                      </button>
                    )
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="day" className="space-y-4">
            <TabsList>
              <TabsTrigger value="day">Day Assessments</TabsTrigger>
              <TabsTrigger value="course">Course Assessments</TabsTrigger>
            </TabsList>

            <TabsContent value="day">
              {selectedDay ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Day {selectedDay} Assessments</h2>
                  {dayAssessments
                    .find(d => d.day === selectedDay)
                    ?.assessments.map(assessment => (
                      <AssessmentCard key={assessment._id} assessment={assessment} />
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a day to view its assessments
                </p>
              )}
            </TabsContent>

            <TabsContent value="course">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Course Assessments</h2>
                {courseAssessments.map(assessment => (
                  <AssessmentCard key={assessment._id} assessment={assessment} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Assessments;
