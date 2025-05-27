const express = require('express');
const router = express.Router();
const QuizSubmission = require('../models/QuizSubmission');
const auth = require('../middleware/auth');

// ... existing routes ...

// Handle quiz submission
router.post('/:courseUrl/quiz-submission', auth, async (req, res) => {
  try {
    const { courseUrl } = req.params;
    const { dayNumber, title, questions, selectedAnswers, score, submittedDate } = req.body;

    // Validate required fields
    if (!courseUrl || !dayNumber || !questions || !selectedAnswers || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create new quiz submission
    const quizSubmission = new QuizSubmission({
      courseUrl,
      userId: req.user._id, // From auth middleware
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
});

module.exports = router; 