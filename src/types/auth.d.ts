export interface User {
  id: string;
  name: string;
  email: string;
  role: 'instructor' | 'student' | 'admin';
  avatar?: string;
  bio?: string;
  title?: string;
  phone?: string;
  expertise?: string;
  createdAt: string;
  updatedAt: string;
} 