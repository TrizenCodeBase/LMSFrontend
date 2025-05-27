import React, { useState } from 'react';
import EnrollmentForm from '../components/EnrollmentForm';

const PaymentForm = () => {
  const [course, setCourse] = useState({
    _id: '',
    title: '',
    image: '',
    price: 0,
    averageRating: 0,
    totalRatings: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission
  };

  return (
    <div>
      <EnrollmentForm
        courseId={course._id}
        courseTitle={course.title}
        courseImage={course.image}
        coursePrice={course.price}
        averageRating={course.averageRating}
        totalRatings={course.totalRatings}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default PaymentForm; 