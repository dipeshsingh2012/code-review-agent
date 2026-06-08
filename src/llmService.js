const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function reviewCode(diffs, repositoryName) {
  const prompt = buildPrompt(diffs, repositoryName);
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      return parseResponse(raw);
    } catch (err) {
      lastError = err;
      console.warn(`Gemini attempt ${attempt + 1} failed:`, err.message);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  console.error("Gemini failed after retries:", lastError);
  return { summary: "LLM review failed", issues: [] };
}

function buildPrompt(diffs, repositoryName) {
  const filesBlock = diffs
    .map((d) => `### File: ${d.filePath}\n\`\`\`\n${d.content}\n\`\`\``)
    .join("\n\n");

  return `You are a senior frontend engineer performing a code review on a React/TypeScript codebase (repository: ${repositoryName}).

Analyze the following code changes for:
1. **Correctness** — bugs, logic errors, race conditions
2. **Performance** — unnecessary re-renders, missing memoization, expensive computations in render
3. **React best practices** — hooks rules, proper dependency arrays, state management patterns
4. **Readability & maintainability** — naming, complexity, component decomposition
5. **Accessibility (a11y)** — missing ARIA attributes, keyboard navigation, semantic HTML
6. **Security** — XSS via dangerouslySetInnerHTML, unsanitized inputs, exposed secrets
7. **Anti-patterns** — prop drilling, God components, inline object/function creation in JSX

Respond ONLY with valid JSON matching this schema:
{
  "summary": "Brief overall assessment (1-2 sentences)",
  "issues": [
    {
      "type": "performance | bug | readability | security | accessibility | anti-pattern",
      "severity": "low | medium | high",
      "file": "filename",
      "line": "line number or range if identifiable, else null",
      "suggestion": "Specific actionable fix"
    }
  ]
}

If the code looks good, return: { "summary": "No issues found.", "issues": [] }

Code to review:
${filesBlock}`;
}

function parseResponse(raw) {
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn("Failed to parse Gemini JSON, raw:", raw.slice(0, 500));
    return { summary: "Parse error", issues: [] };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { reviewCode, buildPrompt };
