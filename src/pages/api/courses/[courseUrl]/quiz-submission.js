import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import QuizSubmission from '@/models/QuizSubmission';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Connect to database
    await connectToDatabase();

    const { courseUrl } = req.query;
    const { dayNumber, title, questions, selectedAnswers, score, submittedDate } = req.body;

    // Validate required fields
    if (!courseUrl || !dayNumber || !questions || !selectedAnswers || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create new quiz submission
    const quizSubmission = new QuizSubmission({
      courseUrl,
      userId: session.user.id,
      dayNumber,
      title,
      questions,
      selectedAnswers,
      score,
      submittedDate: new Date(submittedDate)
    });

    // Save to database
    await quizSubmission.save();

    return res.status(201).json(quizSubmission);
  } catch (error) {
    console.error('Error saving quiz submission:', error);
    return res.status(500).json({ message: 'Error saving quiz submission' });
  }
} 