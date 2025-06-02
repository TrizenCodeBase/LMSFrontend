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
  score: number;
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

    // Get student metrics with enrolled courses
    const studentList = await Promise.all(students.map(async (student) => {
      const userId = student._id.toString();

      // Get user's enrolled courses with progress
      const enrolledCourses = await db.collection('userCourses')
        .aggregate([
          {
            $match: { userId }
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

      console.log(`Enrolled courses for student ${userId}:`, enrolledCourses);

      // Get quiz scores
      const quizScores = await db.collection('quizSubmissions')
        .find({ 
          userId,
          isCompleted: true
        })
        .project({ score: 1 })
        .toArray() as QuizSubmission[];

      // Calculate metrics
      const coursePoints = enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0);
      const quizPoints = quizScores.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
      const totalPoints = coursePoints + quizPoints;

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

    return res.status(200).json({ rankings: studentList });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ message: 'Error fetching student data' });
  }
} 