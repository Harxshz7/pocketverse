# PocketVerse — Serialized Story AI Command Center

> **PocketVerse** is a platform for serialized story creators (audio drama & web-fiction writers) to manage multi-episode series with AI-assisted continuity, copyediting, and genre remixing before publishing.

---

## ⚡ Key Value Proposition

Writing multi-episode audio dramas and web fiction is challenging—small continuity details, character voice slips, or weak episode endings can break audience immersion. PocketVerse provides creators with a **guided, step-by-step diagnostic wizard** powered by OpenAI (`gpt-4o`) to review narrative logic, polish dialogue pacing, and improvise genre tone before finalizing scripts.

---

## ✨ Features

- **Red-on-Black Tech-Noir Aesthetic**: Designed as a high-contrast "creator command center" with `#0B0708` void backgrounds, glowing red accents (`#D91E36`), all-caps grotesk headers (`Archivo Black` / `Space Grotesk`), and background circuit grid overlays.
- **4-Step Guided Diagnostic Wizard**:
  1. **Continuity & Story-Hole Check**: Analyzes current script logic, cross-references Episode N-1 for continuity (characters, timeline, facts), and rates the ending cliffhanger (1–10).
  2. **Grammar & Dialogue Pacing Layer**: Surfacing copyediting issues and dialogue cadence improvements with 1-click accept toggles.
  3. **Tone / Genre Remix**: Improvise atmospheric rewrites into **Noir, Cyberpunk, Horror, Comedy, Drama, or Sci-Fi** while strictly preserving core plot beats and continuity.
  4. **Save & Publish**: Merges accepted fixes, updates episode status to `FINALIZED`, and unlocks Reader View.
- **Edit Previous Episode Feature**: Step 1 includes a live editor modal allowing creators to update Episode N-1 on the fly during continuity reviews.
- **Unified Creator Identity**: Single streamlined creator authorization flow without complex role middleware.
- **Custom Bounded Reader View**: Reader mode card features a sleek red-on-black custom scrollbar (`max-height: 480px`), keeping long manuscripts formatted cleanly.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons
- **Backend**: Node.js, Express, SQLite (`sqlite3` / `better-sqlite3`), TypeScript
- **AI Integration**: Server-side OpenAI API (`gpt-4o` for continuity & tone remix, `gpt-4o-mini` for copyediting)
- **Concurrently**: Single script execution runner (`./start.sh`)

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Node.js `v18+` or `v20+` / `v24`
- npm `v9+`

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/pocketverse.git
cd pocketverse
npm install
```

### 3. Environment Configuration
Create a `.env` file inside the `backend/` directory (or edit `backend/.env`):
```env
PORT=5000

# Add your OpenAI API Key below for live GPT-4o analysis
OPENAI_API_KEY=sk-proj-your-api-key-here
```

### 4. Running the Application
Launch both backend API server and frontend dev server with a single command:
```bash
./start.sh
```
Or using npm:
```bash
npm run dev
```

Open your browser and navigate to:
- **Frontend Command Center**: [http://localhost:3000/](http://localhost:3000/)
- **Backend API**: `http://127.0.0.1:5000`

---

## 📁 Repository Structure

```
pocketverse/
├── package.json              # Root package and launch scripts
├── start.sh                  # One-click shell launcher script
├── README.md                 # Project documentation
├── .gitignore                # Excludes node_modules, binaries, .env & DB files
├── .agents/                  # Skill custom definitions (.agents/skills/storyteller_editor/)
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example          # Template environment config
│   ├── src/
│   │   ├── server.ts         # Express API entry point
│   │   ├── db/               # SQLite database schemas and query helpers
│   │   ├── controllers/      # Series, Episode & Analysis Controllers
│   │   └── services/         # AIService (OpenAI API integration & prompt engine)
└── frontend/
    ├── package.json
    ├── vite.config.ts        # Vite server setup & API proxy config
    ├── index.html
    └── src/
        ├── App.tsx           # Primary dashboard layout manager
        ├── main.tsx          # React DOM entry
        ├── styles/
        │   └── main.css      # Tech-Noir CSS design tokens & custom scrollbars
        ├── components/       # Header, SeriesModal, EpisodeList, EpisodeEditor, FinishedEpisodeView
        └── components/Wizard/# 4-Step Analysis Wizard (Step 1 to Step 4)
```

---

## 🔒 Security & Privacy

- **API Key Security**: The `OPENAI_API_KEY` is loaded strictly on the server side in `backend/.env` and is never exposed to client-side JS bundles.
- **Git Hygiene**: `.gitignore` is configured to prevent committing `.env` secrets, `node_modules/`, database files (`*.db`), or binary build outputs.

---

## 📜 License

MIT License © 2026 PocketVerse Team
