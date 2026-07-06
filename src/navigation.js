// QuizYou Navigation / SPA Routing Module

export const screens = {
  landing: document.getElementById('screen-landing'),
  auth: document.getElementById('screen-auth'),
  config: document.getElementById('screen-config'),
  quiz: document.getElementById('screen-quiz'),
  results: document.getElementById('screen-results'),
  dashboard: document.getElementById('screen-dashboard'),
  leaderboard: document.getElementById('screen-leaderboard'),
};

export function navigateTo(screenKey) {
  Object.keys(screens).forEach(key => {
    if (screens[key]) {
      if (key === screenKey) {
        screens[key].classList.add('active');
      } else {
        screens[key].classList.remove('active');
      }
    }
  });
}
