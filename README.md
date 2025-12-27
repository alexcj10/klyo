# <p align="center"> <img src="src/assets/crock.png" width="80" height="80" alt="Klyo Logo" /><br/>Klyo: The Intelligent Workspace</p>

<p align="center">
  <strong>Get more done without the stress.</strong><br/>
  Klyo is a simple, all-in-one place for your calendar, tasks, and <strong>Mr. Crock AI</strong> assistant.
</p>

<p align="center">
  <img width="1920" height="1080" alt="361shots_so" src="https://github.com/user-attachments/assets/561130e3-83e7-4bb6-82ca-df95fdc28148" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Powered%20By-Groq-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Stack-React%20%2B%20TypeScript-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/UI-Tailwind%20%2B%20Framer-fuchsia?style=for-the-badge" />
</p>

---

## 🌟 The Klyo Experience

Klyo isn't just a calendar; it's a unified environment designed to reduce cognitive load and keep you in the flow.

### 🐊 Mr. Crock RAG AI
Meet your new executive assistant. Mr. Crock isn't a standard chatbot—he's powered by a **Hybrid Retrieval-Augmented Generation (RAG)** engine.
*   **Context Aware**: He knows your schedule better than you do.
*   **Smart Filtering**: He distinguishes between past, present, and future events with strict temporal logic.
*   **Blazing Fast**: Integrated with **Groq llama-3.3-70b** for near-instant responses.
*   **Witty & Adaptable**: Whether you need a serious briefing or a witty joke, Mr. Crock adapts his tone to yours.

### 📅 Dynamic Calendar View
A fluid, interactive calendar that supports multiple views (Month, Day, Analytics) and features smooth transitions powered by Framer Motion.

### 📊 Intelligent Analytics
Visualize your productivity. Track your performance, category distributions, and completion rates with our built-in analytics suite.

### 🌍 World Clock (Global Explorer)
*   **1000+ Cities**: Track time across the globe with our new World Clock feature, supporting over 1000+ cities.
*   **Real-Time Local States**: Stay in sync with international teams and friends by viewing the exact local time and state for any city instantly.
*   **Quick Search**: Easily search for any location to add to your personal global dashboard.

### 📋 Unified Task Sidebar
A persistence-enabled manager for your to-dos, allowing you to prioritize and execute without leaving your main workspace.

---

## 🛠️ Technical Excellence

Klyo is built on a modern, high-performance stack:

*   **Frontend**: React 18 + Vite (for lightning-fast HMR)
*   **Intelligence**: Groq SDK + Custom Hybrid RAG (Vector Similarity + Lexical Search)
*   **Styling**: Tailwind CSS (Glassmorphic UI)
*   **Animations**: Framer Motion (Fluid interactions)
*   **Icons**: Lucide React
*   **State**: Custom Hooks with LocalStorage persistence

---

## 🚀 Getting Started

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

### Running with Docker 🐳

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

## 📂 Architecture

```
klyo/
├── 📁 src/
│   ├── 🧩 components/   → Modular React components (Calendar, Mr. Crock, Sidebar)
│   ├── 🛠️ utils/        → The RAG engine, similarity logic, and date helpers
│   ├── 📊 data/         → Data schemas and initial mock states
│   ├── 🪝 hooks/        → Advanced state management & persistence
│   └── 🎯 types/        → Strict TypeScript definitions
└── 📋 project_config/  → Vite, Tailwind, and Environment setups
```

---

## 🤝 Contribution Guide

We love professional collaboration! 🥂

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
  Built with ❤️ by the Klyo Team.<br/>
  <em>"Plan. Prioritize. Progress."</em>
</p>
