// QuizYou - Frontend Application Logic

// Fallback local databases if file:// protocol blocks JSON fetches (CORS restrictions)
const FALLBACK_STUDENTS = [
  { "id": "dbacon89", "firstName": "David", "lastName": "Bacon", "email": "dbacon89@bu.edu" },
  { "id": "saranneh", "firstName": "Saranne", "lastName": "Hobbs", "email": "saranneh@bu.edu" },
  { "id": "smuren", "firstName": "Sophia", "lastName": "Muren", "email": "smuren@bu.edu" },
  { "id": "chaman11", "firstName": "Amir M", "lastName": "Chaman", "email": "chaman11@bu.edu" },
  { "id": "abhikoka", "firstName": "Abhishikth", "lastName": "Koka", "email": "abhikoka@bu.edu" },
  { "id": "csmith00", "firstName": "Cole", "lastName": "Smith", "email": "csmith00@bu.edu" }
];

const FALLBACK_QUESTIONS = [
  {
    "id": 1,
    "subject": "Testing",
    "question": "Which type of testing ensures that new code changes do not break existing functionality?",
    "options": [
      "Unit Testing",
      "Regression Testing",
      "Integration Testing",
      "System Testing"
    ],
    "correctAnswer": 1
  },
  {
    "id": 2,
    "subject": "Agile",
    "question": "What is the primary purpose of a Daily Standup meeting in Scrum?",
    "options": [
      "To give detailed status updates to the project manager",
      "To assign tasks to team members for the day",
      "To sync team progress, identify blockers, and plan the next 24 hours",
      "To demonstrate finished features to stakeholders"
    ],
    "correctAnswer": 2
  },
  {
    "id": 3,
    "subject": "Design Patterns",
    "question": "Which design pattern restricts the instantiation of a class to one single instance?",
    "options": [
      "Factory Pattern",
      "Observer Pattern",
      "Singleton Pattern",
      "Strategy Pattern"
    ],
    "correctAnswer": 2
  },
  {
    "id": 4,
    "subject": "Git",
    "question": "Which Git command updates your local branch with changes from a remote repository and merges them?",
    "options": [
      "git fetch",
      "git pull",
      "git push",
      "git checkout"
    ],
    "correctAnswer": 1
  }
];

// App State
let appState = {
  currentUser: null,      // Object when logged in
  currentUserid: null,    //current user's student id
  students: [],           // Loaded students list
  allQuestions: [],       // Loaded question pool
  quizQuestions: [],      // Active filtered questions
  currentQuestionIdx: 0,  // Index in quizQuestions
  selectedAnswers: {},    // Map of { questionIndex: optionIndex }
  timerSecondsLeft: 0,    // Timer track
  timerInterval: null,    // Timer reference
  totalTimeLimit: 0,      // Minutes limit
  activeSubject: 'all'
};

// DOM Elements
const screens = {
  landing: document.getElementById('screen-landing'),
  auth: document.getElementById('screen-auth'),
  config: document.getElementById('screen-config'),
  quiz: document.getElementById('screen-quiz'),
  results: document.getElementById('screen-results'),
  dashboard: document.getElementById('screen-dashboard')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadData();
  restoreSession();
});

// Load Database Files (students.json, questions.json)
async function loadData() {
  // Try loading students.json
  try {
    const res = await fetch('students.json');
    if (!res.ok) throw new Error('Not found');
    appState.students = await res.json();
  } catch (err) {
    console.warn("Using fallback students.json (e.g. running via file:// protocol)");
    appState.students = FALLBACK_STUDENTS;
  }

  // Try loading questions.json
  try {
    const res = await fetch('questions.json');
    if (!res.ok) throw new Error('Not found');
    appState.allQuestions = await res.json();
  } catch (err) {
    console.warn("Using fallback questions.json (e.g. running via file:// protocol)");
    appState.allQuestions = FALLBACK_QUESTIONS;
  }
}

// Check if user session is saved in localStorage
function restoreSession() {
  const savedUser = localStorage.getItem('quizyou_user');
  const savedId = localStorage.getItem('quizyou_userid');
  if (savedUser) {
    try {
      appState.currentUser = JSON.parse(savedUser);
      appState.currentUserid = JSON.parse(savedId);
      updateHeaderStatus(true);
      navigateTo('config');
    } catch (e) {
      localStorage.removeItem('quizyou_user');
      localStorage.removeItem('quizyou_userid');
    }
  }
}

// Update the header avatar and text status
function updateHeaderStatus(isLoggedIn) {
  const avatar = document.getElementById('user-status-avatar');
  const statusText = document.getElementById('user-status-text');
  
  if (isLoggedIn && appState.currentUser) {
    avatar.classList.add('logged-in');
    statusText.textContent = `${appState.currentUser.firstName} ${appState.currentUser.lastName}`;
  } else {
    avatar.classList.remove('logged-in');
    statusText.textContent = 'Guest Mode';
  }
}

// Navigation Helper
function navigateTo(screenKey) {
  Object.keys(screens).forEach(key => {
    if (key === screenKey) {
      screens[key].classList.add('active');
    } else {
      screens[key].classList.remove('active');
    }
  });

  // Screen specific hooks
  if (screenKey === 'dashboard') {
    renderDashboard();
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Brand Header Click
  document.getElementById('brand-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (appState.currentUser) {
      navigateTo('config');
    } else {
      navigateTo('landing');
    }
  });

  // Landing Page Buttons
  document.getElementById('btn-landing-start').addEventListener('click', () => {
    navigateTo('auth');
  });

  document.getElementById('btn-landing-about').addEventListener('click', () => {
    alert("QuizYou is a software engineering quiz prototype. It allows team members to verify their student credentials, configure module exams, and review score history.");
  });

  // Authentication Form
  document.getElementById('btn-auth-back').addEventListener('click', () => {
    navigateTo('landing');
  });

  document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const inputId = document.getElementById('student-id').value.trim().toLowerCase();
    const alertBox = document.getElementById('auth-alert');
    // Validate student ID
    const student = appState.students.find(s => s.id.toLowerCase() === inputId || s.email.split('@')[0].toLowerCase() === inputId);
    
    if (student) {
      alertBox.style.display = 'none';
      appState.currentUser = student;
      appState.currentUserid = inputId;
      localStorage.setItem('quizyou_user', JSON.stringify(student));
      localStorage.setItem('quizyou_userid', JSON.stringify(inputId));
      updateHeaderStatus(true);
      navigateTo('config');
    } else {
      alertBox.style.display = 'block';
    }
  });

  // Quiz Configuration Form
  document.getElementById('btn-config-dashboard').addEventListener('click', () => {
    navigateTo('dashboard');
  });

  document.getElementById('config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    setupQuiz();
  });

  // Quiz Control Buttons
  document.getElementById('btn-quiz-prev').addEventListener('click', () => {
    if (appState.currentQuestionIdx > 0) {
      appState.currentQuestionIdx--;
      renderQuestion();
    }
  });

  document.getElementById('btn-quiz-next').addEventListener('click', () => {
    // If selecting an answer
    const currentQuestion = appState.quizQuestions[appState.currentQuestionIdx];
    
    if (appState.currentQuestionIdx < appState.quizQuestions.length - 1) {
      appState.currentQuestionIdx++;
      renderQuestion();
    } else {
      // Last question - Submit
      finishQuiz();
    }
  });

  // Results Buttons
  document.getElementById('btn-results-retry').addEventListener('click', () => {
    navigateTo('config');
  });

  document.getElementById('btn-results-dashboard').addEventListener('click', () => {
    navigateTo('dashboard');
  });

  // Dashboard Buttons
  document.getElementById('btn-dash-config').addEventListener('click', () => {
    navigateTo('config');
  });

  document.getElementById('btn-dash-logout').addEventListener('click', () => {
    localStorage.removeItem('quizyou_user');
    localStorage.removeItem('quizyou_userid');
    appState.currentUser = null;
    appState.currentUserid = null;
    updateHeaderStatus(false);
    document.getElementById('student-id').value = '';
    navigateTo('landing');
  });
}

// Setup Quiz Configuration & Start Timer
function setupQuiz() {
  const subject = document.getElementById('config-subject').value;
  const numQuestionsInput = parseInt(document.getElementById('config-questions').value);
  const minutesInput = parseInt(document.getElementById('config-time').value);

  appState.activeSubject = subject;
  appState.totalTimeLimit = minutesInput;

  // Filter questions pool by subject
  let pool = [...appState.allQuestions];
  if (subject !== 'all') {
    pool = pool.filter(q => q.subject === subject);
  }

  // Shuffle pool using Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Cap quantity
  const limit = Math.min(numQuestionsInput, pool.length);
  appState.quizQuestions = pool.slice(0, limit);

  if (appState.quizQuestions.length === 0) {
    alert("No questions found for the selected subject. Please add questions to questions.json first!");
    return;
  }

  // Reset quiz states
  appState.currentQuestionIdx = 0;
  appState.selectedAnswers = {};
  appState.timerSecondsLeft = minutesInput * 60;

  // Render first question
  renderQuestion();
  navigateTo('quiz');

  // Start countdown timer
  startTimer();
}

// Timer management
function startTimer() {
  clearInterval(appState.timerInterval);
  updateTimerUI();
  
  appState.timerInterval = setInterval(() => {
    appState.timerSecondsLeft--;
    updateTimerUI();

    if (appState.timerSecondsLeft <= 0) {
      clearInterval(appState.timerInterval);
      alert("Time is up! Your exam will be submitted automatically.");
      finishQuiz();
    }
  }, 1000);
}

function updateTimerUI() {
  const timerText = document.getElementById('quiz-timer-text');
  const timerContainer = document.querySelector('.quiz-timer');
  
  const min = Math.floor(appState.timerSecondsLeft / 60);
  const sec = appState.timerSecondsLeft % 60;
  timerText.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

  // Color changing timer warning indicators
  if (appState.timerSecondsLeft <= 30) {
    timerContainer.className = 'quiz-timer danger';
  } else if (appState.timerSecondsLeft <= 120) {
    timerContainer.className = 'quiz-timer warning';
  } else {
    timerContainer.className = 'quiz-timer';
  }
}

// Render active question view
function renderQuestion() {
  const total = appState.quizQuestions.length;
  const current = appState.currentQuestionIdx;
  const question = appState.quizQuestions[current];

  // Update headers
  document.getElementById('quiz-current-num').textContent = current + 1;
  document.getElementById('quiz-total-num').textContent = total;

  // Update progress bar
  const progressPercent = ((current) / total) * 100;
  document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;

  // Render question text
  document.getElementById('quiz-question-text').textContent = question.question;

  // Render options list
  const optionsList = document.getElementById('quiz-options-list');
  optionsList.innerHTML = '';

  question.options.forEach((option, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    if (appState.selectedAnswers[current] === idx) {
      btn.classList.add('selected');
    }

    const indexLabel = String.fromCharCode(65 + idx); // A, B, C, D...
    btn.innerHTML = `<span style="display: flex; align-items: center;"><span class="option-index">${indexLabel}</span><span>${option}</span></span>`;
    
    btn.addEventListener('click', () => {
      selectOption(idx);
    });

    optionsList.appendChild(btn);
  });

  // Update bottom controls
  const prevBtn = document.getElementById('btn-quiz-prev');
  const nextBtn = document.getElementById('btn-quiz-next');

  if (current === 0) {
    prevBtn.style.visibility = 'hidden';
  } else {
    prevBtn.style.visibility = 'visible';
  }

  if (current === total - 1) {
    nextBtn.textContent = 'Submit Exam';
  } else {
    nextBtn.textContent = 'Next Question';
  }
}

// Click option handler
function selectOption(optionIndex) {
  appState.selectedAnswers[appState.currentQuestionIdx] = optionIndex;
  
  // Highlight selection immediately
  const options = document.querySelectorAll('.option-btn');
  options.forEach((btn, idx) => {
    if (idx === optionIndex) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// Finish & grade the exam
async function finishQuiz() {
  clearInterval(appState.timerInterval);

  let correctCount = 0;
  const totalQuestions = appState.quizQuestions.length;

  appState.quizQuestions.forEach((q, idx) => {
    if (appState.selectedAnswers[idx] === q.correctAnswer) {
      correctCount++;
    }
  });

  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const timeTakenSec =
    (appState.totalTimeLimit * 60) - appState.timerSecondsLeft;

  const timeTakenMin = Math.floor(timeTakenSec / 60);
  const timeTakenRemainderSec = timeTakenSec % 60;

  const timeTakenFormatted =
    `${String(timeTakenMin).padStart(2, '0')}:${String(timeTakenRemainderSec).padStart(2, '0')}`;

  let rankData = [];

  try {
    const res = await fetch('highscores.json');

    if (!res.ok) throw new Error('Not found');

    rankData = await res.json();
    appState.students = rankData;

  } catch (err) {
    console.warn("Rank Data not found", err);
  }

  updateRankings(
    rankData,
    appState.activeSubject,
    appState.currentUserid,
    percentage
  );

  const masteryRanking = getStudentRank(
    rankData,
    appState.activeSubject,
    appState.currentUserid
  );

  document.getElementById('results-welcome-message').textContent =
    `Excellent effort, ${appState.currentUser.firstName}! Here is your scorecard:`;

  document.getElementById('results-subject').textContent =
    getSubjectLabel(appState.activeSubject);

  document.getElementById('results-raw').textContent =
    `${correctCount} / ${totalQuestions}`;

  document.getElementById('results-percent').textContent =
    `${percentage}%`;

  document.getElementById('results-rank').textContent =
    masteryRanking;

  document.getElementById('results-time-taken').textContent =
    timeTakenFormatted;

  saveExamToHistory({
    subject: getSubjectLabel(appState.activeSubject),
    score: `${correctCount}/${totalQuestions}`,
    percentage: percentage,
    date: new Date().toLocaleDateString()
  });

  navigateTo('results');
}

function getSubjectLabel(sub) {
  switch (sub) {
    case 'all': return 'All Subjects';
    case 'Testing': return 'Testing & QA';
    case 'Agile': return 'Agile Scrum';
    case 'Design Patterns': return 'Design Patterns';
    case 'Git': return 'Version Control (Git)';
    default: return sub;
  }
}

// Store results locally to feed the Student Dashboard
function saveExamToHistory(examResult) {
  if (!appState.currentUser) return;
  const storageKey = `quizyou_history_${appState.currentUser.id}`;
  let history = [];
  
  const savedHistory = localStorage.getItem(storageKey);
  if (savedHistory) {
    try {
      history = JSON.parse(savedHistory);
    } catch (e) {
      history = [];
    }
  }

  history.unshift(examResult); // Add to beginning
  localStorage.setItem(storageKey, JSON.stringify(history));
}

// Render student dashboard with analytics
function renderDashboard() {
  if (!appState.currentUser) return;
  
  const storageKey = `quizyou_history_${appState.currentUser.id}`;
  let history = [];
  
  const savedHistory = localStorage.getItem(storageKey);
  if (savedHistory) {
    try {
      history = JSON.parse(savedHistory);
    } catch (e) {
      history = [];
    }
  }

  // Update metrics
  const examsCount = history.length;
  document.getElementById('dash-exams-count').textContent = examsCount;

  if (examsCount > 0) {
    const totalPercentage = history.reduce((sum, item) => sum + item.percentage, 0);
    const avg = Math.round(totalPercentage / examsCount);
    document.getElementById('dash-avg-score').textContent = `${avg}%`;
  } else {
    document.getElementById('dash-avg-score').textContent = '--';
  }

  // Update list
  const historyList = document.getElementById('dash-history-list');
  historyList.innerHTML = '';

  if (examsCount === 0) {
    historyList.innerHTML = `<div class="history-item" style="color: var(--text-dim);">No exams taken yet. Start a new exam to log metrics!</div>`;
  } else {
    // Show last 5
    const recent = history.slice(0, 5);
    recent.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      
      const badgeStyle = item.percentage >= 80 ? 'color: var(--success);' : item.percentage >= 50 ? 'color: var(--warning);' : 'color: var(--error);';
      
      el.innerHTML = `
        <span>${item.subject} <span class="history-date">(${item.date})</span></span>
        <span class="history-score" style="${badgeStyle}">${item.score} (${item.percentage}%)</span>
      `;
      historyList.appendChild(el);
    });
  }
}

function updateRankings(data, subjectId, studentId, newScore) {
    // Find the subject
    const subject = data.subjects.find(s => s.subjectId === subjectId);

    if (!subject) {
        console.error("Subject not found.");
        return;
    }

    // Find the student
    const student = subject.students.find(s => s.studentId === studentId);

    if (!student) {
        console.error("Student not found. Id: "+studentId);
        return;
    }

    // Update only if the new score is higher
    if (newScore > student.highestQuizScore || student.highestQuizScore == null) {
        student.highestQuizScore = newScore;
    }

    // Sort by highest score
    subject.students.sort((a, b) => b.highestQuizScore - a.highestQuizScore);

    // Assign ranks
    let currentRank = 1;

    subject.students.forEach((student, index) => {
        if (
            index > 0 &&
            student.highestQuizScore <
                subject.students[index - 1].highestQuizScore
        ) {
            currentRank = index + 1;
        }

        student.rank = currentRank;
    });
}

function getStudentRank(data, subjectId, studentId) {
    // Find the subject
    const subject = data.subjects.find(s => s.subjectId === subjectId);

    if (!subject) {
        return null; // Subject not found
    }

    // Find the student
    const student = subject.students.find(s => s.studentId === studentId);

    if (!student) {
        return null; // Student not found
    }

    return student.rank;
}
