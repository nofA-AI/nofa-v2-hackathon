# Trading Strategy Web

A no-code quantitative trading strategy builder powered by AI. Describe your strategy in plain language, and the AI agent parses it into a structured **Strategy Tree JSON** that can be backtested and deployed.

---

## Features

- **AI-Driven Strategy Creation** — Multi-turn conversation with an AI agent that detects missing fields and guides you to a complete, executable strategy.
- **Visual Strategy Tree Editor** — Drag-and-drop IF/ELSE decision tree with nested conditions, action blocks, and risk management nodes.
- **One-Click Backtesting** — Configure backtest parameters (date range, capital, etc.) and view performance metrics, equity curves, and historical allocation tables.
- **Community Feed** — Share strategies, follow traders, like/bookmark posts, and browse AI-curated market news.
- **Persistent Workspace** — Strategy trees and chat history auto-save to `localStorage`; undo/redo is supported per strategy.
- **Resizable Layout** — Three-panel layout (Strategy List · Strategy Editor / Backtest · AI Chat) with a draggable divider.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Radix UI, Phosphor Icons |
| State | Zustand 5, Immer |
| Data Fetching | TanStack React Query v5 |
| AI / LLM | Vercel AI SDK (`ai`), `@ai-sdk/openai`, OpenRouter |
| Charts | ECharts 6, Recharts, Lightweight Charts |
| Database | PostgreSQL via Prisma 6 |
| Auth | Privy (wallet + social login) |
| Forms | React Hook Form + Zod |
| Animation | Motion (Framer Motion) |
| Utilities | dayjs, bignumber.js, nanoid, ts-pattern, sonner |

---

## Prerequisites

- **Node.js** ≥ 18
- **yarn** (recommended) or npm
- **PostgreSQL** database (for community features)
- **Privy** account → [console.privy.io](https://console.privy.io)
- (Optional) **OpenRouter** or compatible OpenAI-compatible API key for the AI chat

---

## Installation & Running

### 1. Clone the repo

```bash
git clone git@github.com:nofA-AI/nofa-v2-hackathon.git
cd nofa-v2-hackathon
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `POSTGRES_PRISMA_URL` | PostgreSQL connection string (pooled) |
| `POSTGRES_URL_NON_POOLING` | PostgreSQL connection string (direct / migrations) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID |
| `NEXT_PRIVY_APP_SECRET` | Privy application secret |
| `PRIVY_VERIFICATION_KEY` | Privy JWT verification key or JWKS URL |
| `NEXT_PUBLIC_BACKTEST_API_URL` | Backtest backend endpoint |

### 4. Set up the database

```bash
# Push schema to your database
yarn db:push

# (Optional) Seed with sample data
yarn db:seed
```

### 5. Start the dev server

```bash
yarn dev
# App runs on http://localhost:3002
```

### 6. Build for production

```bash
yarn build
yarn start
```

---

## Database Scripts

| Script | Description |
|---|---|
| `yarn db:generate` | Re-generate Prisma client |
| `yarn db:push` | Sync schema to DB (no migration history) |
| `yarn db:migrate` | Create a migration and apply it |
| `yarn db:seed` | Seed sample profiles, posts, and news |
| `yarn db:studio` | Open Prisma Studio GUI |
| `yarn db:reset` | Drop and recreate the database |

---

## Project Structure

```
app/
  (main)/          # Main application routes
    page.tsx       # Strategy builder home page
    community/     # Community feed
  api/             # Next.js API routes (chat, posts, profiles, news, backtest)
  generated/       # Prisma client output
components/        # React components
  ai-chat-panel    # AI conversation panel
  strategy-*       # Strategy editor and tree viewer
  main-content-*   # Backtest results, editor tabs
lib/
  store/           # Zustand stores (strategy, chat)
prisma/
  schema.prisma    # Database schema
  seed.ts          # Database seed script
```

---

## Authentication

This project uses **Privy** for authentication, supporting:
- Email / Social login
- Wallet connect (EVM)

After setting up your Privy app, add the App ID and secret to `.env`. No demo accounts are pre-configured — register through the Privy-powered login flow.

---

## Deployment

The app is optimized for **Vercel**:

1. Push to GitHub/GitLab.
2. Import the project in [vercel.com](https://vercel.com).
3. Add all environment variables in the Vercel dashboard.
4. Deploy. Prisma's `postinstall` script (`prisma generate`) runs automatically.

For other platforms (Railway, Render, Fly.io), ensure `yarn build` is the build command and all env vars are set.

---

## License

This project is **private** and not licensed for public distribution. All rights reserved.
