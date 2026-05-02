import { useState } from "react";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";

function Spinner() {
  return (
    <div className="flex items-center gap-3 text-sm text-text-secondary">
      <span
        className="inline-block size-4 shrink-0 rounded-full border-2 border-brand-primary border-t-transparent animate-spin"
        aria-hidden
      />
      <span>Calling Groq…</span>
    </div>
  );
}

export default function AiLogAnalyzer() {
  const [logInput, setLogInput] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [modelUsed, setModelUsed] = useState("");
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    const trimmed = logInput.trim();
    if (!trimmed) {
      toast.warn("Paste a log first.");
      return;
    }

    setLoading(true);
    setAnalysis("");
    setModelUsed("");

    try {
      const res = await fetch(`${API_BASE}/api/ai/analyze-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.details || data?.error || "Request failed";
        toast.error(msg);
        setAnalysis(`**Could not analyze**\n\n${msg}`);
        return;
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
        setModelUsed(data.model || "");
        toast.success("Analysis ready.");
      } else {
        toast.warn("Empty response from analyzer.");
      }
    } catch {
      toast.error("Could not reach the backend.");
      setAnalysis(
        "**Network error**\n\nEnsure the API is running (e.g. port 5000 / Docker backend).",
      );
    } finally {
      setLoading(false);
    }
  };

  const hasOutput = Boolean(analysis) || loading;

  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
          AI log analyzer
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-text-secondary leading-snug max-w-3xl">
          Paste a CI log or a digest from Logs. Requires{" "}
          <code className="px-1 py-px rounded bg-bg-deep border border-border-default text-brand-primary text-[0.7rem] sm:text-xs">
            GROQ_API_KEY
          </code>{" "}
          in backend{" "}
          <code className="px-1 py-px rounded bg-bg-deep border border-border-default text-text-muted text-[0.7rem] sm:text-xs">
            .env
          </code>
          .
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-6 lg:items-stretch lg:min-h-[min(70vh,720px)]">
        {/* Input column */}
        <section className="flex flex-col flex-1 min-w-0 lg:basis-[46%] rounded-xl border border-border-default bg-bg-card/90 backdrop-blur-sm shadow-soft p-4 sm:p-5">
          <label
            htmlFor="ai-log-input"
            className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2"
          >
            Log input
          </label>
          <textarea
            id="ai-log-input"
            value={logInput}
            onChange={(e) => setLogInput(e.target.value)}
            placeholder="Paste output here…"
            spellCheck={false}
            rows={12}
            className="w-full flex-1 min-h-[180px] sm:min-h-[220px] lg:min-h-0 lg:flex-1 px-3 py-2.5 text-xs sm:text-sm font-mono rounded-lg border border-border-default bg-bg-deep text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-y"
          />

          <div className="flex flex-wrap gap-2 mt-3 shrink-0">
            <button
              type="button"
              disabled={loading}
              onClick={runAnalysis}
              className="text-xs sm:text-sm font-bold px-4 py-2 rounded-lg bg-brand-primary text-bg-deep hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing…" : "Analyze"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setLogInput("");
                setAnalysis("");
                setModelUsed("");
              }}
              className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg border border-border-default bg-bg-deep/60 text-text-secondary hover:text-text-primary"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Results column — always visible so layout doesn’t feel empty */}
        <section className="flex flex-col flex-1 min-w-0 mt-5 lg:mt-0 lg:basis-[54%] rounded-xl border border-border-default bg-bg-code/80 shadow-soft overflow-hidden min-h-[240px] sm:min-h-[280px] lg:min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-border-default bg-bg-elevated/40 shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Result
            </span>
            {modelUsed ? (
              <span className="text-[0.65rem] sm:text-xs text-text-muted truncate max-w-[60%]">
                <span className="text-text-secondary">Model:</span>{" "}
                <code className="text-brand-primary">{modelUsed}</code>
              </span>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 text-xs sm:text-sm leading-relaxed text-[#e6edf3] font-mono whitespace-pre-wrap break-words">
            {!hasOutput && (
              <p className="text-text-muted text-sm font-sans leading-relaxed m-0">
                Output appears here after you run analyze — same pane on
                desktop and mobile, so nothing sits awkwardly below a huge blank
                area.
              </p>
            )}
            {loading && !analysis && (
              <div className="py-2">
                <Spinner />
              </div>
            )}
            {analysis ? analysis : null}
          </div>
        </section>
      </div>
    </div>
  );
}
