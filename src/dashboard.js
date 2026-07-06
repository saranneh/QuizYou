// QuizYou Dashboard & Highscore/Ranking Module
import { appState } from './state.js';

export function saveExamToHistory(examResult) {
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

export function renderDashboard() {
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

export function updateRankings(data, subjectId, studentId, newScore) {
  // Find the subject
  const subject = data.subjects.find(s => s.subjectId === subjectId);

  if (!subject) {
    console.error("Subject not found.");
    return;
  }

  // Find the student
  const student = subject.students.find(s => s.studentId === studentId);

  if (!student) {
    console.error("Student not found. Id: " + studentId);
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

export function getStudentRank(data, subjectId, studentId) {
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

export async function loadLeaderboards() {
    const response = await fetch("highscores.json");

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}

let currentSubjectIndex = 0;

export function renderLeaderboards(containerId, data) {
  const tabsContainer = document.getElementById("leaderboard-tabs");
  const content = document.getElementById("leaderboard-content");

  tabsContainer.innerHTML = "";
  content.innerHTML = "";

  // Build tabs
  data.subjects.forEach((subject, index) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.textContent = subject.subjectName;

    if (index === currentSubjectIndex) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      currentSubjectIndex = index;
      renderLeaderboards(containerId, data);
    });

    tabsContainer.appendChild(btn);
  });

  // Render selected subject
  const subject = data.subjects[currentSubjectIndex];
  const students = [...subject.students];

  students.sort((a, b) =>
    (b.highestQuizScore ?? -1) - (a.highestQuizScore ?? -1)
  );

  const highest = Math.max(
    ...students.map(s => s.highestQuizScore ?? 0),
    1
  );

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `<h2>${subject.subjectName}</h2>`;

  students.forEach((student, index) => {
    const score = student.highestQuizScore ?? 0;

    let medal = index + 1;
    if (index === 0) medal = "🥇";
    else if (index === 1) medal = "🥈";
    else if (index === 2) medal = "🥉";

    const row = document.createElement("div");
    row.className = "student";

    if (index === 0) row.classList.add("gold");
    if (index === 1) row.classList.add("silver");
    if (index === 2) row.classList.add("bronze");

    row.innerHTML = `
      <div class="rank">${medal}</div>

      <div class="name">
        <strong>${student.studentName}</strong>
        <div class="bar">
          <div class="fill" style="width:${(score / highest) * 100}%"></div>
        </div>
      </div>

      <div class="score">
        ${student.highestQuizScore ?? "No Score"}
      </div>
    `;

    card.appendChild(row);
  });

  content.appendChild(card);
}
