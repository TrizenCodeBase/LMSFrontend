export interface Discussion {
  _id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  userId: {
    _id: string;
    name: string;
  };
  courseId: {
    _id: string;
    title: string;
  };
  replies: Array<{
    _id: string;
    content: string;
    createdAt: string;
    userId: {
      _id: string;
      name: string;
    };
  }>;
  likes: string[];
}

export interface User {
  id: string;
  _id?: string; // Some responses use _id
  name: string;
  email: string;
  role?: string;
} 