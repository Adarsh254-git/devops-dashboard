const { analyzeLogWithGroq } = require("../services/groq.service");

async function analyzeLog(req, res) {
  try {
    const raw = req.body?.log ?? req.body?.text ?? "";
    const log = typeof raw === "string" ? raw.trim() : "";
    if (!log) {
      return res.status(400).json({
        error: "Missing log text",
        details: 'Send JSON body: { "log": "paste log here" }',
      });
    }

    const maxLen = 48000;
    const clipped =
      log.length > maxLen
        ? `${log.slice(0, maxLen)}\n\n… (input truncated for analysis)`
        : log;

    const { analysis, model } = await analyzeLogWithGroq(clipped);
    res.json({ analysis, model });
  } catch (err) {
    if (err.code === "NO_GROQ_KEY") {
      return res.status(503).json({
        error: "Groq is not configured",
        details:
          "Set GROQ_API_KEY in backend/.env (Groq Cloud Console). Optional: GROQ_MODEL (default llama-3.3-70b-versatile).",
      });
    }
    const status = typeof err.status === "number" ? err.status : 502;
    console.error("analyze-log:", err.message);
    res.status(status >= 400 ? status : 502).json({
      error: "Analysis failed",
      details: err.message,
    });
  }
}

module.exports = { analyzeLog };
