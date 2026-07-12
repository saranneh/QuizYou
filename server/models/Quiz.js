const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true } // 0-indexed choice (0 = A, 1 = B, etc.)
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Midterm 1: Agile Methods"
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  timeLimit: { type: Number, required: true }, // in minutes
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
