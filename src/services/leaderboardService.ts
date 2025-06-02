import { useQuery } from '@tanstack/react-query';
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

export const useLeaderboard = () => {
  const { user } = useAuth();

  return useQuery<{ rankings: LeaderboardMetrics[]; currentUserRank: number }>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      try {
        const response = await axios.get<LeaderboardMetrics[]>('/api/leaderboard/students');
        const rankedData = response.data;
        
        // Log the data to help with debugging
        console.log('Leaderboard data:', rankedData);
        
        const currentUserRank = rankedData.find(entry => 
          entry.userId === user?.id
        )?.rank || 0;

        return {
          rankings: rankedData,
          currentUserRank
        };
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        return {
          rankings: [],
          currentUserRank: 0
        };
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}; 