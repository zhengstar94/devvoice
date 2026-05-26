# DevVoice

English Output Trainer for Software Engineers - Convert Chinese technical work descriptions into multiple English expression styles.

## Features

Convert Chinese technical work descriptions into 4 English expression styles:

1. **Daily Standup** - Brief standup style, covering yesterday's accomplishments, today's plans, and any blockers
2. **Interview STAR** - STAR format (Situation, Task, Action, Result) for professional storytelling
3. **Email/Slack** - Professional workplace communication style
4. **Jira Comment** - Technical documentation style with ID references

Supports custom prompts for each style, enabling flexible adaptation to different scenarios.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API credentials:

```env
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `ANTHROPIC_BASE_URL` | API endpoint | `https://api.anthropic.com` |
| `ANTHROPIC_MODEL` | Model name | `claude-sonnet-4-20250514` |

Compatible with any service that supports the Anthropic protocol (e.g., DeepSeek, proxy services). Simply update `ANTHROPIC_BASE_URL` to use an alternative provider.

## Custom Prompts

Click "Custom Prompts" on the page to configure prompts for each style individually. Leave empty to use default prompts.

## Tech Stack

- Next.js 14 App Router
- Tailwind CSS
- Anthropic SDK (direct invocation, no Vercel AI SDK required)
- TypeScript

## Project Structure

```
devvoice/
├── src/
│   └── app/
│       ├── api/convert/route.ts  # API route
│       ├── page.tsx              # Main page
│       └── layout.tsx            # Layout
├── .env.example                  # Environment template (committed to Git)
├── .env.local                    # Local environment (not committed)
└── .gitignore                    # Ignores .env.local
```

## License

MIT