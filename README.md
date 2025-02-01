# AI Code Review Agent

Automated code review for GitHub pull requests using Google Gemini, hosted on GCP Cloud Functions.

## Architecture

```
GitHub PR → Webhook → GCP Cloud Function → Gemini → PR Comment
                                         ↘ Slack (optional)
```

## Setup

### Prerequisites
- Node.js 20+
- Google Cloud CLI (`gcloud`)
- Gemini API key (from Google AI Studio)
- GitHub Personal Access Token (with `repo` scope)

### 1. Get API Keys

**Gemini API Key:**
- Go to https://aistudio.google.com/apikey
- Create a new API key (free tier: 15 RPM)

**GitHub Token:**
- Go to https://github.com/settings/tokens
- Create a token with `repo` scope

### 2. Deploy to GCP

```bash
# Install dependencies
npm install

# Login to GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy
gcloud functions deploy code-review-agent \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=codeReviewHandler \
  --source=. \
  --set-env-vars="GEMINI_API_KEY=your-key,GITHUB_TOKEN=your-token"
```

After deploy, note the function URL (e.g. `https://REGION-PROJECT.cloudfunctions.net/code-review-agent`).

### 3. Configure GitHub Webhook

1. Go to your GitHub repo → Settings → Webhooks → Add webhook
2. **Payload URL**: Your Cloud Function URL
3. **Content type**: `application/json`
4. **Events**: Select "Pull requests"
5. Click "Add webhook"

### Local Testing

```bash
npm install
npm test                # Run unit tests
npm start              # Start local server on :8080
```

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
├── src/
│   ├── handler.js          # Cloud Function entry point
│   ├── githubService.js    # GitHub API: fetch diff + post comments
│   ├── llmService.js       # Gemini prompt + API call + retry
│   ├── reviewFormatter.js  # JSON → markdown formatting
│   └── notifier.js         # Slack notification (optional)
├── test/
│   ├── event-pr-created.json
│   ├── sample-llm-response.json
│   └── run.js
├── .env.example
├── package.json
└── README.md
```

## How It Works

1. **Trigger** — GitHub webhook fires on PR open/update
2. **Diff Extraction** — Cloud Function fetches changed files via GitHub API
3. **Chunking** — Large diffs split into chunks under 12K chars
4. **LLM Review** — Gemini returns JSON with issues by type/severity
5. **Post Comments** — Formatted markdown posted as PR comment
6. **Notify** — Optional Slack message with summary
