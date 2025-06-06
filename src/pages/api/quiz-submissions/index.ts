import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('📝 Processing quiz submission...');
    
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      console.log('❌ Unauthorized quiz submission attempt');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    const {
      courseUrl,
      dayNumber,
      title,
      questions,
      selectedAnswers,
      score,
      submittedDate
    } = req.body;

    // Validate required fields
    if (!courseUrl || !dayNumber || !questions || !selectedAnswers || score === undefined) {
      console.log('❌ Missing required fields in quiz submission:', {
        courseUrl,
        dayNumber,
        hasQuestions: !!questions,
        hasAnswers: !!selectedAnswers,
        score
      });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get user ID from session
    const userId = session.user.id;

    console.log('🔍 Checking existing attempts...', {
      userId,
      courseUrl,
      dayNumber
    });

    // Check existing attempts
    const existingAttempts = await db.collection('quizSubmissions')
      .find({
        userId,
        courseUrl,
        dayNumber
      })
      .sort({ attemptNumber: -1 })
      .toArray();

    console.log('📊 Existing attempts:', {
      count: existingAttempts.length,
      attempts: existingAttempts.map(a => ({
        attemptNumber: a.attemptNumber,
        score: a.score,
        submittedDate: a.submittedDate
      }))
    });

    // Check if max attempts reached (2 attempts per quiz)
    if (existingAttempts.length >= 2) {
      console.log('❌ Maximum attempts reached for quiz:', {
        userId,
        courseUrl,
        dayNumber
      });
      return res.status(400).json({ message: 'Maximum attempts reached for this quiz' });
    }

    // Create new submission
    const submission = {
      userId,
      courseUrl,
      dayNumber,
      title,
      questions,
      selectedAnswers,
      score,
      submittedDate: submittedDate || new Date(),
      attemptNumber: existingAttempts.length + 1,
      isCompleted: score >= 0, // Changed from score >= 70 to score > 0
      needsLeaderboardUpdate: true // Flag to trigger leaderboard update
    };

    console.log('💾 Saving quiz submission:', {
      userId,
      courseUrl,
      dayNumber,
      score,
      attemptNumber: submission.attemptNumber,
      isCompleted: submission.isCompleted
    });

    // Save submission
    await db.collection('quizSubmissions').insertOne(submission);

    // If quiz is completed (score > 0), update course progress
    if (score >= 0) {  // Changed from score >= 70 to score > 0
      console.log('🎯 Quiz completed successfully, updating course progress...');
      const course = await db.collection('courses')
        .findOne({ courseUrl });

      if (course) {
        await db.collection('userCourses').updateOne(
          { userId, courseId: course._id },
          { 
            $set: {
              [`quizProgress.${dayNumber}`]: true,
              lastUpdated: new Date()
            }
          }
        );
        console.log('✅ Course progress updated');
      }
    }

    // Return success
    console.log('✅ Quiz submission processed successfully');
    res.status(200).json({ 
      message: 'Quiz submission saved successfully',
      submission
    });

  } catch (error) {
    console.error('❌ Error saving quiz submission:', error);
    res.status(500).json({ message: 'Error saving quiz submission' });
  }
} 