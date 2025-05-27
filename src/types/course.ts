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
  imageUrl: string;
  url: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
  };
  weeks: Week[];
  createdAt: string;
  updatedAt: string;
} 