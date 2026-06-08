# AI Code Review Agent

Automated code review for GitHub pull requests using Google Gemini, hosted on Vercel.

## Architecture

```
GitHub PR → Webhook → Vercel Serverless Function → Gemini → PR Comment
                                                 ↘ Slack (optional)
```

## Setup

### Prerequisites
- GitHub account
- Vercel account (free)
- Gemini API key (from Google AI Studio)
- GitHub Personal Access Token (with `repo` scope)

### 1. Get API Keys

**Gemini API Key:**
- Go to https://aistudio.google.com/apikey
- Create a new API key (free tier: 15 RPM)

**GitHub Token:**
- Go to https://github.com/settings/tokens
- Create a token with `repo` scope

### 2. Deploy to Vercel

1. Go to https://vercel.com → Sign in with GitHub
2. Click "Import Project" → Select `code-review-agent` repo
3. Add Environment Variables:
   - `GEMINI_API_KEY` = your Gemini key
   - `GITHUB_TOKEN` = your GitHub PAT
4. Click "Deploy"

Your webhook URL will be: `https://your-project.vercel.app/api/webhook`

### 3. Configure GitHub Webhook

1. Go to your target repo → Settings → Webhooks → Add webhook
2. **Payload URL**: `https://your-project.vercel.app/api/webhook`
3. **Content type**: `application/json`
4. **Events**: Select "Pull requests"
5. Click "Add webhook"

## Configuration

| Env Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` scope |
| `GEMINI_MODEL` | No | Default: `gemini-1.5-flash` |
| `SLACK_WEBHOOK_URL` | No | Slack notification webhook |

## Project Structure

```
code-review-agent/
├── api/
│   └── webhook.js          # Vercel serverless function entry point
├── src/
│   ├── githubService.js    # GitHub API: fetch diff + post comments
│   ├── llmService.js       # Gemini prompt + API call + retry
│   ├── reviewFormatter.js  # JSON → markdown formatting
│   └── notifier.js         # Slack notification (optional)
├── test/
│   ├── event-pr-created.json
│   ├── sample-llm-response.json
│   └── run.js
├── vercel.json
├── package.json
└── README.md
```

## How It Works

1. **Trigger** — GitHub webhook fires on PR open/update
2. **Diff Extraction** — Fetches changed files via GitHub API
3. **Chunking** — Large diffs split into chunks under 12K chars
4. **LLM Review** — Gemini returns JSON with issues by type/severity
5. **Post Comments** — Formatted markdown posted as PR comment
6. **Notify** — Optional Slack message with summary
