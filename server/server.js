require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const xlsx = require('xlsx');

const User = require('./models/User');
const Course = require('./models/Course');
const Section = require('./models/Section');
const Quiz = require('./models/Quiz');
const ExamResult = require('./models/ExamResult');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Middleware: Authenticate Request
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // contains { id, role }
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid Session Token." });
  }
}

// 1. JWT User Login
app.post('/api/auth/login', async (req, res) => {
  const { id, password } = req.body;
  try {
    const user = await User.findOne({ id: id.toLowerCase() });
    if (!user) return res.status(400).json({ error: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Credentials" });

    const token = jwt.sign(
      { _id: user._id, id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch User's Courses
app.get('/api/courses', authenticate, async (req, res) => {
  try {
    let sections;
    if (req.user.role === 'professor') {
      sections = await Section.find({ professor: req.user._id }).populate('course');
    } else {
      sections = await Section.find({ students: req.user._id }).populate('course');
    }

    // Map list to clean array of courses
    const courses = sections.map(s => ({
      _id: s.course._id,
      code: s.course.code,
      name: s.course.name,
      sectionCode: s.sectionCode,
      semester: s.semester
    }));

    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Fetch Quizzes for a specific Course
app.get('/api/courses/:courseId/quizzes', authenticate, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId })
      .select('-questions.correctAnswer');

    // We omit the correctAnswer indices from being visible to students on initial load for security.
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Fetch specific quiz details (For students taking it)
app.get('/api/quizzes/:quizId', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Submit Quiz Score
app.post('/api/results', authenticate, async (req, res) => {
  const { quizId, score, percentage, timeTaken } = req.body;
  try {
    const result = new ExamResult({
      student: req.user._id,
      quiz: quizId,
      score,
      percentage,
      timeTaken
    });

    await result.save();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get Dashboard History for Student
app.get('/api/results/history', authenticate, async (req, res) => {
  try {
    const results = await ExamResult.find({ student: req.user._id })
      .populate({
        path: 'quiz',
        populate: { path: 'course' }
      })
      .sort({ date: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Bulk Upload Excel Questions (Professor creates a quiz inside a course)
app.post(
  '/api/admin/courses/:courseId/quizzes/upload-excel',
  authenticate,
  upload.single('excelFile'),
  async (req, res) => {
    try {
      if (req.user.role !== 'professor') {
        return res.status(403).json({ error: "Only professors can upload quizzes." });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload an Excel file.' });
      }

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);

      const questionsToInsert = [];
      const quizTitle = req.query.title || 'Excel Uploaded Quiz';
      const timeLimit = parseInt(req.query.timeLimit) || 10;

      for (let row of rows) {
        const questionText = row['Question'];
        const options = [
          row['Option A'],
          row['Option B'],
          row['Option C'],
          row['Option D']
        ].filter(Boolean);

        let corrAnswer = row['Correct Answer'];
        if (typeof corrAnswer === 'string') {
          corrAnswer = corrAnswer.trim().toUpperCase().charCodeAt(0) - 65; // A->0, B->1...
        }

        if (questionText && options.length === 4 && corrAnswer >= 0 && corrAnswer <= 3) {
          questionsToInsert.push({
            question: questionText.trim(),
            options: options.map(o => String(o).trim()),
            correctAnswer: corrAnswer
          });
        }
      }

      if (questionsToInsert.length === 0) {
        return res.status(400).json({ error: "No valid questions found." });
      }

      const newQuiz = await Quiz.create({
        title: quizTitle,
        course: req.params.courseId,
        timeLimit,
        questions: questionsToInsert,
        createdBy: req.user._id
      });

      res.json({
        message: `Successfully created quiz "${quizTitle}" with ${questionsToInsert.length} questions.`
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.listen(5001, () => console.log("Server online on 5001"));
