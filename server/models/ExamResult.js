const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: String, required: true }, // e.g. "8/10"
  percentage: { type: Number, required: true },
  timeTaken: { type: String, required: true }, // e.g. "02:14"
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExamResult', examResultSchema);
