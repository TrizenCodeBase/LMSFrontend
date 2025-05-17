import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  useCreateAssessment, 
  useUploadAssessmentPDF, 
  AssessmentType,
  MCQQuestion,
  CodingQuestion,
  Assessment,
  Question,
} from '@/services/assessmentService';
import { MultiSelect } from '@/components/ui/multi-select';
import { Editor } from '@/components/Editor';

// Create a type for the form that doesn't include _id
type FormQuestion = Omit<MCQQuestion, '_id'> | Omit<CodingQuestion, '_id'>;

const mcqQuestionSchema = z.object({
  type: z.literal('MCQ'),
  questionText: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).length(4, 'Exactly 4 options are required'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  marks: z.number().int().positive(),
});

const codingQuestionSchema = z.object({
  type: z.literal('CODING'),
  problemStatement: z.string().min(1, 'Problem statement is required'),
  inputFormat: z.string().min(1, 'Input format is required'),
  outputFormat: z.string().min(1, 'Output format is required'),
  testCases: z.array(z.object({
    input: z.string().min(1, 'Input is required'),
    expectedOutput: z.string().min(1, 'Expected output is required'),
    isHidden: z.boolean().optional(),
  })).min(1, 'At least one test case is required'),
  marks: z.number().int().positive(),
  sampleCode: z.string().optional(),
});

const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['MCQ', 'CODING'] as const),
  questions: z.array(z.discriminatedUnion('type', [
    mcqQuestionSchema,
    codingQuestionSchema,
  ])),
  assignedDays: z.array(z.number()).min(1, 'At least one day must be selected'),
  dueDate: z.string().min(1, 'Due date is required'),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

const CreateAssessment = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('MCQ');
  const createAssessment = useCreateAssessment();
  const uploadPDF = useUploadAssessmentPDF();

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
    title: '',
    description: '',
      type: 'MCQ',
      questions: [],
      assignedDays: [],
      dueDate: new Date().toISOString().split('T')[0] + 'T23:59',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const handlePDFUpload = async (file: File) => {
    if (!courseId) return;
    
    try {
      await uploadPDF.mutateAsync({
        file,
        courseId,
        assignedDays: form.getValues('assignedDays'),
      });
      
      toast({
        title: 'Success',
        description: 'Assessment questions have been uploaded and parsed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload and parse the PDF file.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: AssessmentFormValues) => {
    if (!courseId) return;

    try {
      const assessmentData: Omit<Assessment, '_id'> = {
        courseId,
        title: data.title,
        description: data.description,
        type: data.type,
        questions: data.questions.map(q => ({
          ...q,
          _id: crypto.randomUUID(), // Generate a temporary ID that will be replaced by the server
        })) as Question[],
        assignedDays: data.assignedDays,
        dueDate: data.dueDate,
        status: 'pending',
      };

      await createAssessment.mutateAsync(assessmentData);

      toast({
        title: 'Success',
        description: 'Assessment has been created successfully.',
      });

      navigate(`/instructor/courses/${courseId}/assessments`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create the assessment.',
        variant: 'destructive',
      });
    }
  };

  const addQuestion = () => {
    if (assessmentType === 'MCQ') {
      append({
        type: 'MCQ',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1,
      } as FormQuestion);
    } else {
      append({
        type: 'CODING',
        problemStatement: '',
        inputFormat: '',
        outputFormat: '',
        testCases: [{ input: '', expectedOutput: '', isHidden: false }],
        marks: 10,
        sampleCode: '',
      } as FormQuestion);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter assessment title"
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Type</FormLabel>
                      <Select
                        onValueChange={(value: AssessmentType) => {
                          field.onChange(value);
                          setAssessmentType(value);
                          form.setValue('questions', []);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCQ">Multiple Choice Questions</SelectItem>
                          <SelectItem value="CODING">Coding Questions</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter assessment description"
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Days</FormLabel>
                    <FormControl>
                      <MultiSelect
                        selected={field.value || []}
                        options={Array.from({ length: 30 }, (_, i) => ({
                          value: i + 1,
                          label: `Day ${i + 1}`,
                        }))}
                        onValuesChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local" 
                        {...field} 
                        value={field.value || new Date().toISOString().split('T')[0] + 'T23:59'} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Questions</h3>
                  <div className="space-x-2">
                    {assessmentType === 'MCQ' && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('pdfUpload')?.click()}
                      >
                        Upload PDF
                        <input
                          id="pdfUpload"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePDFUpload(file);
                          }}
                        />
                      </Button>
                    )}
                    <Button type="button" onClick={addQuestion}>
                      Add Question
                    </Button>
                  </div>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">
                        Question {index + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {field.type === 'MCQ' ? (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`questions.${index}.questionText`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question Text</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {[0, 1, 2, 3].map((optionIndex) => (
                            <FormField
                              key={optionIndex}
                              control={form.control}
                              name={`questions.${index}.options.${optionIndex}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Option {optionIndex + 1}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ))}

                          <FormField
                            control={form.control}
                            name={`questions.${index}.correctAnswer`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Correct Answer</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {form.watch(`questions.${index}.options`).map(
                                      (option, i) => (
                                        <SelectItem key={i} value={option}>
                                          {option}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`questions.${index}.problemStatement`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Problem Statement</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`questions.${index}.inputFormat`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Input Format</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`questions.${index}.outputFormat`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Output Format</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`questions.${index}.sampleCode`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sample Code (Optional)</FormLabel>
                                <FormControl>
                                  <Editor
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    language="javascript"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Test Cases */}
                          <div className="space-y-2">
                            <FormLabel>Test Cases</FormLabel>
                            {form.watch(`questions.${index}.testCases`)?.map(
                              (_, testIndex) => (
                                <div key={testIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`questions.${index}.testCases.${testIndex}.input`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Input</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`questions.${index}.testCases.${testIndex}.expectedOutput`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Expected Output</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const testCases = form.getValues(
                                  `questions.${index}.testCases`
                                );
                                form.setValue(
                                  `questions.${index}.testCases`,
                                  [
                                    ...testCases,
                                    { input: '', expectedOutput: '', isHidden: false },
                                  ]
                                );
                              }}
                            >
                              Add Test Case
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button type="submit" className="w-full">
                Create Assessment
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAssessment;
