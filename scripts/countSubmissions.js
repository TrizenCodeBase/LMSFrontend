import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MongoDB_URL = process.env.MongoDB_URL || 'mongodb+srv://user:user@cluster0.jofrcro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
console.log('Connecting to MongoDB...');
try {
  await mongoose.connect(MongoDB_URL);
  console.log('Connected to MongoDB');

  // Define the schema
  const quizSubmissionSchema = new mongoose.Schema({
    courseUrl: String,
    userId: mongoose.Schema.Types.ObjectId,
    dayNumber: Number,
    title: String,
    score: Number,
    submittedDate: Date
  });

  const QuizSubmission = mongoose.models.QuizSubmission || mongoose.model('QuizSubmission', quizSubmissionSchema);

  // The user ID we're looking for
  const targetUserId = '68384d7ce137d5e9228ea76a';
  const userObjectId = new mongoose.Types.ObjectId(targetUserId);
  
  console.log('Looking for submissions with userId:', targetUserId);
  console.log('User ObjectId:', userObjectId);

  // Get all documents first
  const allDocs = await QuizSubmission.find({}).lean();
  console.log('\nTotal documents in collection:', allDocs.length);

  if (allDocs.length > 0) {
    console.log('\nAll documents in collection:');
    allDocs.forEach((doc, i) => {
      console.log(`\nDocument ${i + 1}:`);
      console.log('userId:', doc.userId);
      console.log('courseUrl:', doc.courseUrl);
      console.log('dayNumber:', doc.dayNumber);
      console.log('score:', doc.score);
      console.log('userId type:', typeof doc.userId);
      if (doc.userId) {
        console.log('userId matches?', doc.userId.toString() === targetUserId);
      }
    });

    // Try different matching approaches
    const exactMatches = allDocs.filter(doc => doc.userId && doc.userId.toString() === targetUserId);
    console.log('\nMatching documents found:', exactMatches.length);

    if (exactMatches.length > 0) {
      console.log('\nMatching submissions:');
      exactMatches.forEach((sub, i) => {
        console.log(`\n${i + 1}. ${sub.courseUrl} - Day ${sub.dayNumber}`);
        console.log(`   Score: ${sub.score}%`);
        console.log(`   Date: ${sub.submittedDate}`);
        console.log(`   ID: ${sub._id}`);
      });
    }
  }

} catch (error) {
  console.error('Connection error:', error);
} finally {
  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
} 