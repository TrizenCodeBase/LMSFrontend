import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/axios";
import { toast } from "@/components/ui/use-toast";

export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface RoadmapDay {
  day: number;
  topics: string;
  mcqs?: any[];
  code?: string;
  language?: string;
  video?: string;
  description?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  image: string;
  instructor?: string;
  instructorId: string;
  instructorAvatar?: string;
  instructorTitle?: string;
  instructorDetails?: {
    name: string;
    email: string;
    profilePicture?: string;
    bio?: string;
    userId?: string;
  };
  duration: string;
  totalLessons: number;
  totalModules: number;
  totalQuizzes: number;
  totalAssignments: number;
  totalProjects: number;
  totalRatings?: number;
  rating?: number;
  enrollmentStatus?: "started" | "completed" | "pending" | "enrolled" | "approved" | "rejected";
  status?: "started" | "completed" | "pending" | "enrolled" | "approved" | "rejected";
  progress?: number;
  lastAccessedAt?: string;
  completedAt?: string;
  category?: string;
  tags?: string[];
  prerequisites?: string[];
  objectives?: string[];
  roadmap?: RoadmapDay[];
  price?: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  language?: string;
  courseUrl?: string;
  daysCompletedPerDuration?: string;
  completedDays?: number[];
  isComingSoon?: boolean;
  expectedDate?: string;
  isTrending?: boolean;
  isNew?: boolean;
  isTopRated?: boolean;
  lastUpdated?: string;
  enrollmentCount?: number;
  students?: number;
}

export interface ReviewCounts {
  [courseId: string]: {
    totalReviews: number;
    rating: number;
  };
}

// Fetch all courses
export const useAllCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const response = await axios.get(`/api/courses`);
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format: expected an array of courses");
      }
      return response.data.map(course => course as Course);
    },
  });
};

// Get course by ID or courseUrl
export const useCourseDetails = (courseIdOrUrl: string | undefined) => {
  return useQuery({
    queryKey: ['course', courseIdOrUrl],
    queryFn: async (): Promise<Course> => {
      if (!courseIdOrUrl) throw new Error("Course ID or URL is required");
      
      try {
        // Use the main endpoint which handles both IDs and URLs
        const response = await axios.get(`/api/courses/${courseIdOrUrl}`);
        if (response.data) {
          return response.data as Course;
        }
      } catch (error: any) {
          // Log the error for debugging
        console.error('Course fetch error:', error?.response?.data);
          
          // Throw a user-friendly error
          throw new Error(
            error?.response?.data?.message || 
            'Course not found'
          );
      }
      throw new Error(`Course not found: ${courseIdOrUrl}`);
    },
    enabled: !!courseIdOrUrl,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });
};

// Get enrolled courses for current user
export const useEnrolledCourses = (token: string | null) => {
  return useQuery({
    queryKey: ['enrolledCourses'],
    queryFn: async (): Promise<Course[]> => {
      if (!token) throw new Error("Authentication required");
      const response = await axios.get(`/api/my-courses`);
      return response.data as Course[];
    },
    enabled: !!token,
  });
};

// Enroll in a course
export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      courseId, 
      token 
    }: { 
      courseId: string, 
      token: string 
    }) => {
      const response = await axios.post(
        `/api/enrollments`, 
        { courseId }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export interface UpdateProgressParams {
  courseId: string;
  progress: number;
  status: 'started' | 'completed';
  token: string;
  completedDays?: number[];
}

// Update course progress and status
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, completedDays, token, progress, status }: UpdateProgressParams) => {
      const response = await axios.put(
        `/api/courses/${courseId}/progress`,
        { completedDays, progress, status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrolled-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
    }
  });
};

// Submit enrollment request
export const useSubmitEnrollmentRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post(
        `/api/enrollment-requests`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

// Admin: Get all enrollment requests
export const useEnrollmentRequests = () => {
  return useQuery({
    queryKey: ['enrollment-requests'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/enrollment-requests');
      return response.data;
    },
  });
};

// Admin: Approve enrollment request
export const useApproveEnrollmentRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axios.put(`/api/admin/enrollment-requests/${requestId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] });
    },
  });
};

// Admin: Reject enrollment request
export const useRejectEnrollmentRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await axios.put(`/api/admin/enrollment-requests/${requestId}/reject`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] });
    },
  });
};

// Instructor: Get my courses
export const useInstructorCourses = () => {
  return useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async (): Promise<Course[]> => {
      try {
        const response = await axios.get('/api/instructor/courses');
        console.log("Instructor courses response:", response.data);
        return response.data as Course[];
      } catch (error) {
        console.error("Error fetching instructor courses:", error);
        throw error;
      }
    },
  });
};

// Instructor: Get students for a specific course
export interface CourseStudent {
  id: string;
  name: string;
  email: string;
  enrolledDate: string;
  progress: number;
  status: string;
  lastActive: string;
  courseTitle?: string; // Optional since it's only present in "all students" view
}

export interface CourseWithStudents {
  id: string;
  title: string;
  students: CourseStudent[];
}

// Get all students for all courses
export const useAllCourseStudents = () => {
  return useQuery<CourseWithStudents[]>({
    queryKey: ['all-course-students'],
    queryFn: async (): Promise<CourseWithStudents[]> => {
      try {
        const response = await axios.get('/api/instructor/students');
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format: expected an array of courses with students');
        }
        return response.data as CourseWithStudents[];
      } catch (error) {
        console.error('Error fetching all course students:', error);
        throw error;
      }
    },
  });
};

// Get students for a specific course
export const useCourseStudents = (courseId: string | undefined) => {
  return useQuery<CourseWithStudents>({
    queryKey: ['course-students', courseId],
    queryFn: async (): Promise<CourseWithStudents> => {
      if (!courseId) throw new Error("Course ID is required");
      try {
        // If courseId is 'all', use the endpoint for all students
        const endpoint = courseId === 'all' 
          ? '/api/instructor/students'
          : `/api/instructor/courses/${courseId}/students`;
        
        const response = await axios.get(endpoint);
        
        // Handle different response formats based on endpoint
        if (courseId === 'all') {
          // The /api/instructor/students endpoint returns an array of courses
          const coursesWithStudents = response.data as CourseWithStudents[];
          return {
            id: 'all',
            title: 'All Students',
            students: coursesWithStudents.reduce((allStudents: CourseStudent[], course) => {
              return [...allStudents, ...course.students];
            }, [])
          };
        }
        
        // For specific course endpoint
        const data = response.data as CourseWithStudents;
        if (!data.id || !data.title || !Array.isArray(data.students)) {
          throw new Error('Invalid response format: missing required course student data');
        }
        return data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch course students';
        console.error('Error fetching course students:', errorMessage);
        throw new Error(errorMessage);
      }
    },
    enabled: !!courseId,
  });
};

// Instructor: Create new course
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      // Log the data being sent for debugging
      console.log("Creating course with data:", JSON.stringify(courseData, null, 2));
      
      // Validate required fields
      const requiredFields = ['title', 'description', 'instructor', 'duration', 'level', 'category', 'image'];
      for (const field of requiredFields) {
        if (!courseData[field as keyof Partial<Course>]) {
          toast({
            title: "Validation Error",
            description: `The ${field} field is required`,
            variant: "destructive"
          });
          throw new Error(`The ${field} field is required`);
        }
      }

      // Process roadmap data if it exists
      if (courseData.roadmap) {
        // Ensure roadmap data is valid
        courseData.roadmap = courseData.roadmap.map((day, index) => ({
          ...day,
          day: index + 1, // Ensure days are sequential
          mcqs: day.mcqs || [] // Ensure mcqs exists
        }));
      }
      
      try {
        const response = await axios.post('/api/instructor/courses', courseData);
        console.log("Course creation response:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("Error creating course:", error);
        
        // Extract and display error message
        const errorMsg = error.response?.data?.message || "Failed to create course";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      toast({
        title: "Success",
        description: "Course created successfully",
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive"
      });
    }
  });
};

// Instructor: Update course
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({courseId, courseData}: {courseId: string, courseData: Partial<Course>}) => {
      if (!courseId) {
        throw new Error('Course ID is required');
      }

      // Log the update attempt
      console.log('Attempting to update course:', courseId);
      console.log('Update payload:', JSON.stringify(courseData, null, 2));

      // Validate required fields
      const requiredFields = ['title', 'description', 'instructor', 'duration', 'level', 'category', 'image'] as const;
      const missingFields = requiredFields.filter(field => !courseData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Process roadmap data if it exists
      if (courseData.roadmap) {
        courseData.roadmap = courseData.roadmap.map((day, index) => ({
          ...day,
          day: index + 1,
          mcqs: day.mcqs || [],
          code: day.code || '',
          language: day.language || 'javascript'
        }));

        // Validate roadmap data
        courseData.roadmap.forEach((day, index) => {
          if (!day.topics) {
            throw new Error(`Topics are required for Day ${index + 1}`);
          }
          if (!day.video) {
            throw new Error(`Video link is required for Day ${index + 1}`);
          }
        });
      }
      
      try {
        const response = await axios.put(`/api/instructor/courses/${courseId}`, courseData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Log successful response
        console.log('Course update successful:', response.data);
        return response.data;
      } catch (error: any) {
        // Log the complete error
        console.error('Course update error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          error: error.message
        });
        
        // Handle specific error cases
        if (error.response?.status === 404) {
          throw new Error('Course not found');
        }
        if (error.response?.status === 403) {
          throw new Error('You do not have permission to update this course');
        }
        if (error.response?.status === 400) {
          const message = error.response.data.message || 'Invalid course data';
          throw new Error(`Validation error: ${message}`);
        }
        if (error.response?.status === 500) {
          throw new Error('Server error occurred. Please try again later.');
        }
        
        // Handle network or other errors
        throw new Error(error.response?.data?.message || 'Failed to update course');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Course update error:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update course. Please try again.",
        variant: "destructive"
      });
    }
  });
};

// Instructor: Delete course
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await axios.delete(`/api/instructor/courses/${courseId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useReviewCounts = () => {
  return useQuery<ReviewCounts>({
    queryKey: ['reviewCounts'],
    queryFn: async (): Promise<ReviewCounts> => {
      const response = await axios.get<ReviewCounts>('/api/review-counts');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export interface QuizSubmission {
  courseUrl: string;
  courseId: string;
  title: string;
  score: number;
  submittedDate: string;
  dayNumber: number;
  courseName?: string;
  attempts?: number;
  maxScore?: number;
  lastAttemptDate?: string;
}

interface UniqueQuiz {
  _id: {
    courseId: string;
    title: string;
  };
  attempts: number;
  highestScore: number;
}

interface QuizSubmissionsResponse {
  totalSubmissions: number;
  uniqueQuizCount: number;
  submissions: QuizSubmission[];
  uniqueQuizzes: UniqueQuiz[];
}

// Get quiz submissions statistics
export const useQuizzesAttemptedCount = (token: string | null) => {
  return useQuery({
    queryKey: ['quizzesAttemptedCount'],
    queryFn: async () => {
      if (!token) throw new Error("Authentication required");
      
      try {
        const response = await axios.get('/api/quiz-submissions/completed-count');
        return response.data;
      } catch (error) {
        console.error('Error fetching quiz submissions:', error);
        throw error;
      }
    },
    enabled: !!token,
  });
};

interface QuizStats {
  totalSubmissions: number;
  uniqueQuizzes: number;
  coursesWithSubmissions: number;
  averageScore: number;
  submissions: QuizSubmission[];
}

// Get user quiz statistics with detailed logging
export const useUserQuizStats = (token: string | null) => {
  return useQuery({
    queryKey: ['userQuizStats'],
    queryFn: async (): Promise<QuizStats> => {
      try {
        const response = await axios.get<QuizStats>('/api/quiz-submissions');
        console.log('Quiz Statistics:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching user quiz statistics:', error);
        throw error;
      }
    },
    enabled: true, // Always enabled since we're using hardcoded user ID
  });
};

// Debug function to check quiz submissions
export const useQuizSubmissionsDebug = (token: string | null) => {
  return useQuery({
    queryKey: ['quizSubmissionsDebug'],
    queryFn: async () => {
      if (!token) throw new Error("Authentication required");
      
      try {
        const response = await axios.get('/api/quiz-submissions/debug');
        console.log('Quiz submissions debug data:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching quiz submissions:', error);
        throw error;
      }
    },
    enabled: !!token,
  });
};

// Update the function to fetch individual courses
export const useCoursesByIds = (courseIds: string[] | undefined) => {
  return useQuery({
    queryKey: ['courses', courseIds],
    queryFn: async (): Promise<Course[]> => {
      if (!courseIds || courseIds.length === 0) return [];
      
      try {
        // Fetch each course individually using Promise.all
        const coursePromises = courseIds.map(async (id) => {
          try {
            const response = await axios.get(`/api/courses/${id}`);
            return response.data;
          } catch (error) {
            console.error(`Error fetching course ${id}:`, error);
            return null;
          }
        });

        const courses = await Promise.all(coursePromises);
        return courses.filter(course => course !== null) as Course[];
      } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }
    },
    enabled: !!courseIds && courseIds.length > 0,
  });
};

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  enrolledCourses?: Course[];
  avatar?: string;
  bio?: string;
  title?: string;
  // ... rest of the existing properties ...
}
