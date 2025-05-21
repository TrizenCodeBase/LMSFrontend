import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if the user is authenticated
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data as User);
        setLoading(false);
      } catch (error) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: authToken, user: userData } = response.data as AuthResponse;
      
      localStorage.setItem('token', authToken);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userRole', userData.role || 'student');
      
      setToken(authToken);
      setUser(userData);
      
      // Determine redirect path based on user role
      let redirectPath = '/explore-courses'; // Default path for students
      
      if (userData.role === 'admin') {
        redirectPath = '/admin/dashboard';
        toast({
          title: "Admin Login Successful",
          description: "Welcome to the admin dashboard",
          variant: "default",
        });
      } else {
        // Student login
        const storedPath = localStorage.getItem('redirectPath');
        if (storedPath && !storedPath.startsWith('/admin')) {
          redirectPath = storedPath;
          localStorage.removeItem('redirectPath');
        }
        
        toast({
          title: "Login Successful",
          description: "Welcome back!",
          duration: 3000,
        });
      }
      
      navigate(redirectPath);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const signup = async (data: SignupData) => {
    try {
      // Validate role
      if (data.role !== 'student' && data.role !== 'admin') {
        toast({
          title: "Invalid Role",
          description: "Invalid credentials. Only student and admin roles are allowed.",
          variant: "destructive",
          duration: 3000,
        });
        throw new Error('Invalid credentials. Only student and admin roles are allowed.');
      }

      const response = await axios.post('/api/auth/signup', data);
      const { token: authToken, user: userData, message } = response.data as AuthResponse;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
      
      navigate('/dashboard');
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Signup error details:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create account. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!token, 
      user, 
      token, 
      loading, 
      login, 
      signup, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
