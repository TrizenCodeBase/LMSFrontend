import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "@/lib/axios";

export type MCQQuestion = {
  _id: string;
  type: 'MCQ';
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
};

export type CodingQuestion = {
  _id: string;
  type: 'CODING';
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }[];
  marks: number;
  sampleCode?: string;
};

export type Question = MCQQuestion | CodingQuestion;
export type AssessmentType = 'MCQ' | 'CODING';

export type Assessment = {
  _id: string;
  title: string;
  description: string;
  courseId: string;
  type: AssessmentType;
  dueDate: string;
  status: 'pending' | 'completed';
  assignedDays: number[];
  questions: Question[];
  totalMarks?: number;
  score?: number;
};

export const useStudentAssessments = (courseId?: string, day?: number | null) => {
  return useQuery({
    queryKey: ['student-assessments', courseId, day],
    queryFn: async (): Promise<Assessment[]> => {
      const url = day 
        ? `/api/courses/${courseId}/assessments?day=${day}` 
        : `/api/courses/${courseId}/assessments`;
      const response = await axios.get(url);
      return response.data;
    },
    enabled: !!courseId,
  });
};

type MCQAnswer = {
  type: 'MCQ';
  questionId: string;
  selectedAnswer: string;
};

type CodingAnswer = {
  type: 'CODING';
  questionId: string;
  code: string;
  language: string;
};

type Answer = MCQAnswer | CodingAnswer;

export const useSubmitAssessment = () => {
  return useMutation({
    mutationFn: async ({ 
      assessmentId, 
      answers 
    }: { 
      assessmentId: string; 
      answers: Answer[];
    }) => {
      const response = await axios.post(
        `/api/assessments/${assessmentId}/submit`,
        { answers }
      );
      return response.data;
    }
  });
};

export const useCreateAssessment = () => {
  return useMutation({
    mutationFn: async (assessmentData: Omit<Assessment, '_id'>) => {
      const response = await axios.post('/api/instructor/assessments', assessmentData);
      return response.data;
    }
  });
};

export const useInstructorAssessments = (courseId?: string) => {
  return useQuery({
    queryKey: ['instructor-assessments', courseId],
    queryFn: async (): Promise<Assessment[]> => {
      const response = await axios.get(`/api/instructor/courses/${courseId}/assessments`);
      return response.data;
    },
    enabled: !!courseId,
  });
};

// Adding the missing function that was referenced in CreateAssessment.tsx
export const useUploadAssessmentPDF = () => {
  return useMutation({
    mutationFn: async ({ 
      file, 
      courseId, 
      assignedDays 
    }: { 
      file: File; 
      courseId: string;
      assignedDays: number[];
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);
      formData.append('assignedDays', JSON.stringify(assignedDays));
      
      const response = await axios.post('/api/instructor/assessments/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  });
};

interface QuizSubmission {
  courseUrl: string;
  dayNumber: number;
  title: string;
  questions: {
    question: string;
    options: {
      text: string;
      isCorrect: boolean;
    }[];
  }[];
  selectedAnswers: number[];
  score: number;
  submittedDate: string;
}

// New function to submit quiz results to assignments
export const useSubmitQuizToAssignments = () => {
  return useMutation({
    mutationFn: async (data: QuizSubmission) => {
      const response = await axios.post(
        `/api/quiz-submissions`,
        data
      );
      return response.data;
    }
  });
};
