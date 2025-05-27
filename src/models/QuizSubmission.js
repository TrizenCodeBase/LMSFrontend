const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema({
  courseUrl: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  questions: [{
    question: String,
    options: [{
      text: String,
      isCorrect: Boolean
    }]
  }],
  selectedAnswers: [Number],
  score: {
    type: Number,
    required: true
  },
  submittedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for faster queries
quizSubmissionSchema.index({ courseUrl: 1, userId: 1, dayNumber: 1 });

module.exports = mongoose.models.QuizSubmission || mongoose.model('QuizSubmission', quizSubmissionSchema); 