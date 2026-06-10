# TCF Canada Score Tracker

Track your TCF Canada practice test scores locally in the browser.

## Features

- Log full or single-section practice tests (scores 100–699)
- Dashboard with percentage trends, streaks, and section balance
- Filterable scores table with date range and section filters
- Lightweight profiles (name only, no password)
- Export/import JSON backup
- CEFR level mapping and target goals per section

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
npm run build
```

Push to GitHub and import the repo in [Vercel](https://vercel.com). No environment variables required.

## Data Storage

All data is stored in `localStorage` per browser. Use **Settings → Export JSON** to back up your scores.
