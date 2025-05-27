export interface EnrollmentRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  courseId: {
    _id: string;
    title: string;
    courseUrl?: string;
  };
  courseUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  transactionScreenshot: string;
  transactionId: string;
  amount: number;
  paymentDate: string;
  mobileNumber: string;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  referredBy?: string;
} 