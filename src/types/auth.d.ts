export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
  bio?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
} 