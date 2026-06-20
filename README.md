# SoftwareNode

A Notion-inspired local desktop application built with Electron and React. All data is stored locally — no cloud, no account required.

## Features

- **Rich Text Notes** — Block-based editor powered by BlockNote with full formatting support
- **Database** — Custom spreadsheets with text, number, checkbox, date, and select column types
- **Calendar** — Event scheduling with recurring events, time ranges, and color labels
- **Finance Tracker** — Income/expense logging with categories and recurring entries
- **Content Planner** — Manage content ideas across platforms with status tracking (idea → published)
- **Library** — Personal book list with reading status and progress tracking
- **Tasks** — Simple to-do list with due dates and categories
- **Nested Pages** — Organize pages in a hierarchy with drag-and-drop reordering
- **Sidebar Categories** — Group pages into custom sections
- **Resizable Sidebar** — Drag to resize, or hide it entirely

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Electron 31 |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Editor | BlockNote |
| Database | better-sqlite3 (local SQLite) |
| State | Zustand |
| Bundler | Vite |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/yourusername/SoftwareNode.git
cd SoftwareNode
npm install
```

### Run in Development

```bash
npm run dev
```

This starts the Vite dev server and Electron together.

### Build

```bash
npm run build
```

Outputs an AppImage for Linux (configurable in `package.json` under `build`).

## Project Structure

```
SoftwareNode/
├── electron/
│   ├── main.js        # Electron main process, window setup
│   ├── preload.js     # IPC bridge (window.api)
│   └── database.js    # SQLite schema and query handlers
├── src/
│   ├── components/    # React views (Editor, CalendarView, DatabaseView, …)
│   ├── store/         # Zustand state (selected page, sidebar width)
│   ├── types.ts       # Shared TypeScript interfaces
│   └── App.tsx        # Root layout and routing
├── index.html
└── vite.config.ts
```

## Data Storage

All data is persisted in a local SQLite database via `better-sqlite3`. The database file is created automatically in the app's user data directory on first launch. No internet connection is ever required.

## License

See [LICENSE](LICENSE).
