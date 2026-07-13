const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ['multiple_choice', 'multi_select', 'true_false'],
    default: 'multiple_choice',
    required: true
  },

  // Used for multiple_choice and multi_select
  options: {
    type: [String],
    default: function () {
      return this.type === 'true_false' ? ['True', 'False'] : [];
    }
  },

  // Single correct answer (0-indexed)
  correctAnswer: {
    type: Number,
    validate: {
      validator: function (value) {
        return this.type !== 'multiple_choice' || Number.isInteger(value);
      },
      message: 'Multiple choice questions require a single correctAnswer.'
    }
  },

  // Multiple correct answers (0-indexed)
  correctAnswers: {
    type: [Number],
    default: [],
    validate: {
      validator: function (value) {
        return this.type !== 'multi_select' || value.length > 0;
      },
      message: 'Multi-select questions require at least one correct answer.'
    }
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },

  timeLimit: {
    type: Number,
    required: true
  },

  questions: [questionSchema],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', quizSchema);
