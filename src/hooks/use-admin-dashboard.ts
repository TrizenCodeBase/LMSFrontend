import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';

export interface DashboardStats {
  userStats: {
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalAdmins: number;
    activeUsers: number;
    inactiveUsers: number;
  };
  courseStats: {
    totalCourses: number;
    activeCourses: number;
  };
  enrollmentStats: {
    pendingEnrollments: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  instructorStats: {
    pendingApplications: number;
  };
  enrollmentData: {
    name: string;
    enrollments: number;
    completions: number;
    avgProgress: number;
  }[];
  analytics: {
    enrollmentData: {
      name: string;
      enrollments: number;
    }[];
    userRegistrationData: {
      name: string;
      count: number;
      students: number;
      instructors: number;
      admins: number;
    }[];
    courseCompletionData: {
      totalEnrollments: number;
      completedEnrollments: number;
      averageCompletionRate: number;
      courseCompletionRates: {
        courseId: string;
        courseTitle: string;
        totalEnrollments: number;
        completedEnrollments: number;
        completionRate: number;
      }[];
    };
    courseEngagementData: {
      overallAverageProgress: number;
      courseEngagement: {
        courseId: string;
        courseTitle: string;
        totalEnrollments: number;
        activeStudents: number;
        averageProgress: number;
        engagementRate: number;
      }[];
    };
    platformUsageData: {
      dailyActiveUsersData: {
        date: string;
        count: number;
      }[];
      averageDailyUsers: number;
      mostActiveDay: {
        date: string;
        count: number;
      } | null;
    };
    revenueData: {
      revenueByMonth: {
        name: string;
        revenue: number;
      }[];
      totalRevenue: number;
      averageMonthlyRevenue: number;
    };
    kpiData: {
      userGrowthRate: number;
      completionRate: number;
      userEngagementRate: number;
      avgEnrollmentsPerStudent: number;
      previousPeriod: {
        userRegistrations: number;
        completionRate: number;
        activeUserRate: number;
        avgEnrollments: number;
      };
    };
  };
  recentActivities: {
    id: string;
    user: string;
    action: string;
    time: string;
  }[];
}

export const useAdminDashboard = (refreshInterval = 60000) => {
  return useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await axios.get<DashboardStats>('/api/admin/dashboard/stats');
      return response.data;
    },
    refetchInterval: refreshInterval, // Auto-refresh every minute by default
  });
}; 