import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/lib/axios';

export interface LeaderboardMetrics {
  userId: string;
  name: string;
  avatar: string;
  rank: number;
  metrics: {
    coursesEnrolled: number;
    coursePoints: number;
    quizPoints: number;
    totalPoints: number;
    enrolledCourses: string[];  // Array of course IDs that the student is enrolled in
  };
}

export const useLeaderboard = (courseUrl?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery<{ rankings: LeaderboardMetrics[]; currentUserRank: number }>({
    queryKey: ['leaderboard', courseUrl],
    queryFn: async () => {
      try {
        console.log('🔄 Fetching leaderboard data...', { courseUrl });
        const url = courseUrl 
          ? `/api/leaderboard/students?courseUrl=${courseUrl}`
          : '/api/leaderboard/students';
        
        const response = await axios.get<LeaderboardMetrics[]>(url);
        const rankedData = response.data;
        
        console.log('✅ Leaderboard data fetched:', {
          timestamp: new Date().toISOString(),
          courseUrl,
          totalStudents: rankedData.length,
          topScores: rankedData.slice(0, 3).map(s => ({
            name: s.name,
            totalPoints: s.metrics.totalPoints
          }))
        });
        
        const currentUserRank = rankedData.find(entry => 
          entry.userId === user?.id
        )?.rank || 0;

        return {
          rankings: rankedData,
          currentUserRank
        };
      } catch (error) {
        console.error('❌ Error fetching leaderboard data:', error);
        return {
          rankings: [],
          currentUserRank: 0
        };
      }
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when internet reconnects
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    onSuccess: (data) => {
      console.log('🎯 Leaderboard data updated:', {
        timestamp: new Date().toISOString(),
        courseUrl,
        totalStudents: data.rankings.length,
        currentUserRank: data.currentUserRank
      });
    }
  });
};

// Function to manually refresh leaderboard
export const refreshLeaderboard = async (courseUrl?: string) => {
  const queryClient = useQueryClient();
  await queryClient.invalidateQueries(['leaderboard', courseUrl]);
}; 