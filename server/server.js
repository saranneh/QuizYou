require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

const User = require('./models/User');
const Course = require('./models/Course');
const Section = require('./models/Section');
const Quiz = require('./models/Quiz');
const ExamResult = require('./models/ExamResult');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files to bypass file:// CORS issues
app.use(express.static(path.join(__dirname, '../')));

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

// 0. JWT User Registration
app.post('/api/auth/register', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: "Email already registered." });

    const idPrefix = email.split('@')[0].toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      id: idPrefix,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: (role || 'student').toLowerCase()
    });

    await newUser.save();
    res.status(201).json({ message: "Registration successful", userId: newUser.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    if (req.user.role === 'professor' || req.user.role === 'admin') {
      const allCourses = await Course.find();
      const mapped = allCourses.map(c => ({
        _id: c._id,
        code: c.code,
        name: c.name,
        sectionCode: 'All Sections'
      }));
      return res.json(mapped);
    }

    const sections = await Section.find({ students: req.user._id }).populate('course');
    
    // Map list to clean array of courses
    const courses = sections
      .filter(s => s.course != null)
      .map(s => ({
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
        return res.status(403).json({ error: 'Only professors can upload quizzes.' });
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

      for (const row of rows) {
        const questionText = String(row['Question'] || '').trim();
        const type = String(row['Type'] || 'multiple_choice')
          .trim()
          .toLowerCase();

        if (!questionText) continue;

        let question = {
          question: questionText,
          type
        };

        if (type === 'true_false') {
          question.options = ['True', 'False'];

          const answer = String(row['Correct Answer'] || '')
            .trim()
            .toUpperCase();

          if (answer === 'TRUE') {
            question.correctAnswer = 0;
          } else if (answer === 'FALSE') {
            question.correctAnswer = 1;
          } else {
            continue; // Invalid true/false answer
          }
        }
        else {
          const options = [
            row['Option A'],
            row['Option B'],
            row['Option C'],
            row['Option D']
          ]
            .filter(value => value !== undefined && value !== null && value !== '')
            .map(value => String(value).trim());

          if (options.length < 2) continue;

          question.options = options;

          if (type === 'multiple_choice') {
            let answer = String(row['Correct Answer'] || '')
              .trim()
              .toUpperCase();

            const index = answer.charCodeAt(0) - 65;

            if (index < 0 || index >= options.length) continue;

            question.correctAnswer = index;
          }
          else if (type === 'multi_select') {
            const answers = String(row['Correct Answer'] || '')
              .toUpperCase()
              .split(',')
              .map(a => a.trim())
              .filter(Boolean);

            const indexes = answers.map(a => a.charCodeAt(0) - 65);

            if (
              indexes.length === 0 ||
              indexes.some(i => i < 0 || i >= options.length)
            ) {
              continue;
            }

            question.correctAnswers = [...new Set(indexes)];
          }
          else {
            continue; // Unknown question type
          }
        }

        questionsToInsert.push(question);
      }

      if (questionsToInsert.length === 0) {
        return res.status(400).json({
          error: 'No valid questions found.'
        });
      }

      const newQuiz = await Quiz.create({
        title: quizTitle,
        course: req.params.courseId,
        timeLimit,
        questions: questionsToInsert,
        createdBy: req.user._id
      });

      res.json({
        message: `Successfully created quiz "${newQuiz.title}" with ${questionsToInsert.length} questions.`,
        quizId: newQuiz._id
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
// --- ADMIN MANAGEMENT ENDPOINTS ---

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

// Users
app.get('/api/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  const { id, firstName, lastName, email, password, role } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { id: id.toLowerCase() }] });
    if (existing) return res.status(400).json({ error: "Email or ID already exists." });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      id: id.toLowerCase(),
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: (role || 'student').toLowerCase()
    });
    
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Courses
app.post('/api/courses', authenticate, requireAdmin, async (req, res) => {
  const { code, name, description } = req.body;
  try {
    const newCourse = new Course({ code, name, description });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/courses/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    await Course.findByIdAndDelete(courseId);
    await Section.deleteMany({ course: courseId });
    await Quiz.deleteMany({ course: courseId });
    res.json({ message: "Course and related sections/quizzes deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sections & Roster
app.get('/api/sections', authenticate, requireAdmin, async (req, res) => {
  try {
    const sections = await Section.find().populate('course').populate('professor').populate('students');
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sections', authenticate, requireAdmin, async (req, res) => {
  const { course, sectionCode, professor, semester } = req.body;
  try {
    const newSection = new Section({ course, sectionCode, professor, semester, students: [] });
    await newSection.save();
    res.status(201).json(newSection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sections/:id/enroll', authenticate, requireAdmin, async (req, res) => {
  const { studentIds } = req.body; // Array of User ObjectIds
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ error: "Section not found" });
    
    // Add unique students
    const newStudents = studentIds.filter(id => !section.students.includes(id));
    section.students.push(...newStudents);
    
    await section.save();
    res.json(section);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- END ADMIN MANAGEMENT ENDPOINTS ---

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server online on port ${PORT}`));
