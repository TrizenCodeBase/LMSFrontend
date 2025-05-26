import { Star } from 'lucide-react';

interface EnrollmentFormProps {
  courseId: string;
  courseTitle: string;
  courseImage: string;
  coursePrice: number;
  averageRating: number;
  totalRatings: number;
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}

const EnrollmentForm = ({
  courseId,
  courseTitle,
  courseImage,
  coursePrice,
  averageRating,
  totalRatings,
  onSubmit,
  isSubmitting
}: EnrollmentFormProps) => {
  
  const renderRatingStars = (rating: number, totalRatings: number) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`h-4 w-4 ${
                value <= rating
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">({totalRatings} {totalRatings === 1 ? 'review' : 'reviews'})</span>
      </div>
    );
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-lg">
            <img
              src={courseImage}
              alt={courseTitle}
              className="h-full w-full object-cover"
            />
          </div>
          <h3 className="text-2xl font-semibold">{courseTitle}</h3>
          {renderRatingStars(averageRating, totalRatings)}
          <div className="text-2xl font-bold">₹{coursePrice}</div>
          
          {/* Rest of your enrollment form */}
        </div>
      </div>
    </div>
  );
};

export default EnrollmentForm; 