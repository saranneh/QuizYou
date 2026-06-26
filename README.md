# QuizYou 🎓

**QuizYou** is a modern, interactive web-based exam and quiz dashboard designed for software engineering teams to assess, track, and master their software engineering knowledge. Built with a responsive, premium glassmorphism interface, this application acts as the foundation for the CS 673 Software Engineering team project.

🚀 **Live Demo:** [https://saranneh.github.io/QuizYou/](https://saranneh.github.io/QuizYou/)

### 🛠️ Tech Stack
*   **Frontend:** HTML5, CSS3 (Custom Glassmorphism), Modern JavaScript (ES6 SPA)
*   **Data Layer (Initial):** Flat JSON File Databases (`students.json`, `questions.json`)
*   **CI/CD / Hosting:** GitHub Actions & GitHub Pages
*   **Planned Migration:** MongoDB (Cloud Atlas) & Node.js/Express API

---

## 👥 The Team Roster
Our team is composed of the following members:
*   **Abhishikth Koka** ([abhikoka@bu.edu](mailto:abhikoka@bu.edu))
*   **Amir M Chaman** ([chaman11@bu.edu](mailto:chaman11@bu.edu))
*   **Cole Smith** ([csmith00@bu.edu](mailto:csmith00@bu.edu))
*   **David Bacon** ([dbacon89@bu.edu](mailto:dbacon89@bu.edu))
*   **Saranne Hobbs** ([saranneh@bu.edu](mailto:saranneh@bu.edu))
*   **Sophia Muren** ([smuren@bu.edu](mailto:smuren@bu.edu))

---

## 🚀 Getting Started

### Prerequisites
QuizYou is built as a modular client-side application. No heavy compilers, bundlers, or databases are required to run this first-week visual shell.

### Local Development / Running the App
To open the application locally:
1.  Clone this repository to your machine.
2.  Open `index.html` directly in your favorite web browser (e.g. double-click the file).
    *   *Note: Due to browser CORS policies, fetching local JSON files (`students.json` and `questions.json`) is blocked when loaded via the `file://` protocol. The app automatically detects this and falls back to matching in-memory Javascript arrays. Everything will remain fully functional!*
3.  **For a local server environment (Recommended):**
    If you have Python installed, you can launch a local server to load the database files dynamically:
    ```bash
    # Python 3
    python -m http.server 8000
    ```
    Then navigate to `http://localhost:8000` in your browser.

---

## 📂 Repository Structure
```
QuizYou/
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD deployment configuration for GitHub Pages
├── .gitignore              # Files to ignore in git commits
├── README.md               # Team project documentation (this file)
├── index.html              # Core single-page application structure
├── style.css               # Premium CSS layout variables and tokens
├── app.js                  # Frontend client engine and mock database layer
├── students.json           # Roster database (JSON flat file)
└── questions.json          # Exam question bank database (JSON flat file)
```

---

## 🛠️ MVP Development Roadmap
This initial shell provides the premium layout styles, navigation routing, and flat database structure. Over the course of the project, we will be implementing the following MVP features:

1.  **Authentication & Sessions**: Replace the current client-side ID check with secure authentication, passwords, session management, and JSON Web Tokens (JWT).
2.  **Interactive Quiz Screen**: Fully build out the question view, adding randomized pools, timing engines, and selection history.
3.  **Personal Performance Dashboard**: Show analytics on topic scoring, average progress, historical trends, and strengths/weaknesses.
4.  **Leaderboard & Professor Dashboard**: Build a separate panel for the professor role to manage quiz contents and monitor class standings.
5.  **MongoDB Migration**: Transition the flat data layer (`students.json`, `questions.json`) to cloud-hosted MongoDB with a structured backend API.

---

## 🤝 Collaboration Guidelines
*   **Branching**: Always create a feature branch off of `main` for new updates (e.g., `git checkout -b feature/auth-flow`).
*   **Commits**: Use descriptive commit messages (e.g., `git commit -m "feat: add subject filter to config screen"`).
*   **Pull Requests**: Push your feature branch and open a Pull Request (PR) on GitHub. Have at least one other team member review the code before merging.
