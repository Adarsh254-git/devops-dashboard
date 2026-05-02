const mongoose = require("mongoose");

/**
 * Persisted alerts (manual, webhook-ingested, or synced from CI).
 * githubRunId links back to GitHub Actions when applicable.
 */
const alertSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["critical", "warning", "info", "watching"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 500 },
    body: { type: String, default: "", maxlength: 20000 },
    source: {
      type: String,
      enum: ["github_actions", "manual", "prometheus", "other"],
      default: "github_actions",
    },
    githubRunId: { type: Number, sparse: true, index: true },
    htmlUrl: { type: String, default: "" },
    branch: { type: String, default: "" },
    conclusion: { type: String, default: "" },
    workflowStatus: { type: String, default: "" },
    acknowledgedAt: { type: Date, default: null },
    dismissedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

alertSchema.index({ createdAt: -1 });
alertSchema.index({ dismissedAt: 1, createdAt: -1 });

module.exports = mongoose.models.Alert || mongoose.model("Alert", alertSchema);
