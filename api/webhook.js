const { getDiff, postReviewComment } = require("../src/githubService");
const { reviewCode } = require("../src/llmService");
const { formatReview } = require("../src/reviewFormatter");
const { notify } = require("../src/notifier");

const MAX_DIFF_CHARS = 12000;
const FRONTEND_EXTENSIONS = /\.(js|jsx|ts|tsx)$/;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(200).send("OK");

  const event = req.headers["x-github-event"];
  if (event === "ping") return res.status(200).send("pong");
  if (event !== "pull_request") return res.status(200).send("ignored");

  const { action, pull_request, repository } = req.body;
  if (!["opened", "synchronize"].includes(action)) {
    return res.status(200).send("ignored action");
  }

  try {
    const owner = repository.owner.login;
    const repo = repository.name;
    const prNumber = pull_request.number;

    const diffs = await getDiff({ owner, repo, prNumber });
    const frontendDiffs = diffs.filter((d) => FRONTEND_EXTENSIONS.test(d.filePath));

    if (!frontendDiffs.length) {
      return res.status(200).send("No frontend files to review.");
    }

    const chunks = chunkDiffs(frontendDiffs, MAX_DIFF_CHARS);
    const allIssues = [];

    for (const chunk of chunks) {
      const result = await reviewCode(chunk, repo);
      if (result?.issues?.length) allIssues.push(...result.issues);
    }

    if (!allIssues.length) {
      return res.status(200).send("No issues found.");
    }

    const formatted = formatReview(allIssues);
    await postReviewComment({ owner, repo, prNumber, body: formatted });
    await notify({ repo, prNumber, issueCount: allIssues.length });

    res.status(200).send(`Posted ${allIssues.length} findings.`);
  } catch (err) {
    console.error("Code review agent failed:", err);
    res.status(500).send("Internal error");
  }
};

function chunkDiffs(diffs, maxChars) {
  const chunks = [];
  let current = [];
  let currentSize = 0;

  for (const diff of diffs) {
    const size = diff.content.length;
    if (currentSize + size > maxChars && current.length) {
      chunks.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(diff);
    currentSize += size;
  }
  if (current.length) chunks.push(current);
  return chunks;
}
