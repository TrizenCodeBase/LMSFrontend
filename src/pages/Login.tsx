import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import LoginForm from '@/components/LoginForm';
import Footer from '@/components/Footer';

const Login = () => {
  const location = useLocation();

  useEffect(() => {
    // Store the redirect path if coming from a referral/enrollment link
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    const course = params.get('course');
    
    if (ref && course) {
      const redirectPath = `/enroll?ref=${ref}&course=${course}`;
      localStorage.setItem('redirectPath', redirectPath);
    } else if (location.state?.from) {
      localStorage.setItem('redirectPath', location.state.from);
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </main>
      <Footer />
    </div>
  );
};

export default Login;
