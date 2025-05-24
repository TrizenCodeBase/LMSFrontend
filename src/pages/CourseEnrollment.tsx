import React, { useEffect } from 'react';
import EnrollForm from '@/components/EnrollForm';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const CourseEnrollment = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Wait for auth state to be determined
    if (!loading && !isAuthenticated && courseId) {
      // Redirect to course details page
      navigate(`/course/${courseId}/details`, { replace: true });
    }
  }, [isAuthenticated, loading, courseId, navigate]);

  // Show nothing while checking auth state
  if (loading || !isAuthenticated) {
    return null;
  }
  
  return (
    <div className="min-h-screen">
      <EnrollForm courseId={courseId} />
    </div>
  );
};

export default CourseEnrollment;
