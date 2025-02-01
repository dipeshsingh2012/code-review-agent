const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function notify({ repo, prNumber, issueCount }) {
  if (!SLACK_WEBHOOK_URL) return;

  const text = `🤖 *Code Review Agent* reviewed PR #${prNumber} in \`${repo}\` — found *${issueCount}* issue(s).`;

  await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

module.exports = { notify };
