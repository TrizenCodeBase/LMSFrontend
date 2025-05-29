import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';
import axios from '@/lib/axios';

interface EnrollmentCheckResponse {
  isEnrolled: boolean;
  hasPendingRequest: boolean;
}

const EnrollPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const checkEnrollmentAndRedirect = async () => {
      const ref = searchParams.get('ref');
      const course = searchParams.get('course');

      if (!course) {
        toast({
          title: "Error",
          description: "Invalid course link. Please try again with a valid course.",
          variant: "destructive",
        });
        navigate('/explore-courses');
        return;
      }

      if (ref && course) {
        // Store referral info in localStorage
        localStorage.setItem('referrerId', ref);
        localStorage.setItem('courseSlug', course);
      }

      // Check authentication and redirect accordingly
      if (!isAuthenticated) {
        // Store the current path for redirect after login
        const currentPath = `/enroll?ref=${ref}&course=${course}`;
        localStorage.setItem('redirectPath', currentPath);
        // Redirect to login if not authenticated
        navigate('/login');
        return;
      }

      try {
        const { data } = await axios.get<EnrollmentCheckResponse>(`/api/check-enrollment/${course}`);

        if (data.isEnrolled) {
          toast({
            title: "Already Enrolled",
            description: "You are already enrolled in this course. Redirecting to your courses.",
            variant: "destructive",
          });
          navigate('/my-courses');
          return;
        }

        if (data.hasPendingRequest) {
          toast({
            title: "Pending Enrollment",
            description: "You already have a pending enrollment request for this course. Please wait for approval.",
            variant: "destructive",
          });
          navigate('/my-courses');
          return;
        }

        // If not enrolled and no pending request, redirect to payment form
        navigate(`/course/${course}/payment`);
      } catch (error: any) {
        console.error('Error checking enrollment:', error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           "There was a problem checking your enrollment. Please try again.";
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Wait a moment before redirecting to ensure the user sees the error
        setTimeout(() => {
          navigate('/explore-courses');
        }, 2000);
      }
    };

    checkEnrollmentAndRedirect();
  }, [isAuthenticated, navigate, searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};

export default EnrollPage; 