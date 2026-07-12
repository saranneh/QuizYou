# QuizYou 🎓

**QuizYou** is a modern, interactive web-based exam and quiz dashboard designed for software engineering teams to assess, track, and master their software engineering knowledge. Built with a responsive, premium glassmorphism interface, this application acts as the foundation for the CS 673 Software Engineering team project.

🚀 **Live Demo:** [https://quizyou-vo9a.onrender.com/](https://quizyou-vo9a.onrender.com/)

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
QuizYou has been upgraded to a full MERN-stack application. To run it locally, you will need:
*   **Node.js** (v14 or higher) installed on your machine.
*   A **MongoDB Atlas** connection string (or a local MongoDB instance).

### Local Development / Running the App
To run the full-stack application locally:
1.  Clone this repository to your machine.
2.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
3.  Install the required backend dependencies:
    ```bash
    npm install
    ```
4.  Create a `.env` file inside the `server/` folder and add your database credentials:
    ```env
    MONGODB_URI="mongodb+srv://<your-username>:<your-password>@cluster.mongodb.net/quizyoudb?appName=QuizYou"
    JWT_SECRET="your_secret_key"
    ```
5.  Start the development server (which also serves the frontend):
    ```bash
    npm run dev
    ```
6.  Open your browser and navigate to **`http://localhost:5001`**.

---

## 📂 Repository Structure
```
QuizYou/
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD deployment configuration for GitHub Pages
├── src/                    # Modular application source code (ES6 Modules)
│   ├── api.js              # Handles database loads (students, questions)
│   ├── auth.js             # Manages student session and authentication state
│   ├── dashboard.js        # Logic for saving progress and rendering dashboard stats
│   ├── main.js             # Main coordinator, event listeners entry point
│   ├── navigation.js       # Handles SPA transitions between screens
│   ├── quiz.js             # Active exam quiz engine and timer controller
│   └── state.js            # Shared global state object
├── .gitignore              # Files to ignore in git commits
├── README.md               # Team project documentation (this file)
├── index.html              # Core single-page application structure
├── style.css               # Premium CSS layout variables and tokens
├── highscores.json         # Leaderboard database (JSON flat file)
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
