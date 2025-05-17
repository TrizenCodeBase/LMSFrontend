
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PaymentForm from '@/components/PaymentForm';

const CoursePayment = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto py-8">
          <PaymentForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoursePayment;
