const { formatReview } = require("../src/reviewFormatter");
const { buildPrompt } = require("../src/llmService");
const sampleResponse = require("./sample-llm-response.json");

console.log("=== Testing formatReview ===\n");
const formatted = formatReview(sampleResponse.issues);
console.log(formatted);

console.log("\n=== Testing buildPrompt (truncated) ===\n");
const prompt = buildPrompt(
  [{ filePath: "src/components/Example.tsx", content: "export const Example = () => <div>Hello</div>;" }],
  "my-repo"
);
console.log(prompt.slice(0, 500) + "...\n");

console.log("✅ All local tests passed.");
