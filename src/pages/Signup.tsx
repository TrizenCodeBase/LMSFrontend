
import React from 'react';
import Header from '@/components/Header';
import SignupForm from '@/components/SignupForm';
import Footer from '@/components/Footer';

const Signup = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <SignupForm />
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
