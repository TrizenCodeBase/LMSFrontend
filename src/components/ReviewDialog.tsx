import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/lib/axios';

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  onReviewSubmitted?: () => void;
  initialRating?: number;
  initialComment?: string;
  isEditing?: boolean;
}

interface Review {
  rating: number;
  comment: string;
  _id?: string;
}

const ReviewDialog = ({ 
  isOpen, 
  onClose, 
  courseId, 
  courseTitle, 
  onReviewSubmitted,
  initialRating = 0,
  initialComment = '',
  isEditing = false
}: ReviewDialogProps) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [isOpen, initialRating, initialComment]);

  useEffect(() => {
    // Fetch existing review when dialog opens
    const fetchExistingReview = async () => {
      if (!isOpen || !token || isEditing) return;
      
      try {
        const response = await axios.get<Review>(`/api/courses/${courseId}/reviews/my-review`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data) {
          setRating(response.data.rating);
          setComment(response.data.comment || '');
          setReviewId(response.data._id || null);
        }
      } catch (error) {
        // If no review exists, keep default values
        console.log('No existing review found');
      }
    };

    fetchExistingReview();
  }, [isOpen, courseId, token, isEditing]);

  const handleStarClick = (value: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRating(value);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const method = isEditing ? 'put' : 'post';
      await axios[method](`/api/courses/${courseId}/reviews`, {
        rating,
        comment: comment.trim() // Send empty string if no comment
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: isEditing ? "Review updated" : "Review submitted",
        description: isEditing ? "Your review has been updated successfully!" : "Thank you for your feedback!",
      });

      // Reset form and close dialog
      onClose();
      
      // Notify parent component to refresh data
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      toast({
        title: isEditing ? "Error updating review" : "Error submitting review",
        description: error.response?.data?.message || `There was a problem ${isEditing ? 'updating' : 'submitting'} your review.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !reviewId) return;

    setIsSubmitting(true);
    try {
      await axios.delete(`/api/courses/${courseId}/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: "Review deleted",
        description: "Your review has been deleted successfully.",
      });

      onClose();
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      toast({
        title: "Error deleting review",
        description: error.response?.data?.message || "There was a problem deleting your review.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Review' : 'Review Course'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your review for' : 'Share your experience with'} {courseTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={(e) => handleStarClick(value, e)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    value <= rating
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="grid gap-2">
          <Textarea
              placeholder="Share your thoughts about this course (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={4}
          />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
            {reviewId && (
          <Button 
                variant="destructive" 
                onClick={handleDelete} 
            disabled={isSubmitting}
          >
                Delete
              </Button>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog; 