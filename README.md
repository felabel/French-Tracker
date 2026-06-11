# TCF Canada Score Tracker

Track your TCF Canada practice test scores, Expression écrite writings, and vocabulary — locally and synced via Vercel KV.

## Features

- Log full or single-section practice tests (scores 100–699)
- NCLC + CEFR level mapping per section
- Dashboard with percentage trends, streaks, and section balance
- Expression écrite journal (prompt + subject + text)
- Vocabulary bank with categories for Compréhension écrite
- Cloud sync across devices via Sync ID (Vercel KV)
- Collapsible sidebar navigation
- Export/import JSON backup

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloud Sync Setup (Vercel KV)

1. Deploy to Vercel
2. In your Vercel project → **Storage** → add **Redis** (Upstash) from the Marketplace
3. Environment variables `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set automatically
4. In the app → **Settings** → **Cloud Sync** → **Generate new ID**
5. Enter the same Sync ID on every device (localhost, phone, Vercel URL)

Data syncs automatically on save (2s debounce) and on app load.

## Deploy to Vercel

```bash
npm run build
```

Push to GitHub and import in [Vercel](https://vercel.com). Add the Redis/KV integration for cloud sync.

## Data Storage

- **Local:** `localStorage` per browser (offline-first)
- **Cloud:** Vercel KV blob keyed by your Sync ID
- **Backup:** Settings → Export JSON
