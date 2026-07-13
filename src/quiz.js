// QuizYou Quiz Engine Module
import { appState } from './state.js';
import { navigateTo } from './navigation.js';
import { saveExamToHistory, updateRankings, getStudentRank } from './dashboard.js';
import { fetchCourses, fetchQuizzesForCourse, fetchQuizDetails, submitQuizResult } from './api.js';

export function getSubjectLabel(sub) {
  return sub;
}

export async function populateCourseAndQuizzes() {
  const courseDropdown = document.getElementById('config-course');
  const quizDropdown = document.getElementById('config-quiz');
  
  // Show Professor Portal button if the user is a professor or admin
  const adminBtn = document.getElementById('btn-config-admin');
  if (adminBtn) {
    const userRole = appState.currentUser ? appState.currentUser.role : 'student';
    adminBtn.style.display = (userRole === 'professor' || userRole === 'admin') ? 'block' : 'none';
  }

  if (!courseDropdown || !quizDropdown) return;

  const courses = await fetchCourses();
  courseDropdown.innerHTML = '';
  
  if (courses.length === 0) {
    courseDropdown.innerHTML = '<option value="">No courses available</option>';
    quizDropdown.innerHTML = '<option value="">No quizzes available</option>';
    return;
  }

  courses.forEach(c => {
    courseDropdown.innerHTML += `<option value="${c._id}">${c.code} - ${c.name} (${c.sectionCode})</option>`;
  });

  // Handle course changes to fetch quizzes dynamically
  courseDropdown.onchange = async () => {
    const selectedCourseId = courseDropdown.value;
    if (!selectedCourseId) return;

    const quizzes = await fetchQuizzesForCourse(selectedCourseId);
    quizDropdown.innerHTML = '';
    
    if (quizzes.length === 0) {
      quizDropdown.innerHTML = '<option value="">No quizzes available</option>';
      return;
    }

    quizzes.forEach(q => {
      quizDropdown.innerHTML += `<option value="${q._id}">${q.title} (${q.questions.length} Qs)</option>`;
    });
  };

  // Trigger initial populate
  await courseDropdown.onchange();
}

export async function setupQuiz() {
  const quizDropdown = document.getElementById('config-quiz');
  const quizId = quizDropdown ? quizDropdown.value : null;

  if (!quizId) {
    alert("Please select a quiz to start!");
    return;
  }

  // Load complete quiz details including questions
  const quiz = await fetchQuizDetails(quizId);

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    alert("No questions found for the selected quiz.");
    return;
  }

  appState.activeSubject = quiz.title;
  appState.totalTimeLimit = quiz.timeLimit;
  appState.quizQuestions = quiz.questions;
  appState.activeQuizId = quiz._id;

  // Reset quiz state
  appState.currentQuestionIdx = 0;

  // Initialize answers based on question type
  appState.selectedAnswers = {};

  quiz.questions.forEach((question, index) => {
    switch (question.type) {
      case 'multi_select':
        // Store an array of selected option indexes
        appState.selectedAnswers[index] = [];
        break;

      case 'multiple_choice':
      case 'true_false':
      default:
        // Store a single selected option index
        appState.selectedAnswers[index] = null;
        break;
    }
  });

  appState.timerSecondsLeft = quiz.timeLimit * 60;

  // Render the first question
  renderQuestion();

  // Navigate to the quiz screen
  navigateTo('quiz');

  // Start the countdown timer
  startTimer();
}

export function startTimer() {
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

export function updateTimerUI() {
  const timerText = document.getElementById('quiz-timer-text');
  const timerContainer = document.querySelector('.quiz-timer');
  
  if (!timerText || !timerContainer) return;

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

export function renderQuestion() {
  const total = appState.quizQuestions.length;
  const current = appState.currentQuestionIdx;
  const question = appState.quizQuestions[current];

  document.getElementById('quiz-current-num').textContent = current + 1;
  document.getElementById('quiz-total-num').textContent = total;

  document.getElementById('quiz-progress-bar').style.width =
    `${(current / total) * 100}%`;

  document.getElementById('quiz-question-text').textContent =
    question.question;

  const optionsList = document.getElementById('quiz-options-list');
  optionsList.innerHTML = '';

  const isMulti = question.type === 'multi_select';

  question.options.forEach((option, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';

    const selected = appState.selectedAnswers[current];

    if (isMulti) {
      if (Array.isArray(selected) && selected.includes(idx)) {
        btn.classList.add('selected');
      }
    } else {
      if (selected === idx) {
        btn.classList.add('selected');
      }
    }

    const letter = String.fromCharCode(65 + idx);

    btn.innerHTML = `
      <span style="display:flex;align-items:center;">
        <span class="option-index">${letter}</span>
        <span>${option}</span>
      </span>
    `;

    btn.onclick = () => selectOption(idx);

    optionsList.appendChild(btn);
  });

  const prevBtn = document.getElementById('btn-quiz-prev');
  const nextBtn = document.getElementById('btn-quiz-next');

  prevBtn.style.visibility = current === 0 ? 'hidden' : 'visible';
  nextBtn.textContent =
    current === total - 1 ? 'Submit Exam' : 'Next Question';
}

export function selectOption(optionIndex) {
  const question =
    appState.quizQuestions[appState.currentQuestionIdx];

  const buttons = document.querySelectorAll('.option-btn');

  if (question.type === 'multi_select') {
    let selected =
      appState.selectedAnswers[appState.currentQuestionIdx] || [];

    if (selected.includes(optionIndex)) {
      selected = selected.filter(i => i !== optionIndex);
    } else {
      selected.push(optionIndex);
    }

    selected.sort((a, b) => a - b);

    appState.selectedAnswers[appState.currentQuestionIdx] =
      selected;

    buttons.forEach((btn, idx) => {
      btn.classList.toggle(
        'selected',
        selected.includes(idx)
      );
    });

  } else {
    appState.selectedAnswers[appState.currentQuestionIdx] =
      optionIndex;

    buttons.forEach((btn, idx) => {
      btn.classList.toggle(
        'selected',
        idx === optionIndex
      );
    });
  }
}

export async function finishQuiz() {
  clearInterval(appState.timerInterval);

  let correctCount = 0;
  const totalQuestions = appState.quizQuestions.length;

  appState.quizQuestions.forEach((q, idx) => {

  const answer = appState.selectedAnswers[idx];

  if (q.type === 'multi_select') {

    const student = Array.isArray(answer)
      ? [...answer].sort((a,b)=>a-b)
      : [];

    const correct = [...q.correctAnswers].sort((a,b)=>a-b);

    if (
      student.length === correct.length &&
      student.every((v,i)=>v===correct[i])
    ) {
      correctCount++;
    }

  } else {

    if (answer === q.correctAnswer) {
      correctCount++;
    }

  }

});

  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const timeTakenSec = (appState.totalTimeLimit * 60) - appState.timerSecondsLeft;
  const timeTakenMin = Math.floor(timeTakenSec / 60);
  const timeTakenRemainderSec = timeTakenSec % 60;
  const timeTakenFormatted = `${String(timeTakenMin).padStart(2, '0')}:${String(timeTakenRemainderSec).padStart(2, '0')}`;

  // Submit result to MongoDB
  await submitQuizResult(
    appState.activeQuizId,
    `${correctCount}/${totalQuestions}`,
    percentage,
    timeTakenFormatted
  );

  document.getElementById('results-welcome-message').textContent = `Excellent effort, ${appState.currentUser.firstName}! Here is your scorecard:`;
  document.getElementById('results-subject').textContent = appState.activeSubject;
  document.getElementById('results-raw').textContent = `${correctCount} / ${totalQuestions}`;
  document.getElementById('results-percent').textContent = `${percentage}%`;
  document.getElementById('results-rank').textContent = '--'; // Calculated dynamically on leaderboard
  document.getElementById('results-time-taken').textContent = timeTakenFormatted;

  navigateTo('results');
}
