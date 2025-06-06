import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface UserCourse {
  userId: string;
  courseId: string;
  progress: number;
  score: number;
}

interface QuizSubmission {
  userId: string;
  courseUrl: string;
  dayNumber: number;
  score: number;
  submittedDate: string;
}

interface Course {
  _id: ObjectId;
  title: string;
  courseUrl: string;
}

interface EnrolledCourse {
  courseId: string;
  title: string;
  progress: number;
  score: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const { courseUrl } = req.query;

    console.log('\n🔍 Processing leaderboard request for course:', courseUrl || 'all courses');

    // Get all students
    const students = await db.collection('users')
      .find({ role: 'student' })
      .project({
        name: 1,
        _id: 1,
        avatar: 1,
        userId: 1
      })
      .toArray();

    console.log(`\n👥 Found ${students.length} students`);

    // Get student metrics with enrolled courses
    const studentList = await Promise.all(students.map(async (student) => {
      const userId = student._id.toString();
      console.log(`\n\n📊 Processing student: ${student.name} (${userId})`);

      // Get user's enrolled courses with progress
      const enrolledCourses = await db.collection('usercourses')
        .aggregate([
          {
            $match: courseUrl ? { userId, courseUrl } : { userId }
          },
          {
            $lookup: {
              from: 'courses',
              localField: 'courseId',
              foreignField: '_id',
              as: 'courseDetails'
            }
          },
          {
            $unwind: '$courseDetails'
          },
          {
            $project: {
              courseId: { $toString: '$courseId' },
              title: '$courseDetails.title',
              progress: 1,
              score: 1
            }
          }
        ]).toArray() as EnrolledCourse[];

      console.log(`📚 Enrolled courses found: ${enrolledCourses.length}`);

      // Get quiz scores - now considering all attempts with valid scores
      const quizSubmissions = await db.collection('quizsubmissions')
        .find({ 
          userId,
          score: { $exists: true }, // Only get submissions with scores
          ...(courseUrl && { courseUrl })
        })
        .project({ 
          courseUrl: 1,
          dayNumber: 1,
          score: 1 
        })
        .toArray() as QuizSubmission[];

      console.log(`📝 Quiz submissions found: ${quizSubmissions.length}`);
      if (quizSubmissions.length > 0) {
        console.log('Quiz submissions details:');
        quizSubmissions.forEach(sub => {
          console.log(`- Course: ${sub.courseUrl}, Day: ${sub.dayNumber}, Score: ${sub.score}`);
        });
      }

      // Group quiz submissions by courseUrl and dayNumber to calculate average scores
      const quizScoresByDay = quizSubmissions.reduce((acc, submission) => {
        const key = `${submission.courseUrl}-${submission.dayNumber}`;
        if (!acc[key]) {
          acc[key] = {
            totalScore: 0,
            count: 0,
            courseUrl: submission.courseUrl
          };
        }
        acc[key].totalScore += submission.score;
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, { totalScore: number; count: number; courseUrl: string }>);

      console.log('\n📊 Quiz scores by day:');
      Object.entries(quizScoresByDay).forEach(([key, data]) => {
        const avgScore = data.totalScore / data.count;
        console.log(`- ${key}: Total=${data.totalScore}, Count=${data.count}, Avg=${avgScore.toFixed(2)}`);
      });

      // Calculate average scores per course
      const courseAverages = Object.values(quizScoresByDay).reduce((acc, { totalScore, count, courseUrl }) => {
        if (!acc[courseUrl]) {
          acc[courseUrl] = {
            totalScore: 0,
            count: 0
          };
        }
        acc[courseUrl].totalScore += totalScore / count; // Add the average score for this quiz
        acc[courseUrl].count += 1; // Count this quiz
        return acc;
      }, {} as Record<string, { totalScore: number; count: number }>);

      console.log('\n📈 Course averages:');
      Object.entries(courseAverages).forEach(([courseUrl, data]) => {
        const avgScore = data.totalScore / data.count;
        console.log(`- ${courseUrl}: Total=${data.totalScore.toFixed(2)}, Count=${data.count}, Avg=${avgScore.toFixed(2)}`);
      });

      // Calculate total quiz points (average of all quiz averages)
      const quizPoints = Object.values(courseAverages).reduce((sum, { totalScore, count }) => {
        return sum + (totalScore / count);
      }, 0);

      console.log(`\n🎯 Final quiz points: ${quizPoints.toFixed(2)}`);

      // Calculate course points
      const coursePoints = enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0);
      console.log(`📚 Course points: ${coursePoints}`);
      
      // Calculate total points (average of course progress and quiz scores)
      const totalPoints = coursePoints + quizPoints;
      console.log(`💯 Total points: ${totalPoints.toFixed(2)}`);

      return {
        userId: student.userId || userId,
        name: student.name,
        avatar: student.avatar,
        rank: 0, // Will be updated after sorting
        metrics: {
          coursesEnrolled: enrolledCourses.length,
          coursePoints,
          quizPoints,
          totalPoints,
          enrolledCourses: enrolledCourses.map(course => ({
            courseId: course.courseId,
            title: course.title,
            progress: course.progress,
            score: course.score
          }))
        }
      };
    }));

    // Sort by total points
    studentList.sort((a, b) => b.metrics.totalPoints - a.metrics.totalPoints);
    
    // Update ranks after sorting
    studentList.forEach((student, index) => {
      student.rank = index + 1;
    });

    console.log('\n🏆 Final Rankings:');
    studentList.forEach(student => {
      console.log(`${student.rank}. ${student.name}: Course=${student.metrics.coursePoints}, Quiz=${student.metrics.quizPoints.toFixed(2)}, Total=${student.metrics.totalPoints.toFixed(2)}`);
    });

    // Reset needsLeaderboardUpdate flag for processed submissions
    if (courseUrl) {
      await db.collection('quizsubmissions').updateMany(
        { courseUrl, needsLeaderboardUpdate: true },
        { $set: { needsLeaderboardUpdate: false } }
      );
    }

    return res.status(200).json({ rankings: studentList });
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    return res.status(500).json({ message: 'Error fetching student data' });
  }
} 