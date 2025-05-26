import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Edit2, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import axios from '@/lib/axios';
import ReviewDialog from './ReviewDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Review {
  _id: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface CourseReviewsProps {
  courseId: string;
  courseTitle: string;
  reviews: Review[];
  onReviewsChange: () => void;
}

const CourseReviews = ({ courseId, courseTitle, reviews, onReviewsChange }: CourseReviewsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Find user's review from the reviews array
    if (user && reviews.length > 0) {
      const foundReview = reviews.find(review => review.studentId === user.id);
      setUserReview(foundReview || null);
    } else {
      setUserReview(null);
    }
  }, [user, reviews]);

  useEffect(() => {
    // Fetch user's review when component mounts
    const fetchUserReview = async () => {
      if (!user || !token) return;

      try {
        const response = await axios.get<Review>(`/api/courses/${courseId}/reviews/my-review`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data) {
          setUserReview(response.data);
        }
      } catch (error) {
        // If no review exists, keep userReview as null
        console.log('No existing review found');
      }
    };

    fetchUserReview();
  }, [courseId, user, token]);

  const otherReviews = reviews.filter(review => review.studentId !== user?.id);

  const handleEditClick = (review: Review) => {
    setSelectedReview(review);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  const handleAddReviewClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReview || !token) return;

    try {
      await axios.delete(`/api/courses/${courseId}/reviews/${selectedReview._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: "Review deleted",
        description: "Your review has been deleted successfully.",
      });

      setUserReview(null);
      onReviewsChange();
    } catch (error: any) {
      toast({
        title: "Error deleting review",
        description: error.response?.data?.message || "There was a problem deleting your review.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedReview(null);
    }
  };

  const handleReviewSubmitted = () => {
    onReviewsChange();
    // Fetch the updated user review
    if (user && token) {
      axios.get<Review>(`/api/courses/${courseId}/reviews/my-review`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then(response => {
        setUserReview(response.data);
      }).catch(error => {
        console.error('Error fetching updated review:', error);
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
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
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Course Reviews</h3>
      
      {/* User's Review Section */}
      {user && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <h4 className="text-lg font-medium">Your Review</h4>
          </CardHeader>
          <CardContent>
            {userReview ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{userReview.studentName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(userReview.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {renderStars(userReview.rating)}
                    {userReview.comment && (
                      <p className="text-sm text-muted-foreground mt-2">{userReview.comment}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(userReview)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(userReview)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <Button onClick={handleAddReviewClick} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Other Reviews Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium">Other Reviews</h4>
        <div className="grid gap-4">
          {otherReviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.studentName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {renderStars(review.rating)}
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {otherReviews.length === 0 && !userReview && (
            <div className="text-center py-8 text-muted-foreground">
              No reviews yet. Be the first to review this course!
            </div>
          )}

          {otherReviews.length === 0 && userReview && (
            <div className="text-center py-8 text-muted-foreground">
              No other reviews yet.
            </div>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <ReviewDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedReview(null);
        }}
        courseId={courseId}
        courseTitle={courseTitle}
        onReviewSubmitted={handleReviewSubmitted}
        initialRating={selectedReview?.rating || 0}
        initialComment={selectedReview?.comment || ''}
        isEditing={!!selectedReview}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedReview(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseReviews; 