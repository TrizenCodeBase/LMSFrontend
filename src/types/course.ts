export interface Week {
  weekNumber: number;
  title: string;
  description: string;
  days: Day[];
}

export interface Day {
  day: number;
  title: string;
  description: string;
  content: string;
  mcqs?: MCQQuestion[];
  assignments?: Assignment[];
}

export interface MCQQuestion {
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  image: string;
  instructor: string;
  instructorAvatar?: string;
  duration: string;
  enrollmentCount: number;
  students: number;
  rating: number;
  price: number;
  originalPrice?: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  language?: string;
  courseUrl?: string;
  progress?: number;
  status?: 'enrolled' | 'started' | 'completed' | 'pending';
  enrollmentStatus?: 'pending' | 'approved' | 'rejected';
  completedDays?: number[];
  isComingSoon?: boolean;
  expectedDate?: string;
  skills?: string[];
  roadmap?: {
    day: number;
    topics: string;
    video?: string;
    mcqs?: {
      question: string;
      options: {
        text: string;
        isCorrect: boolean;
      }[];
    }[];
  }[];
} 