# <p align="center">Organize your day effortlessly with Klyo</p>
<img width="1920" height="1440" alt="31shots_so" src="https://github.com/user-attachments/assets/6d493468-507a-4866-a7b5-839ba0b6fbc6" />

<p align="center">
  <strong>Plan. Prioritize. Progress.</strong><br/>
  Minimal UI ✦ Blazing fast ✦ Powered by TypeScript + Tailwind + Vite
</p>

---

## ⚡ Quick Start

```bash
git clone https://github.com/alexcj10/klyo.git
cd klyo
npm install
npm run dev
```

> 🌍 Visit [localhost:5173](http://localhost:5173) to see it in action.

---

## 🧭 Project Layout

```
klyo/
├── 🌐 public/               → Static assets & favicons
├── 📁 src/
│   ├── 🧩 components/       → UI Components
│   │   ├── 📈 AnalyticsButton.tsx      → Analytics button
│   │   ├── 📊 AnalyticsDashboard.tsx   → Analytics dashboard
│   │   ├── 📝 AnalyticsModal.tsx       → Analytics modal
│   │   ├── 📅 CalendarView      → Core scheduler
│   │   ├── 📋 TaskSidebar       → Task manager
│   │   ├── ✏️ EventModal        → Add/edit events
│   │   ├── 👁️ EventViewModal    → View event details
│   │   ├── 📊 DayViewModal      → Daily breakdown
│   │   ├── 🎯 Header            → Top navigation
│   │   ├── 🔍 SearchOverlay     → Command palette
│   │   └── 🎬 SplashScreen      → App intro
│   ├── 📊 data/             → Mock data & constants
│   ├── 🪝 hooks/            → Custom React hooks
│   ├── 🎯 types/            → TypeScript definitions
│   ├── 🛠️ utils/            → Utility helpers
│   ├── 🚀 App.tsx           → Root layout
│   └── 🎯 main.tsx          → App entry
├── 📋 package.json          → Metadata & scripts
├── ⚙️ vite.config.ts        → Vite configuration
├── 🎨 tailwind.config.js    → Tailwind setup
└── 📖 README.md            → Documentation
```

---

## 🤝 Contribution Guide

### 🧱 Workflow

| Step | Description  | Command                                     |
| ---- | ------------ | ------------------------------------------- |
| 1️⃣  | Fork project | Click "Fork" on GitHub                      |
| 2️⃣  | Clone repo   | `git clone <your-fork-url>`                 |
| 3️⃣  | New feature  | `git checkout -b feature/awesome`           |
| 4️⃣  | Code & test  | Make it perfect 💅                          |
| 5️⃣  | Commit       | `git commit -m "feat: add awesome feature"` |
| 6️⃣  | Push         | `git push origin feature/awesome`           |
| 7️⃣  | PR           | Open a Pull Request 📬                      |

---

### 🧠 Code Standards

* ✅ Follow established conventions
* ✨ Use semantic names (clear, contextual)
* 💡 Type everything (TypeScript FTW)
* 📚 Comment tricky logic blocks
* ♻️ Modularize logic into utils/hooks/components
* 🧪 Write tests for important features

---

### 🔖 Commit Naming (Conventional Commits)

| Type        | Emoji | Purpose                         | Example                             |
| ----------- | ----- | ------------------------------- | ----------------------------------- |
| `feat:`     | ✨     | New feature                     | `feat: add dark mode`               |
| `fix:`      | 🐛    | Bug fix                         | `fix: resolve modal crash`          |
| `docs:`     | 📝    | Documentation updates           | `docs: add API usage section`       |
| `style:`    | 🎨    | Code style changes (no logic)   | `style: format with prettier`       |
| `refactor:` | 🔧    | Code restructure (no features)  | `refactor: optimize date parsing`   |
| `test:`     | ✅     | Add/update tests                | `test: add tests for calendar view` |
| `chore:`    | 🔁    | Misc changes (builds/deps/etc.) | `chore: bump tailwind to v3.4`      |

---

### 🐞 Reporting Bugs

Please include:

* ✅ Clear problem description
* 📸 Screenshots or screen recording
* 🔁 Reproduction steps
* 🌐 Environment (browser/OS/version)

---

### 💡 Suggesting Features

To propose enhancements:

* 🎯 Describe the feature clearly
* 📍 Explain the use case and benefit
* 🖼️ Include mockups if relevant
* 💬 Suggest how it could be implemented
