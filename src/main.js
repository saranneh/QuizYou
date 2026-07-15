// QuizYou Main Orchestrator / Entry Module
import { appState } from './state.js';
//import { loadData } from './api.js';
import { restoreSession, handleLogin, handleLogout } from './auth.js';
import { navigateTo } from './navigation.js';
import { setupQuiz, renderQuestion, finishQuiz } from './quiz.js';
import { renderDashboard, loadLeaderboards, renderLeaderboards} from './dashboard.js';
import { goBack } from './navigation.js';
import { populateAdminCourses, setupAdminPanel } from './admin.js';
import { initAdminManagement, setupAdminManagementHandlers } from './admin_management.js';

// Initialize Application
async function init() {
  setupEventListeners();
  setupAdminManagementHandlers();
 // await loadData();
  restoreSession();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
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

    // registration form button
  document.getElementById('btn-landing-register').addEventListener('click', () => {
    navigateTo('register');
  });

  document.getElementById('btn-landing-about').addEventListener('click', () => {
    alert("QuizYou is a software engineering quiz prototype. It allows team members to verify their student credentials, configure module exams, and review score history.");
  });


  document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const inputId = document.getElementById('student-id').value.trim().toLowerCase();
    const inputPw = document.getElementById('student-pw').value;
    handleLogin(inputId, inputPw);
  });

  // Quiz Configuration Form
  document.getElementById('btn-config-dashboard').addEventListener('click', () => {
    renderDashboard();
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
    renderDashboard();
    navigateTo('dashboard');
  });

    
document.getElementById('btn-results-leaderboard').addEventListener('click', async () => {
    try {
        const data = await loadLeaderboards();
        renderLeaderboards("leaderboards", data);
        navigateTo('leaderboard');
        console.log("Leaderboards loaded and rendered successfully.");
    } catch (err) {
        console.error(err);
    }
});

document.getElementById('btn-config-leaderboard').addEventListener('click', async () => {
  try {
    const data = await loadLeaderboards();
    renderLeaderboards("leaderboards", data);
    navigateTo('leaderboard');
    console.log("Config → leaderboard loaded");
  } catch (err) {
    console.error("Leaderboard error:", err);
  }
});

  // Dashboard Buttons
  document.getElementById('btn-dash-config').addEventListener('click', () => {
    navigateTo('config');
  });

  document.getElementById('btn-dash-logout').addEventListener('click', () => {
    handleLogout();
  });

  // Back Buttons
  document.getElementById('leaderboard-back-btn').addEventListener('click', goBack);
  document.getElementById('register-back-btn').addEventListener('click', goBack);
  document.getElementById('btn-auth-back').addEventListener('click', goBack);

  // Professor Portal Navigation
  document.getElementById('btn-config-admin').addEventListener('click', async () => {
    await populateAdminCourses();
    navigateTo('admin');
  });

  // Registration Management Navigation
  const btnConfigRegistration = document.getElementById('btn-config-registration');
  if (btnConfigRegistration) {
    btnConfigRegistration.addEventListener('click', async () => {
      await initAdminManagement();
      navigateTo('admin-management');
    });
  }

  setupAdminPanel();
}
