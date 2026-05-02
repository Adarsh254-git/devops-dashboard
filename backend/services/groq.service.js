const axios = require("axios");

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_ANALYSIS_SYSTEM_PROMPT = `You are a senior DevOps / CI engineer. The user pastes logs from GitHub Actions, Docker builds, npm/yarn/pnpm, tests (Jest/Vitest/pytest), or shell scripts.

Respond ONLY in Markdown with exactly these sections (use these headings verbatim):
## What happened
Plain-language explanation a non-expert can follow (2–6 short paragraphs or bullets).

## How to fix
Numbered, actionable steps (commands, file paths, config checks when inferable). If the log is ambiguous, say what evidence is missing and how to gather it.

Rules:
- Quote or paraphrase the most relevant failing lines; do not invent exact errors not suggested by the log.
- Prefer the smallest safe change first (re-run, cache, permissions, env vars, dependency pins).
- If the build actually succeeded or only shows warnings, say so clearly.`;

async function analyzeLogWithGroq(logText) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is not set");
    err.code = "NO_GROQ_KEY";
    throw err;
  }

  const model =
    process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

  const response = await axios.post(
    GROQ_CHAT_URL,
    {
      model,
      messages: [
        { role: "system", content: GROQ_ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this CI/build log excerpt:\n\n${logText}`,
        },
      ],
      temperature: 0.25,
      max_tokens: 4096,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 120000,
      validateStatus: () => true,
    },
  );

  const { status, data } = response;

  if (status < 200 || status >= 400) {
    const msg =
      data?.error?.message || data?.message || `Groq HTTP ${status}`;
    const err = new Error(msg);
    err.status = status >= 400 && status < 600 ? status : 502;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    const err = new Error("Groq returned no message content");
    err.status = 502;
    throw err;
  }

  return { analysis: content, model };
}

module.exports = { analyzeLogWithGroq };
