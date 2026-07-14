require('dotenv').config({ path: require('path').join(__dirname, '../.env')
});

// Use Cloudflare DNS instead of the local resolver at 127.0.0.1.
// This prevents MongoDB Atlas SRV lookups from failing with ECONNREFUSED.
const dns = require("node:dns");
dns.setServers(["1.1.1.1", "1.0.0.1"]);
const dns = require("node:dns");

dns.setServers(["1.1.1.1", "1.0.0.1"]);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const Course = require('../models/Course');
const Section = require('../models/Section');
const Quiz = require('../models/Quiz');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to database. Purging old records...");

  await User.deleteMany({});
  await Course.deleteMany({});
  await Section.deleteMany({});
  await Quiz.deleteMany({});

  // 1. Create Users
  const plainStudents = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../students.json'), 'utf-8')
  );
  const userDocs = [];
  let profDoc = null;

  for (let student of plainStudents) {
    const hashed = await bcrypt.hash(student.password, 10);
    const role = (student.id === 'abhikoka') ? 'professor' : 'student';

    const userDoc = await User.create({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      password: hashed,
      role: role
    });
    
    if (role === 'professor') {
      profDoc = userDoc;
    } else {
      userDocs.push(userDoc);
    }
  }

  // Fallback if abhikoka is missing from JSON
  if (!profDoc) {
    const profHashed = await bcrypt.hash('password', 10);
    profDoc = await User.create({
      id: 'abhikoka',
      firstName: 'Abhishikth',
      lastName: 'Koka',
      email: 'abhikoka@bu.edu',
      password: profHashed,
      role: 'professor'
    });
  }

  console.log("Users Seeded successfully.");

  // 2. Create Courses
  const seCourse = await Course.create({
    code: 'CS591',
    name: 'Software Engineering',
    description: 'Web Dev & Testing methodologies'
  });

  const agileCourse = await Course.create({
    code: 'CS601',
    name: 'Agile Software Development',
    description: 'Scrum, standups, and release sprints'
  });

  // 3. Create Sections (Enroll all students in both courses for testing)
  const studentIds = userDocs.map(u => u._id);

  await Section.create({
    course: seCourse._id,
    sectionCode: 'A1',
    professor: profDoc._id,
    students: studentIds,
    semester: 'Fall 2026'
  });

  await Section.create({
    course: agileCourse._id,
    sectionCode: 'B1',
    professor: profDoc._id,
    students: studentIds,
    semester: 'Fall 2026'
  });

  console.log("Courses and Sections Seeded.");

  // 4. Create Quizzes out of existing questions
  const plainQuestions = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../questions.json'), 'utf-8')
  );

  const seQuestions = plainQuestions.filter(q =>
    ['Testing', 'Design Patterns', 'Git'].includes(q.subject)
  );
  const agileQuestions = plainQuestions.filter(q => q.subject === 'Agile');

  await Quiz.create({
    title: 'SE Frameworks & Git Midterm',
    course: seCourse._id,
    timeLimit: 10,
    questions: seQuestions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer
    })),
    createdBy: profDoc._id
  });

  await Quiz.create({
    title: 'Scrum Process Review Quiz',
    course: agileCourse._id,
    timeLimit: 5,
    questions: agileQuestions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer
    })),
    createdBy: profDoc._id
  });

  console.log("Quizzes Seeded. Seeding Done!");
  mongoose.connection.close();
}

seed().catch(err => console.error(err));
