import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SignupChoice from './SignupChoice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';

type UserRole = 'student' | 'instructor';

const SignupForm = () => {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [signupError, setSignupError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateInstructorFields = () => {
    if (selectedRole === 'instructor') {
      if (!specialty.trim()) {
        setSignupError('Please enter your specialty');
        return false;
      }
      if (!experience.trim() || isNaN(Number(experience))) {
        setSignupError('Please enter valid years of experience');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setSignupError('Please select a role');
      return;
    }

    if (!validatePasswords() || !validateInstructorFields()) {
      return;
    }
    
    setSignupError('');
    setIsLoading(true);
    
    try {
      const signupData = {
        name,
        email,
        password,
        role: selectedRole,
        ...(selectedRole === 'instructor' && {
          specialty,
          experience: Number(experience)
        })
      };

      await signup(signupData);
      
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage = error.message || 'Failed to create account. Please try again.';
      setSignupError(errorMessage);
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-6 bg-card rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Create an Account</h2>
        <p className="text-muted-foreground mt-1">Join Trizen to access high-quality courses</p>
      </div>

      <SignupChoice
        selected={selectedRole}
        onSelect={setSelectedRole}
      />
      
      {signupError && (
        <Alert variant="destructive">
          <AlertDescription>{signupError}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {selectedRole === 'instructor' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                type="text"
                placeholder="e.g., Web Development, Data Science"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                placeholder="e.g., 5"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                required
              />
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
        </div>

        {selectedRole === 'instructor' && (
          <Alert>
            <AlertDescription>
              Your instructor application will be reviewed by our team. We'll notify you by email once it's approved. During this time, you can prepare your course materials and review our instructor guidelines.
            </AlertDescription>
          </Alert>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : selectedRole === 'instructor' ? 'Submit Application' : 'Sign Up'}
        </Button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p>Already have an account? 
          <Button 
            variant="link" 
            className="pl-1" 
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
