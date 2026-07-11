// QuizYou Navigation / SPA Routing Module

export const screens = {
  landing: document.getElementById('screen-landing'),
  auth: document.getElementById('screen-auth'),
  config: document.getElementById('screen-config'),
  quiz: document.getElementById('screen-quiz'),
  results: document.getElementById('screen-results'),
  dashboard: document.getElementById('screen-dashboard'),
  leaderboard: document.getElementById('screen-leaderboard'),
  register: document.getElementById('screen-register'),
};

let currentScreen = 'landing';
const history = [];

export function navigateTo(screenKey) {
  if (screenKey === currentScreen) return;

  history.push(currentScreen);
  currentScreen = screenKey;

  Object.keys(screens).forEach(key => {
    if (screens[key]) {
      screens[key].classList.toggle('active', key === screenKey);
    }
  });
}

export function goBack() {
  if (history.length === 0) return;

  const previousScreen = history.pop();
  currentScreen = previousScreen;

  Object.keys(screens).forEach(key => {
    if (screens[key]) {
      screens[key].classList.toggle('active', key === previousScreen);
    }
  });
}

export function resetNavigationHistory() {
  history.length = 0;
  currentScreen = null;
}
