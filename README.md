<p align="center">
  <img src="src/assets/crock.png" width="90" height="90" alt="Mr Croc" />
  &nbsp;&nbsp;
  <img src="src/assets/frog.png" width="100" height="100" alt="Frog" />
</p>

<h1 align="center"><strong>Klyo: The Intelligent Workspace</strong></h1>
<p align="center">
  <strong>Get more done without the stress.</strong><br/>
  Klyo is a simple, all-in-one place for your calendar, tasks, and <strong>AI assistants — Mr. Croc & Dr. Frog</strong>.
</p>

<p align="center">
  <img width="1920" height="1080" alt="898_1x_shots_so" src="https://github.com/user-attachments/assets/52483a91-8833-4e57-9087-121ac9c658f3" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Powered%20By-Groq-orange?style=flat" />
  <img src="https://img.shields.io/badge/Stack-React%20%2B%20TypeScript-blue?style=flat" />
  <img src="https://img.shields.io/badge/UI-Tailwind%20%2B%20Framer-fuchsia?style=flat" />
</p>

---

## The Klyo Experience

Klyo isn't just a calendar; it's a unified environment designed to reduce cognitive load and keep you in the flow.

### Specialized AI Assistant Swarm (@mentions)
Meet your new executive elite team. Klyo now features a multi-specialist Swarm powered by a **Hybrid Retrieval-Augmented Generation (RAG)** engine.
*   **@crock**: Your charismatic, witty, and versatile lead assistant.
*   **@coach**: An empathetic productivity mentor focused on well-being and identifying burnout risk.
*   **@analyst**: A high-performance, data-driven strategist for optimization and trends.
*   **@planner**: A master of spatial-temporal coordination for resolving calendar conflicts.
*   **@frog**: The **Swarm Orchestrator**. Invoke Dr. Frog to have all specialists debate your schedule in a multi-perspective discussion before delivering a unified master verdict.

### Advanced Temporal Intelligence
*   **Context Aware**: AI assistant's know your schedule better than you do, resolution-focused on high-priority items.
*   **Year-Aware Filtering**: Strict temporal logic that prioritizes current (2026) and future events, with automatic fallback for historical queries.
*   **Timing Precision**: Strict enforcement of exact [TIME] brackets in all responses to ensure professional-level reliability.
*   **Blazing Fast**: Integrated with **Groq llama-3.3-70b** for near-instant execution.

### Dynamic Calendar View
A fluid, interactive calendar with multiple views designed for peak organization:
*   **Month, Week, & Year Views**: Seamlessly toggle between granular schedules and high-level overviews.
*   **Smooth Transitions**: Fully responsive layouts with fluid animations powered by Framer Motion.
*   **Deep Navigation**: Click any day in the Year or Month view to drill down instantly.

### Intelligent Analytics & Visualization
Visualize your productivity with high-fidelity tools.
*   **GitHub-Style Heatmap**: An advanced yearly analysis engine.
    *   **Interactive History**: Automatically detects your earliest activity to build a complete chronological history.
    *   **Adaptive Year Selector**: Smart, horizontally scrollable year pills that adapt to your screen—cleanly contained on mobile, expansive on desktop.
    *   **Total Activity Tracking**: Seamlessly combines calendar events and completed tasks (with due dates) into a single unified productivity score.
    *   **Pro-Level Scaling**: Large activity counts are elegantly formatted (e.g., `1.5k`, `10M`) for a professional aesthetic.
    *   **Integrated Layout**: A compact, pixel-perfect design with visible interaction rings.
*   **Performance Metrics**: Track your completion rates and category distributions with our built-in metrics suite.

### Productivity Mood Tracking
Add emotional and behavioral context to your productivity workflow.
*   **Intuition Tagging**: Native mood selectors (🧠 Focus, ⚡ Stress, 🍀 Easy, 🔋 Exhaust) for every event and task.
*   **Burnout Analysis**: Smart analytics that calculate burnout risk based on your emotional data.
*   **Mood-Aware AI**: Mr. Crock leverages your mood history to provide personalized encouragement and productivity warnings.

### World Clock (Global Explorer)
*   **1000+ Cities**: Track time across the globe with our new World Clock feature, supporting over 1000+ cities.
*   **Real-Time Local States**: Stay in sync with international teams and friends by viewing the exact local time and state for any city instantly.
*   **Quick Search**: Easily search for any location to add to your personal global dashboard.

### Unified Task Sidebar
A persistence-enabled manager for your to-dos, allowing you to prioritize and execute without leaving your main workspace.

---

## Technical Excellence

Klyo is built on a modern, high-performance stack:

*   **Frontend**: React 18 + Vite (for lightning-fast HMR)
*   **Intelligence**: Groq SDK + Custom Hybrid RAG (Vector Similarity + Lexical Search)
*   **Styling**: Tailwind CSS (Glassmorphic UI)
*   **Animations**: Framer Motion (Fluid interactions)
*   **Icons**: Lucide React
*   **State**: Custom Hooks with LocalStorage persistence

---

## Getting Started

Experience Klyo locally in minutes.

### Prerequisites
*   Node.js (v18+)
*   Groq API Key (Set in `.env` as `VITE_GROQ_KEY`)

### Installation
```bash
# Clone the repository
git clone https://github.com/alexcj10/klyo.git

# Enter the directory
cd klyo

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Running with Docker 

Pull and run the pre-built Docker image:

```bash
# Pull the latest image
docker pull ghcr.io/alexcj10/klyo:latest

# Run with your Groq API key
docker run -d -p 8080:80 \
  -e VITE_GROQ_KEY=your_groq_api_key_here \
  --name klyo-app \
  ghcr.io/alexcj10/klyo:latest
```

**Note**: Replace `your_groq_api_key_here` with your actual Groq API key. Get one at [console.groq.com](https://console.groq.com).

Access the app at: `http://localhost:8080`

---

## Architecture

```
klyo/
├── src/
│   ├── components/   → Modular React components (Calendar, Mr. Crock, Sidebar)
│   ├── utils/        → The RAG engine, similarity logic, and date helpers
│   ├── data/         → Data schemas and initial mock states
│   ├── hooks/        → Advanced state management & persistence
│   └── types/        → Strict TypeScript definitions
└── project_config/  → Vite, Tailwind, and Environment setups
```

---

## Contribution Guide

We love professional collaboration! 

1.  **Fork** the repository and create your feature branch.
2.  **Code** with high standards: Clean, Type-Safe, and Documented.
3.  **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
    *   `feat:` (New feature)
    *   `fix:` (Bug fix)
    *   `docs:` (Documentation)
    *   `refactor:` (Code improvement)
4.  **PR** with a clear description and testing results.

---

<p align="center">
  Built with ❤️ by Alex (<a href="https://github.com/alexcj10">@alexcj10</a>).<br/>
  <em>"Plan. Prioritize. Progress."</em>
</p>
