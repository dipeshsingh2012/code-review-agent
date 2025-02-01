const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE_URL = "https://api.github.com";

async function getDiff({ owner, repo, prNumber }) {
  const resp = await fetch(`${BASE_URL}/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
    headers: authHeaders(),
  });

  if (!resp.ok) throw new Error(`GitHub API error: ${resp.status}`);
  const files = await resp.json();

  const results = await Promise.all(
    files
      .filter((f) => f.status !== "removed")
      .map(async (f) => {
        const content = await fetchFileContent(f.raw_url);
        return { filePath: f.filename, content, patch: f.patch || "" };
      })
  );

  return results;
}

async function fetchFileContent(rawUrl) {
  const resp = await fetch(rawUrl, { headers: authHeaders() });
  if (!resp.ok) return "";
  return resp.text();
}

async function postReviewComment({ owner, repo, prNumber, body }) {
  const resp = await fetch(`${BASE_URL}/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });

  if (!resp.ok) throw new Error(`GitHub comment error: ${resp.status}`);
  console.log(`Posted review comment to PR #${prNumber}`);
}

function authHeaders() {
  return { Authorization: `token ${GITHUB_TOKEN}`, "User-Agent": "code-review-agent" };
}

module.exports = { getDiff, postReviewComment };
