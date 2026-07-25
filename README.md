# PocketVerse — Serialized Story AI Command Center

> **PocketVerse** is an end-to-end Tech-Noir web application designed for serialized fiction authors, audio drama showrunners, and web-fiction writers. It enables creators to write, organize multi-episode series, and execute guided 4-step AI continuity and character reviews using OpenAI (`gpt-4o` & `gpt-4o-mini`) before publishing.

---

## 📐 System Architecture & Workflow

PocketVerse is built with a decoupled monorepo architecture: a React 18 single-page app on the frontend, an Express REST API backend, an embedded SQLite database, and server-side OpenAI integration.

```mermaid
graph TD
    User["Creator / Author"] --> Frontend["React 18 SPA (Vite + TypeScript)"]
    Frontend -->|"REST API Calls (/api)"| Backend["Express Server (Port 5000)"]
    Backend -->|"Queries & Mutations"| SQLite[("SQLite DB (pocketverse.db)")]
    Backend -->|"Dynamic Key Resolution"| AIService["AIService (OpenAI Prompt Engine)"]
    AIService -->|"gpt-4o (Continuity & Tone Remix)"| OpenAI["OpenAI API"]
    AIService -->|"gpt-4o-mini (Copyediting Pass)"| OpenAI
    AIService -.->"Offline Fallback Parser"| Fallback["Dynamic Word Inspection Engine"]
```

---

## 🎨 Tech-Noir Design System

PocketVerse uses a custom-built Tech-Noir design system implemented in pure CSS ([main.css](file:///home/chethan/Hackathon/pocketverse/frontend/src/styles/main.css)):

- **Void Background**: `#0B0708` deep dark surface with fixed background grid overlay (`linear-gradient(rgba(217, 30, 54, 0.03))`).
- **Panel Surface**: `#150F10` dark containers and `#1F1718` elevated cards with 1px subtle borders.
- **Red Halo Glow**: Primary accent `#D91E36` with radial glows (`rgba(217, 30, 54, 0.35)`).
- **Typography**: Google Fonts — `Archivo Black` & `Space Grotesk` for all-caps grotesk headers, `Inter` for body text.
- **1px Status Pills**: Pill badges for episode statuses:
  - `Draft`: Gray border (`--ink-muted`)
  - `Analyzed`: Amber border (`#D97706`)
  - `Finalized`: Glowing red accent (`#D91E36`)
- **Custom Red-on-Black Scrollbar**: Custom `::-webkit-scrollbar` with `#5A1620` thumb, `#D91E36` glowing hover, and `#0B0708` track.

---

## 🚀 Complete Feature Matrix

### 1. Multi-Episode Series Management
- **Series Creation Modal**: Creators can create multi-episode series with titles and descriptions.
- **Episode Navigation Sidebar**: Episode list displaying episode numbers, titles, draft/analyzed/finalized status pill badges, and quick delete/add actions.
- **Auto-Saving**: Script updates auto-save to backend before running the AI analysis pipeline.

### 2. The 4-Step Guided AI Diagnostic Wizard
The core value of PocketVerse is its step-by-step wizard ([WizardContainer.tsx](file:///home/chethan/Hackathon/pocketverse/frontend/src/components/Wizard/WizardContainer.tsx)) powered by a **20+ Year Veteran Storyteller Persona**:

```
[ Step 1: Continuity & Hook ] ➔ [ Step 2: Grammar Layer ] ➔ [ Step 3: Tone Remix ] ➔ [ Step 4: Save & Publish ]
```

#### Step 1: Continuity & Story-Hole Check (`gpt-4o`)
- **Plot Hole & Character Voice Audit**: Analyzes current episode script for narrative flaws, character voice inconsistencies, and motivation gaps.
- **Episode N-1 Cross-Referencing**: Automatically matches current episode against Episode N-1 to check for lore breaches, timeline leaps, or character knowledge errors.
- **Ending Cliffhanger Rating (1–10)**: Evaluates ending tension. If flat, generates a master editor cliffhanger rewrite.
- **Interactive Fixes**: Creators can click **"Accept Suggestion"** to substitute proposed fixes inline.
- **Inline Previous Episode Editor Drawer**: Allows creators to edit and re-save Episode N-1's manuscript on the fly without leaving the wizard.

#### Step 2: Copyediting & Audio Pacing Layer (`gpt-4o-mini`)
- **Copyediting Scan**: Identifies up to 10 grammar, punctuation, dialogue cadence, and audio drama performance fixes.
- **Single-Click Substitution**: Replaces problematic snippets directly in the manuscript.

#### Step 3: Genre Improvisation & Tone Remix (`gpt-4o`)
- **Category Picker**: Offers **Noir, Cyberpunk, Horror, Funny, Drama, Sci-Fi** styles.
- **Side-by-Side Preview**: Displays original manuscript alongside OpenAI's genre-remixed version.
- **Continuity & Identity Retention**: Improvise atmospheric prose while strictly preserving core plot beats and character identities.

#### Step 4: Save & Publish
- Merges all accepted continuity, grammar, and tone edits into the manuscript.
- Updates episode status from `draft` / `analyzed` to `finalized`.
- Unlocks Reader Mode.

### 3. Bounded Script Reader Surface
- **Reader Mode**: Formatted reader view ([FinishedEpisodeView.tsx](file:///home/chethan/Hackathon/pocketverse/frontend/src/components/FinishedEpisodeView.tsx)) displaying finalized scripts.
- **Bounded Height & Custom Scrollbar**: Bounded to `max-height: 480px` with `overflow-y: auto` and custom red-on-black scrollbars, preventing long scripts (e.g. 1000+ words) from stretching the page.
- **Metadata Badges**: Shows paragraph counts, word counts, finalization dates, and the **VERIFIED SCRIPT** badge.

### 4. Custom Skill Persona Integration
- Custom skill defined at [.agents/skills/storyteller_editor/SKILL.md](file:///home/chethan/Hackathon/pocketverse/.agents/skills/storyteller_editor/SKILL.md).
- Embeds a 20+ year veteran fiction showrunner and audio drama editor persona into all OpenAI prompt requests.

---

## 🗄️ Database Schema (SQLite)

Located in [schema.ts](file:///home/chethan/Hackathon/pocketverse/backend/src/db/schema.ts):

### `series` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID primary key |
| `title` | TEXT | Series title |
| `description` | TEXT | Optional description |
| `creator_id` | TEXT | Creator identifier (`creator-default`) |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

### `episodes` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID primary key |
| `series_id` | TEXT (FK) | References `series(id)` |
| `episode_number`| INTEGER | Order sequence (1, 2, 3...) |
| `title` | TEXT | Episode title |
| `content` | TEXT | Episode manuscript text |
| `status` | TEXT | `draft` \| `analyzed` \| `finalized` |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

### `analysis_runs` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID primary key |
| `episode_id` | TEXT (FK) | References `episodes(id)` |
| `step1_continuity`| TEXT (JSON) | Continuity findings & cliffhanger rating |
| `step2_grammar` | TEXT (JSON) | Array of copyediting fixes |
| `step3_tone` | TEXT (JSON) | Category, original vs remixed script |
| `status` | TEXT | `in_progress` \| `completed` |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

---

## 📡 REST API Endpoint Specifications

All endpoints run on `http://127.0.0.1:5000/api`:

### Series Endpoints
- **`GET /api/series`**: Returns all series with episode counts.
- **`POST /api/series`**: Creates a new series (`{ title, description }`).
- **`GET /api/series/:id`**: Returns series details with associated episodes sorted by `episode_number`.

### Episode Endpoints
- **`POST /api/series/:seriesId/episodes`**: Creates a new episode.
- **`GET /api/episodes/:id`**: Fetches episode details and latest analysis run.
- **`PUT /api/episodes/:id`**: Updates episode title, content, or status.
- **`DELETE /api/episodes/:id`**: Deletes episode.

### Analysis Pipeline Endpoints
- **`POST /api/episodes/:id/analysis/continuity`**: Executes Step 1 Continuity check against Episode N-1 via `gpt-4o`.
- **`POST /api/episodes/:id/analysis/grammar`**: Executes Step 2 Copyediting check via `gpt-4o-mini`.
- **`POST /api/episodes/:id/analysis/tone`**: Executes Step 3 Genre Remix via `gpt-4o` (`{ category: 'Noir' | 'Cyberpunk' | ... }`).
- **`POST /api/episodes/:id/analysis/save`**: Finalizes manuscript, merges edits, sets status to `finalized`.

---

## 🔑 Environment Variables & Security

Configured in [backend/.env](file:///home/chethan/Hackathon/pocketverse/backend/.env):

```env
PORT=5000

# OpenAI API Key for live gpt-4o analysis
OPENAI_API_KEY=sk-proj-your-key-here
```

- **Dynamic Loading**: `getOpenAIClient()` in `aiService.ts` evaluates `OPENAI_API_KEY` on every request.
- **Git Protection**: `.gitignore` excludes `.env`, `backend/.env`, `node_modules/`, `dist/`, `*.db`, and log files from version control.

---

## 🗺️ Codebase File Map

```
pocketverse/
├── package.json                    # Monorepo scripts (dev, build, start)
├── start.sh                        # Unified start script (concurrently)
├── .gitignore                      # Git exclusion rules
├── README.md                       # Comprehensive project blueprint
├── .agents/skills/storyteller_editor/
│   └── SKILL.md                    # 20+ Year Veteran Storyteller Persona definition
├── backend/
│   ├── .env                        # Backend environment configuration
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts               # Express app & route wiring
│       ├── db/schema.ts            # SQLite table initialization & DB helpers
│       ├── services/aiService.ts   # OpenAI client (gpt-4o/gpt-4o-mini) & fallback engine
│       └── controllers/
│           ├── seriesController.ts
│           ├── episodeController.ts
│           └── analysisController.ts
└── frontend/
    ├── package.json
    ├── vite.config.ts              # Port 3000 & /api proxy to 5000
    ├── index.html
    └── src/
        ├── App.tsx                 # Main layout & state management
        ├── main.tsx                # Entry point
        ├── types/index.ts          # TypeScript domain interfaces
        ├── api/client.ts           # REST API client
        ├── styles/main.css         # Tech-Noir design tokens & custom scrollbars
        └── components/
            ├── Header.tsx          # Top navbar & creator badge
            ├── SeriesModal.tsx     # Series creation modal
            ├── EpisodeList.tsx     # Sidebar episode timeline with status pills
            ├── EpisodeEditor.tsx   # Manuscript editor with auto-save
            ├── FinishedEpisodeView.tsx # Reader view with bounded scrollbar
            └── Wizard/
                ├── WizardContainer.tsx # Stepper header & navigation
                ├── Step1Continuity.tsx  # Step 1 UI & previous episode drawer
                ├── Step2Grammar.tsx     # Step 2 Copyediting UI
                ├── Step3ToneRemix.tsx   # Step 3 Genre adaptation preview
                └── Step4Save.tsx        # Step 4 Finalize & persist UI
```

---

## ⚡ Quickstart

Run the complete stack with a single command:
```bash
./start.sh
```

- **Frontend**: [http://localhost:3000/](http://localhost:3000/)
- **Backend API**: `http://127.0.0.1:5000`
