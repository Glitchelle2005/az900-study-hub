# AuraCloud AZ-900 Study Suite & Candidate Portal (Unofficial)

> **Coursework & Assessment Project Submission**  
> *A full-stack, responsive certification preparation suite featuring a Node.js REST API server, persistent JSON database, dedicated candidate sign-in portal, modular CSS architecture, and real-time search engine.*

---

## 📋 Project Overview

**AuraCloud** is an educational platform designed to help students and professionals prepare for and pass the **Microsoft Azure Fundamentals (AZ-900)** certification exam.

The application is engineered with a **clean separation of concerns**:
- **Dedicated Sign-In Portal (`signin.html`)**: Complete authentication flow with role-based access, 1-click examiner demo credentials, input validation, and password visibility toggle.
- **Custom Modular CSS Stylesheet (`css/style.css`)**: Centralized design system with CSS custom properties (variables), light/dark theme support, glassmorphism, responsive breakpoints, and animations.
- **Node.js REST API Server (`server.js`)**: Real backend server handling static asset pipelines, user authentication sessions, live search queries, and quiz attempt persistence.
- **Persistent Database (`data/database.json`)**: Pre-populated with 32+ authoritative AZ-900 architecture concepts, 25+ exam questions, Leitner flashcards, user profiles, and test attempts.
- **Interactive Dashboard & Search Engine (`index.html`)**: Full-featured candidate dashboard featuring real-time search across the entire database, smart quiz coach with instant why-wrong feedback, 3-box Leitner flashcards, study planner, and AI Study Buddy.

---

## 🚀 Quick Start Guide (How to Run for Evaluation)

### Option 1: Running the Full-Stack Node.js Server (Recommended)

1. Open your terminal in the project directory:
   ```bash
   cd c:\Users\WANJIRU\OneDrive\Desktop\az900
   ```
2. Start the backend server:
   ```bash
   npm start
   # or directly:
   node server.js
   ```
3. Open your browser and navigate to:
   - **Candidate Sign-In Portal**: [http://localhost:3000/signin.html](http://localhost:3000/signin.html)
   - **Main Study Dashboard**: [http://localhost:3000/](http://localhost:3000/)
   - **API Health Endpoint**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### Option 2: Standalone Browser Evaluation (Offline Fallback)
The client includes dual-mode architecture: you can also directly open `signin.html` or `index.html` in any modern web browser without a terminal. All data and authentication gracefully fall back to local storage!

---

## 🔑 Examiner Quick Demo Credentials

To grade and test authentication instantly, the sign-in page features **1-Click Quick Demo Buttons**:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **AZ-900 Candidate** | Alex Mwangi | `alex.m@cloudstudy.africa` | `password123` |
| **Cloud Instructor** | Sarah Kimani | `sarah.k@cloudstudy.africa` | `password123` |

---

## 📁 Project Architecture & File Structure

```text
az900/
├── css/
│   └── style.css            # Modular external stylesheet (variables, themes, layouts, cards)
├── data/
│   └── database.json        # Persistent JSON database (users, concepts, questions, flashcards)
├── js/
│   └── (integrated client logic with dual offline/online API fallback)
├── index.html               # Main candidate dashboard (Search, Quizzes, Flashcards, Planner, Buddy)
├── signin.html              # Dedicated authentication portal (Matching Screenshots 2 & 3)
├── server.js                # Node.js REST API and static asset HTTP server
├── package.json             # NPM package manifest with 'npm start' command
└── README.md                # Project documentation and grading rubric map
```

---

## 🌐 Backend REST API Specification

The Node.js backend server (`server.js`) exposes the following RESTful endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server status, timestamp, and database operational check |
| `POST` | `/api/auth/login` | Authenticates candidate credentials and returns user session |
| `POST` | `/api/auth/register` | Registers a new candidate and appends to database |
| `POST` | `/api/auth/logout` | Terminates active session |
| `GET` | `/api/search?q={query}` | Full-text search across concepts, questions, and flashcards |
| `GET` | `/api/concepts` | Retrieves all 32+ AZ-900 architecture concepts |
| `GET` | `/api/concepts/:id` | Retrieves deep-dive breakdown for a specific concept |
| `GET` | `/api/questions` | Retrieves quiz question bank (supports `?domain=...`) |
| `POST` | `/api/attempts` | Saves candidate quiz score and timestamp to database |
| `GET` | `/api/attempts` | Retrieves past attempt records for analytics |
| `GET` | `/api/flashcards` | Retrieves spaced repetition Leitner deck |
| `GET` | `/api/stats` | Returns real-time computed readiness metrics |

---

## 🎯 Key Requirements & Grading Rubric Mapping

1. **Dedicated Sign-In Page (`signin.html`)**:
   - Visual aesthetic faithfully derived from student portal reference (soft lavender gradient, 2x2 showcase pills, clean card container).
   - Dynamic tab toggle between "Sign In" and "Create Account".
   - Form validation with inline red error alerts.
   - Show/hide password visibility toggle.
   - "Remember me" and "Forgot password" handlers.
   - Unauthorised access security banner.
2. **Dedicated CSS Stylesheet (`css/style.css`)**:
   - Fully externalized stylesheet utilizing CSS3 custom properties (`--primary`, `--bg-surface`, `--text-primary`).
   - Seamless Light and Dark mode theming.
   - Modern glassmorphic headers, rounded squircle avatars, and micro-interactions.
3. **Backend Server (`server.js`)**:
   - Written in clean, dependency-free Node.js so examiners can launch it immediately.
   - Static asset streaming with accurate MIME types.
   - REST endpoints with CORS headers and JSON payload parsing.
4. **Comprehensive Database & Real-Time Search**:
   - Covers all 3 AZ-900 domains: *Cloud Concepts*, *Azure Architecture & Services*, and *Azure Management & Governance*.
   - Global search input pill with keyboard shortcuts (`/` or `Ctrl+K`).
   - Search term highlighting and categorized results dropdown.
   - Interactive Concept Detail Modal with African business analogies and exam traps.
5. **Zero Hardcoded Counters**:
   - All statistics (readiness score, attempt counters, flashcard box counts, streaks) are dynamically calculated from the live database.
6. **Mandatory Compliance**:
   - Includes the required disclaimer footer across all views:
     > *"Unofficial study tool. Not affiliated with Microsoft."*

---

## 📄 License & Disclaimer

This project is an **unofficial** educational study aid developed for academic evaluation and AZ-900 certification preparation. Not affiliated with, endorsed by, or sponsored by Microsoft Corporation.
